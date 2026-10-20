# Conecta

O **Conecta** é uma plataforma web educacional que reúne comunidades de estudo, conversas por canais, vídeos organizados por matéria e um assistente de inteligência artificial.

A aplicação foi construída com React no frontend e Supabase no backend. Usuários autenticados podem participar das conversas, usar a Conecta IA e manter um perfil próprio. Também existe um modo visitante, que permite explorar o conteúdo público sem criar uma conta.

## Funcionalidades

- Autenticação e cadastro de usuários;
- Perfis com nome, biografia, avatar e banner;
- Cadastro com seleção e matrícula em cursos;
- Comunidades divididas por matérias e canais, com mensagens persistidas no Supabase;
- Leitura pública das mensagens no modo visitante;
- Envio e moderação de mensagens para usuários autorizados;
- Papéis de proprietário, administrador, professor e aluno, gerenciados no servidor;
- Assistente educacional integrado a um provedor público de IA sem chave;
- Catálogo de vídeos educacionais do YouTube;
- Busca e filtros por matéria;

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
- API pública Pollinations para respostas de IA, sem chave.

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

Cadastro, perfis, cursos, mensagens, diretório de usuários, papéis e IA usam rotas da Edge Function. A leitura de mensagens é pública para o modo visitante; ações de escrita exigem autenticação e são autorizadas no servidor.

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

O proprietário é o usuário `gabrieltmacedo@aluno.colegioapoio.net`; a conta recebe esse papel ao entrar. Apenas ela pode promover usuários já cadastrados a administrador, professor ou aluno. O cadastro cria contas com e-mail confirmado pelo servidor, sem exigir confirmação na caixa de entrada.

A Conecta IA não requer chave. As conversas são encaminhadas pelo servidor ao serviço público Pollinations para gerar respostas; não envie dados pessoais ou informações confidenciais nesse chat. A disponibilidade e os limites desse serviço são definidos pelo provedor.

## Modo visitante

Na tela inicial, a opção **Explorar sem entrar** libera uma experiência somente de visualização. Visitantes podem navegar pelas comunidades, ler mensagens e assistir aos vídeos, mas precisam entrar ou criar uma conta para enviar mensagens, conversar com a IA ou acessar um perfil.
