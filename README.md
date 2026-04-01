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
7. Preencha `SUPABASE_ACCESS_TOKEN` para deploy das Edge Functions pela CLI. O script atual tambem aceita `VITE_SUPABASE_ACCESS_TOKEN` como fallback legado.
8. Defina `VITE_PASSWORD_RESET_URL` com a URL publica do app.
9. Rode `npm run dev`.

### Auth admin real

O fluxo administrativo nao usa hardcode, bypass nem credenciais mockadas.

Fluxo esperado:

1. O usuario faz login via Supabase Auth.
2. O frontend le `session.user.id`.
3. O app consulta `public.staff_profiles` pelo mesmo UUID.
4. O acesso ao admin so e liberado quando:
   - existe linha em `staff_profiles`
   - `role = 'admin'`
   - `is_active = true`
5. Se o perfil nao existir, estiver inativo ou tiver outro papel, o acesso ao admin e bloqueado com mensagem clara.

O campo que vincula Auth e perfil e `staff_profiles.id`.
Nao existe `user_id` separado para admin neste projeto.

### Provisionar um admin real

Opcao recomendada:

1. Crie o usuario em `Authentication > Users`.
2. Confirme o email do usuario.
3. Descubra o UUID em `auth.users`.
4. Execute [supabase/bootstrap_admin.sql](/home/limax44/appmobilebarbearia/supabase/bootstrap_admin.sql) ajustando os valores.

Opcao de patch para ambientes existentes:

1. Rode [supabase/patch_remove_admin_hardcode.sql](/home/limax44/appmobilebarbearia/supabase/patch_remove_admin_hardcode.sql).
2. Rode [supabase/bootstrap_admin.sql](/home/limax44/appmobilebarbearia/supabase/bootstrap_admin.sql).

Helper SQL disponivel no schema:

```sql
select public.upsert_admin_staff_profile(
  'UUID_REAL_DO_AUTH',
  'admin@opaitaon.com',
  'Administrador',
  null,
  true
);
```

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

### Validacao do admin

Checklist minimo:

```bash
./node_modules/.bin/tsc --noEmit --pretty false
npm run build
npm run dev
```

Teste manual:

1. Acesse `/admin/login`.
2. Entre com um usuario real do Supabase Auth que tenha `role = 'admin'` e `is_active = true` em `staff_profiles`.
3. Confirme carregamento de `/admin`.
4. Confirme leitura de barbeiros, agendamentos e metricas.
5. Faça logout.
6. Teste um usuario autenticado sem perfil admin e confirme o bloqueio.
7. Teste um admin inativo e confirme a mensagem `Usuario inativo.`.

Smoke test automatizada:

```bash
export ADMIN_TEST_CASES='[
  {"email":"admin@opaitaon.com","password":"SENHA_ADMIN_REAL"},
  {"email":"barbeiro@opaitaon.com","password":"SENHA_BARBEIRO_REAL"},
  {"email":"usuario-sem-perfil@opaitaon.com","password":"SENHA_REAL"},
  {"email":"admin-inativo@opaitaon.com","password":"SENHA_REAL"}
]'

npm run smoke:admin
```

### RLS relevante

Pontos centrais do schema:

- `public.is_admin()` usa apenas `staff_profiles`.
- `staff_profiles_self_or_admin_select` permite ler o proprio perfil ou qualquer perfil quando `public.is_admin()` for verdadeiro.
- `barber_profiles_*`, `appointments_admin_read_all`, `services_admin_write`, `promotions_admin_write` e policies afins dependem de `public.is_admin()`.
- O publico continua usando apenas RPCs e policies publicas especificas para home/agendamento.

### Deploy

Frontend:

```bash
npm run build
vercel --prod --yes
```

Banco e funcoes:

```bash
SUPABASE_ACCESS_TOKEN=... npx --yes supabase@latest --dns-resolver https db query --linked --file supabase/patch_remove_admin_hardcode.sql
SUPABASE_ACCESS_TOKEN=... npx --yes supabase@latest --dns-resolver https db query --linked --file supabase/bootstrap_admin.sql
SUPABASE_ACCESS_TOKEN=... npx --yes supabase@latest functions deploy manage-staff-user --project-ref gsncinbwlcwdupatsqcw
```

### Troubleshooting

- Login admin autentica mas nao entra:
  verifique se `staff_profiles.id = auth.users.id`, `role = 'admin'` e `is_active = true`.
- Usuario existe no Auth mas nao no painel:
  rode `public.upsert_admin_staff_profile(...)`.
- Admin ve erro 403 na Edge Function:
  confirme se o token Bearer pertence a um admin ativo e se `manage-staff-user` foi redeployada.
- Sessao existe mas a rota redireciona:
  verifique a mensagem mostrada em `/admin/login`; ela agora reflete o erro real de perfil/sessao quando possivel.

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
