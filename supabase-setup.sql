-- Configuração do Supabase para NDA Fast
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de análises
CREATE TABLE IF NOT EXISTS analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    document_type TEXT NOT NULL DEFAULT 'nda',
    document_text TEXT NOT NULL,
    analysis_result JSONB NOT NULL,
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_risk_score ON analyses(risk_score);

-- Habilitar Row Level Security (RLS)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas suas próprias análises
CREATE POLICY "Users can view own analyses" ON analyses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: usuários podem inserir suas próprias análises
CREATE POLICY "Users can insert own analyses" ON analyses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: permitir inserção anônima (para MVP - depois remova isso)
CREATE POLICY "Allow anonymous insert" ON analyses
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Política: permitir leitura anônima (para MVP - depois remova isso)
CREATE POLICY "Allow anonymous select" ON analyses
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger se existir, depois criar
DROP TRIGGER IF EXISTS update_analyses_updated_at ON analyses;
CREATE TRIGGER update_analyses_updated_at
    BEFORE UPDATE ON analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE analyses IS 'Armazena as análises de documentos realizadas pela IA';
COMMENT ON COLUMN analyses.document_type IS 'Tipo do documento (nda, msa, employment, etc)';
COMMENT ON COLUMN analyses.analysis_result IS 'Resultado da análise em formato JSON';
COMMENT ON COLUMN analyses.risk_score IS 'Score de risco de 0 a 10';
