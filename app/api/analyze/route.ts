import { NextRequest, NextResponse } from 'next/server';
import { analyzeNDA, NDAAnalysis } from '@/lib/anthropic';
import { saveAnalysis } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { documentText, documentType = 'nda' } = await request.json();

    if (!documentText || documentText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Texto do documento é obrigatório' },
        { status: 400 }
      );
    }

    // Analyze the document using Anthropic
    const analysis: NDAAnalysis = await analyzeNDA(documentText);

    // Persistir no Supabase (opcional — falha não cancela a resposta)
    try {
      await saveAnalysis({
        document_type: documentType,
        document_text: documentText.substring(0, 10000), // Limit text size
        analysis_result: analysis as unknown as Record<string, unknown>,
        risk_score: analysis.riskScore,
      });
    } catch (persistErr) {
      console.error('Não foi possível gravar a análise no Supabase:', persistErr);
    }

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error) {
    console.error('Erro na análise:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Falha ao analisar documento', details: errorMessage },
      { status: 500 }
    );
  }
}
