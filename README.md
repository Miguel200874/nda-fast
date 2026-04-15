# NDA Fast

Análise inteligente de contratos e NDAs usando IA (Claude Anthropic).

![NDA Fast](https://img.shields.io/badge/Next.js-14-black)
![Anthropic](https://img.shields.io/badge/Anthropic-Claude%20Sonnet%204.6-orange)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)

## Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **IA:** Anthropic Claude API (Claude Sonnet 4.6)
- **Database:** Supabase (PostgreSQL)
- **Custo por análise:** ~$0.02 USD

## Configuração Inicial

### 1. Supabase (Database)

1. Acesse https://supabase.com/dashboard
2. Vá em seu projeto → SQL Editor
3. Cole e execute o conteúdo de `supabase-setup.sql`
4. Isso cria a tabela `analyses` com as políticas de segurança

### 2. Anthropic API

Crie um arquivo `.env.local` baseado em `.env.example` e preencha suas credenciais:
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` (opcional)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Rodar Localmente

```bash
# Instalar dependências (já feito)
npm install

# Rodar em desenvolvimento
npm run dev

# Acessar em http://localhost:3001
```

## Estrutura do Projeto

```
app/
├── api/analyze/route.ts    # API endpoint que chama Claude
├── page.tsx                # Interface principal
├── layout.tsx              # Layout da aplicação
lib/
├── anthropic.ts           # Cliente Anthropic + tipos
└── supabase.ts            # Cliente Supabase
```

## Como Usar

1. Cole o texto de um NDA na área de texto
2. Clique em "Analisar NDA"
3. Veja o resultado:
   - **Score de Risco** (1-10)
   - **Cláusulas de Alto Risco** com recomendações
   - **Cláusulas Não-Padrão**
   - **Recomendações Gerais**

## Expansão para Outros Documentos

O sistema já suporta múltiplos tipos. Para adicionar um novo:

1. Em `lib/anthropic.ts`, adicione um novo prompt em `systemPrompts`
2. No frontend, adicione um seletor de tipo de documento
3. Pronto! A mesma API funciona para todos.

## Deploy

### Vercel (Recomendado)

```bash
npm i -g vercel
vercel
```

Configure as variáveis de ambiente no painel da Vercel:
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Outros

Build estático:
```bash
npm run build
```

## Próximos Passos

1. [ ] Upload de PDFs (usar pdf-parse)
2. [ ] Autenticação de usuários (Supabase Auth)
3. [ ] Histórico de análises por usuário
4. [ ] Exportar relatório em PDF
5. [ ] Adicionar mais tipos de documentos (MSA, contratos de trabalho, etc)

## Licença

MIT
