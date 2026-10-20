# Conecta

O **Conecta** é uma plataforma web educacional que reúne comunidades de estudo, conversas por canais, vídeos organizados por matéria e um assistente de inteligência artificial.

A aplicação foi construída com React no frontend e Supabase no backend. Usuários autenticados podem participar das conversas, usar a Conecta IA e manter um perfil próprio. Também existe um modo visitante, que permite explorar o conteúdo público sem criar uma conta.

## Funcionalidades

- Autenticação e cadastro de usuários;
- Perfis com nome, biografia, avatar e banner;
- Comunidades divididas por matérias e canais;
- Leitura pública das mensagens no modo visitante;
- Envio e moderação de mensagens para usuários autorizados;
- Assistente educacional integrado à API da Anthropic Claude;
- Catálogo de vídeos educacionais do YouTube;
- Busca e filtros por matéria;
- Papéis de usuário, incluindo aluno, professor, administrador e proprietário.

## Tecnologias

### Frontend

- React 19;
- TypeScript;
- Vite;
- Tailwind CSS;
- Supabase JS.

### Backend

- Supabase Edge Functions;
- Hono;
- Supabase Auth;
- Supabase Storage;
- KV Store;
- Anthropic Claude API.

## Arquitetura

O frontend está concentrado em `src/`:

- `src/App.tsx`: interface e fluxo principal da aplicação;
- `src/services/authService.ts`: autenticação, sessão e perfil;
- `src/services/chatService.ts`: consulta e envio de mensagens;
- `src/services/aiService.ts`: comunicação com a Conecta IA;
- `src/data/`: comunidades e vídeos disponíveis na plataforma.

O backend está em `supabase/functions/server/`:

- `index.tsx`: rotas HTTP da Edge Function;
- `kv_store.tsx`: persistência de perfis e mensagens no KV Store.

As rotas de perfil, criação de mensagens e IA exigem autenticação. A leitura de mensagens é pública para permitir o funcionamento do modo visitante.

## Executando localmente

Instale as dependências:

```bash
pnpm install
```

Inicie o frontend:

```bash
pnpm dev
```

Para gerar o bundle de produção:

```bash
pnpm build
```

## Configuração

O frontend precisa estar conectado a um projeto Supabase. A Edge Function utiliza as variáveis fornecidas pelo ambiente do Supabase, incluindo:

- `SUPABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`;
- `ANTHROPIC_API_KEY`;
- `ANTHROPIC_MODEL` — opcional.

A chave da Anthropic deve ser configurada como segredo da Edge Function e nunca incluída diretamente no código ou enviada ao navegador.

## Modo visitante

Na tela inicial, a opção **Explorar sem entrar** libera uma experiência somente de visualização. Visitantes podem navegar pelas comunidades, ler mensagens e assistir aos vídeos, mas precisam entrar ou criar uma conta para enviar mensagens, conversar com a IA ou acessar um perfil.
