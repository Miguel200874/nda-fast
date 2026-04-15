import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl?.trim() || !supabaseKey?.trim()) {
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
}

export const supabase = getClient();

export interface Analysis {
  id?: string;
  user_id?: string;
  document_type: string;
  document_text: string;
  analysis_result: Record<string, unknown>;
  risk_score: number;
  created_at?: string;
}

export async function saveAnalysis(analysis: Analysis) {
  if (!supabase) {
    console.warn('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return null;
  }

  const { data, error } = await supabase
    .from('analyses')
    .insert([analysis])
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar análise:', error);
    throw error;
  }

  return data;
}

export async function getAnalyses() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar análises:', error);
    throw error;
  }

  return data || [];
}
