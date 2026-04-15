import Anthropic from '@anthropic-ai/sdk';

/** Modelo ativo (claude-3-sonnet-20240229 foi aposentado em jul/2025). */
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

export interface NDAAnalysis {
  riskScore: number;
  highRiskClauses: Array<{
    clause: string;
    explanation: string;
    recommendation: string;
  }>;
  nonStandardClauses: Array<{
    clause: string;
    explanation: string;
  }>;
  generalRecommendations: string[];
  summary: string;
}

export async function analyzeNDA(ndaText: string): Promise<NDAAnalysis> {
  const response = await anthropic.messages.create({
    model: getModel(),
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Você é um advogado especializado em contratos empresariais com 20 anos de experiência em acordos de confidencialidade (NDA). Analise o seguinte NDA e forneça uma avaliação detalhada.

Responda APENAS em formato JSON válido com a seguinte estrutura:
{
  "riskScore": number (1-10, onde 10 é risco máximo),
  "highRiskClauses": [
    {
      "clause": "texto da cláusula",
      "explanation": "por que é arriscada",
      "recommendation": "sugestão de alteração"
    }
  ],
  "nonStandardClauses": [
    {
      "clause": "texto da cláusula",
      "explanation": "por que é diferente do padrão"
    }
  ],
  "generalRecommendations": ["recomendação 1", "recomendação 2"],
  "summary": "resumo geral em 2-3 frases"
}

NDA para análise:
---
${ndaText}
---

Responda APENAS com o JSON válido, sem texto adicional antes ou depois.`
      }
    ]
  });

  const content = (response.content[0] as { text?: string }).text || '';

  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('JSON não encontrado na resposta');
  } catch {
    console.error('Erro ao parsear resposta:', content);
    throw new Error('Falha ao analisar NDA: resposta inválida');
  }
}

export async function analyzeGenericDocument(
  documentText: string,
  documentType: string
): Promise<NDAAnalysis> {
  const systemPrompts: Record<string, string> = {
    'nda': 'Você é um advogado especializado em acordos de confidencialidade (NDA)...',
    'msa': 'Você é um advogado especializado em contratos de prestação de serviços (MSA)...',
    'employment': 'Você é um advogado trabalhista especializado em contratos de trabalho...',
    'vendor': 'Você é um advogado especializado em contratos de fornecimento...',
    'investment': 'Você é um advogado especializado em contratos de investimento e venture capital...',
  };

  const systemPrompt =
    systemPrompts[documentType] ?? systemPrompts['nda']!;

  const response = await anthropic.messages.create({
    model: getModel(),
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `${systemPrompt}

Analise o seguinte documento e forneça uma avaliação detalhada.

Responda APENAS em formato JSON válido com a seguinte estrutura:
{
  "riskScore": number (1-10),
  "highRiskClauses": [{"clause": "...", "explanation": "...", "recommendation": "..."}],
  "nonStandardClauses": [{"clause": "...", "explanation": "..."}],
  "generalRecommendations": ["..."],
  "summary": "..."
}

Documento para análise:
---
${documentText}
---

Responda APENAS com o JSON válido.`
      }
    ]
  });

  const content = (response.content[0] as { text?: string }).text || '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('JSON não encontrado na resposta');
  } catch {
    console.error('Erro ao parsear resposta:', content);
    throw new Error('Falha ao analisar documento');
  }
}
