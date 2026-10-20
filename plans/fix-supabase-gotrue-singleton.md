# Plano: eliminar instâncias duplicadas do Supabase GoTrueClient

## Objetivo

Eliminar o aviso:

`Multiple GoTrueClient instances detected in the same browser context`

sem desativar persistência de sessão, atualização automática de token, React `StrictMode` ou Fast Refresh.

## Diagnóstico confirmado

- O projeto usa `@supabase/supabase-js` `2.117.2`.
- A única instanciação do cliente Supabase no frontend está em `src/services/authService.ts`.
- O `storageKey` exibido no aviso corresponde ao projeto configurado em `utils/supabase/info.tsx`.
- `authService.ts` cria o cliente diretamente no escopo do módulo.
- No ambiente Vite/Figma Make, uma reavaliação do módulo por Fast Refresh pode manter a instância anterior viva e criar outra instância usando a mesma chave do Local Storage.
- `React.StrictMode` não é a causa direta, pois o cliente é criado fora do componente; ele deve permanecer habilitado.
- A Edge Function e o cliente server-side de `kv_store.tsx` não participam desse aviso do navegador e não devem ser alterados.

## Implementação

### 1. Centralizar o cliente em um módulo singleton

Criar `src/services/supabaseClient.ts` como o único ponto de criação e exportação do cliente do navegador.

O módulo deve:

- importar `createClient` e o tipo `SupabaseClient`;
- importar `projectId` e `publicAnonKey` de `utils/supabase/info.tsx`;
- declarar uma propriedade global tipada e exclusiva para o cliente do app;
- reutilizar essa propriedade quando ela já existir;
- chamar `createClient` somente quando ainda não houver instância armazenada;
- manter as opções atuais:
  - `persistSession: true`;
  - `autoRefreshToken: true`;
  - `detectSessionInUrl: true`;
- exportar uma única constante `supabase`.

Usar `globalThis` para manter a mesma instância entre reavaliações de módulo feitas pelo Fast Refresh. O nome da propriedade global deve ser específico do projeto/app para evitar colisão com outros clientes legítimos no mesmo documento.

### 2. Remover a criação direta de `authService.ts`

Em `src/services/authService.ts`:

- remover o import de `createClient`;
- remover a chamada local a `createClient`;
- importar e reexportar `supabase` de `src/services/supabaseClient.ts`, preservando a API pública atual para não quebrar consumidores futuros;
- manter toda a lógica existente de sessão, login, cadastro, perfil e APIs sem mudanças comportamentais.

### 3. Garantir uma única origem de cliente

Pesquisar novamente por `createClient(` no frontend e confirmar:

- apenas `src/services/supabaseClient.ts` instancia o cliente do navegador;
- `kv_store.tsx` continua sendo o único uso server-side, isolado dentro da Edge Function;
- nenhum componente cria clientes durante renderização ou efeitos.

## Arquivos envolvidos

- Novo: `src/services/supabaseClient.ts`
- Alterado: `src/services/authService.ts`

Não alterar:

- `src/main.tsx`;
- `utils/supabase/info.tsx`, pois é autogerado;
- `supabase/functions/server/kv_store.tsx`, pois é autogerado e executado no servidor;
- `supabase/functions/server/index.tsx`, que contém alterações locais não relacionadas.

## Verificação

1. Executar `pnpm exec tsc --noEmit`.
2. Executar `pnpm build`.
3. Executar `git diff --check`.
4. No preview já existente:
   - recarregar a página;
   - alternar entre login e modo visitante;
   - provocar ao menos um Fast Refresh editando e salvando um arquivo frontend;
   - confirmar que o console não volta a mostrar o aviso de múltiplos `GoTrueClient`;
   - confirmar que uma sessão autenticada continua persistindo após recarregar a página.
5. Confirmar que login, logout e leitura de sessão continuam usando a mesma instância exportada.

## Critérios de aceite

- Nenhum aviso de múltiplas instâncias `GoTrueClient` no carregamento ou após Fast Refresh.
- Apenas uma instância Supabase de navegador para o projeto.
- Sessão permanece persistente e o token continua sendo renovado automaticamente.
- Nenhuma alteração no comportamento de autenticação ou no backend.
- As alterações locais existentes na Edge Function permanecem intactas.
