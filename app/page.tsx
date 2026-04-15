'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { FileText, AlertCircle, CheckCircle, Shield, Loader2, Upload, Sparkles } from 'lucide-react';
import { NDAAnalysis } from '@/lib/anthropic';

export default function Home() {
  const [documentText, setDocumentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<NDAAnalysis | null>(null);
  const [error, setError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();
      if (text) pages.push(text);
    }

    return pages.join('\n\n');
  };

  const extractDocxText = async (file: File): Promise<string> => {
    const mammoth = await import('mammoth/mammoth.browser');
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    });
    return result.value.trim();
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setAnalysis(null);
    setSelectedFileName(file.name);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      let extractedText = '';

      if (extension === 'pdf') {
        extractedText = await extractPdfText(file);
      } else if (extension === 'docx') {
        extractedText = await extractDocxText(file);
      } else if (extension === 'txt') {
        extractedText = (await file.text()).trim();
      } else if (extension === 'doc') {
        throw new Error('Arquivo .doc não é suportado no navegador. Salve como .docx e tente novamente.');
      } else {
        throw new Error('Formato não suportado. Envie PDF, DOCX ou TXT.');
      }

      if (!extractedText) {
        throw new Error('Não foi possível extrair texto do arquivo.');
      }

      setDocumentText(extractedText);
    } catch (uploadErr) {
      setError(uploadErr instanceof Error ? uploadErr.message : 'Falha ao processar arquivo.');
      setSelectedFileName('');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAnalyze = async () => {
    if (!documentText.trim()) {
      setError('Por favor, cole o texto do NDA');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Erro na análise');
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-600 bg-green-100';
    if (score <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 3) return 'Baixo Risco';
    if (score <= 6) return 'Risco Moderado';
    return 'Alto Risco';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/90 border-b border-slate-200 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">NDA Fast</h1>
              <p className="text-sm text-slate-600">Análise de contratos com IA</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">Cole seu NDA</h2>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={handleFileUpload}
              />

              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  {uploading ? 'Processando arquivo...' : 'Adicionar PDF/Word'}
                </button>
                {selectedFileName && (
                  <p className="text-sm text-slate-600 self-center truncate">
                    Arquivo: <span className="font-medium text-slate-800">{selectedFileName}</span>
                  </p>
                )}
              </div>

              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Cole aqui o texto completo do seu Acordo de Confidencialidade (NDA)..."
                className="w-full h-64 sm:h-72 p-4 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-slate-900 placeholder:text-slate-400"
              />

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="bg-slate-100 px-2 py-1 rounded">PDF</span>
                <span className="bg-slate-100 px-2 py-1 rounded">DOCX</span>
                <span className="bg-slate-100 px-2 py-1 rounded">TXT</span>
                <span>ou cole o texto diretamente acima</span>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading || uploading}
                className="mt-4 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Analisando...
                  </>
                ) : (
                  'Analisar NDA'
                )}
              </button>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Dicas
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Cole o texto completo do contrato para melhor análise</li>
                <li>Verifique se não há informações pessoais sensíveis</li>
                <li>A análise leva cerca de 10-30 segundos</li>
                <li>Cada análise consome ~$0,02 de crédito API</li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {!analysis && !loading && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600">Cole um NDA e clique em analisar para ver os resultados</p>
              </div>
            )}

            {analysis && (
              <>
                {/* Risk Score */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600 mb-2">Score de Risco</p>
                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getRiskColor(analysis.riskScore)}`}>
                      {analysis.riskScore}
                    </div>
                    <p className={`mt-2 font-semibold ${getRiskColor(analysis.riskScore).split(' ')[0]}`}>
                      {getRiskLabel(analysis.riskScore)}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Resumo</h3>
                  <p className="text-slate-700 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* High Risk Clauses */}
                {analysis.highRiskClauses.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h3 className="text-lg font-semibold text-red-900">Cláusulas de Alto Risco ({analysis.highRiskClauses.length})</h3>
                    </div>
                    <div className="space-y-4">
                      {analysis.highRiskClauses.map((clause, idx) => (
                        <div key={idx} className="bg-red-50 rounded-lg p-4">
                          <p className="font-medium text-red-900 mb-2">{clause.clause}</p>
                          <p className="text-sm text-red-700 mb-2"><strong>Risco:</strong> {clause.explanation}</p>
                          <p className="text-sm text-red-800 bg-red-100 rounded p-2"><strong>Recomendação:</strong> {clause.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Non-Standard Clauses */}
                {analysis.nonStandardClauses.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-yellow-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-yellow-900">Cláusulas Não-Padrão ({analysis.nonStandardClauses.length})</h3>
                    </div>
                    <div className="space-y-3">
                      {analysis.nonStandardClauses.map((clause, idx) => (
                        <div key={idx} className="bg-yellow-50 rounded-lg p-3">
                          <p className="font-medium text-yellow-900 text-sm">{clause.clause}</p>
                          <p className="text-xs text-yellow-700 mt-1">{clause.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.generalRecommendations.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-900">Recomendações Gerais</h3>
                    </div>
                    <ul className="space-y-2">
                      {analysis.generalRecommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span className="text-slate-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
