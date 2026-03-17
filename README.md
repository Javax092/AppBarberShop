# O Pai ta on

App React com:

- fluxo do cliente
- painel do barbeiro
- links operacionais de WhatsApp
- regra de bloqueio para impedir dois clientes no mesmo horario do mesmo barbeiro
- slots de 10 minutos com buffer de 10 a 15 minutos

## Rodar

```bash
npm install
npm run dev
```

Preview de producao:

```bash
npm run build
npm run preview -- --port 4174
```

## Estrutura

- `src/App.jsx`: fluxo principal do produto
- `src/data.js`: barbeiros, servicos e dados iniciais
- `src/utils/schedule.js`: regras de agenda, bloqueio, buffers e slots
- `src/lib/supabase.js`: ponto inicial para migrar o estado local para Supabase
- `vercel.json`: fallback SPA para deploy no Vercel

## Supabase real

1. Crie um projeto no Supabase.
2. Rode o SQL de [`supabase/schema.sql`](/home/limax44/appmobilebarbearia/supabase/schema.sql).
3. Copie `.env.example` para `.env`.
4. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Rode `npm run dev`.

Sem essas credenciais, o app entra em fallback local para nao quebrar a demo.

## Proximos passos reais

1. Substituir `sampleAppointments` por leitura/escrita no Supabase.
2. Trocar links `wa.me` por WhatsApp Business API ou provedor oficial.
3. Adicionar autenticacao do barbeiro.
4. Criar dashboard financeiro e recorrencia para planos premium.
