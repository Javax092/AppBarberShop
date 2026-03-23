# O Pai ta on

App React para barbearia com:

- reserva publica por barbeiro
- login de equipe com Supabase Auth
- RLS real por perfil
- catalogo individual por profissional
- CRM de clientes
- fila de notificacoes pronta para WhatsApp oficial
- gestao de equipe e acesso
- galeria visual para cortes e marca

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

- `src/App.jsx`: orquestracao principal do app
- `src/components/`: secoes modulares da interface
- `src/data.js`: fallback local e brand assets
- `src/lib/api.js`: camada de dados e chamadas para Supabase/Edge Functions
- `src/lib/supabase.js`: cliente Supabase
- `supabase/schema.sql`: schema, RLS, RPCs de reserva segura e policies
- `supabase/seed.sql`: dados iniciais publicos compativeis com o schema atual
- `supabase/functions/manage-staff-user/`: Edge Function para criar/editar equipe
- `supabase/functions/process-whatsapp-queue/`: Edge Function para envio oficial via Meta

## Supabase

1. Rode o SQL de [supabase/schema.sql](/home/limax44/appmobilebarbearia/supabase/schema.sql).
2. Rode o SQL de [supabase/seed.sql](/home/limax44/appmobilebarbearia/supabase/seed.sql).
3. Crie os usuarios da equipe em `Authentication > Users` no dashboard do Supabase.
4. Insira ou atualize `public.staff_profiles` com os UUIDs reais gerados pelo Auth.
5. Copie `.env.example` para `.env`.
6. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
7. Preencha `SUPABASE_ACCESS_TOKEN` para deploy das Edge Functions pela CLI.
8. Defina `VITE_PASSWORD_RESET_URL` com a URL publica do app.
9. Rode `npm run dev`.

### Bootstrap da equipe

O app nao deve popular `auth.users` via SQL manual. Use sempre o Auth gerenciado do Supabase e associe os perfis na tabela `public.staff_profiles`.

Exemplo:

```sql
insert into public.staff_profiles (
  id,
  email,
  full_name,
  role,
  phone,
  barber_id,
  is_active
) values (
  'UUID_REAL_DO_AUTH',
  'admin@opaitaon.com',
  'Administrador',
  'admin',
  null,
  null,
  true
);
```

Para barbeiros, use o `id` do usuario Auth e o `barber_id` de um registro existente em `public.barbers`.

## WhatsApp oficial

O app usa o numero comercial `5592986202729` como referencia visual e de fila.

Para envio real pela Meta Cloud API, configure nas Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_NUMBER=5592986202729`

Sem `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID`, a fila existe, mas o disparo oficial nao acontece.

## Midia editavel

O app agora usa:

- tabela `public.app_brand_settings`
- tabela `public.gallery_posts`
- bucket `storage.opaitaon-media`

Admins podem trocar logo e posts pelo painel, sem editar codigo.

## Observacao operacional

O banco de producao precisa respeitar este fluxo:

- `schema.sql` aplicado sem erros
- `seed.sql` aplicado em banco limpo ou de homologacao
- usuarios criados pelo Supabase Auth
- `staff_profiles` sincronizado com os UUIDs reais do Auth
- Edge Functions configuradas com `SUPABASE_SERVICE_ROLE_KEY`
