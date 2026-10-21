import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

type UserRole = "owner" | "admin" | "professor" | "aluno";
type UserProfile = {
  id: string;
  email: string;
  name: string;
  bio: string;
  role: UserRole;
  avatarDataUrl: string | null;
  bannerDataUrl: string | null;
  joinedAt: string;
  courses: string[];
};

const courseIds = new Set(["colegio-apoio", "matematica", "portugues", "historia", "fisica", "quimica", "biologia"]);
const OWNER_EMAIL = "gabrieltmacedo@aluno.colegioapoio.net";
const adminClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function authenticatedUser(c: any) {
  const token = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await adminClient().auth.getUser(token);
  return error ? null : data.user;
}

async function profileFor(user: any): Promise<UserProfile> {
  const key = `profile:${user.id}`;
  const saved = await kv.get(key) as UserProfile | undefined;
  const ownerEmail = OWNER_EMAIL;
  if (saved) {
    let changed = false;
    if (!Array.isArray(saved.courses)) {
      saved.courses = [];
      changed = true;
    }
    if (ownerEmail && user.email?.toLowerCase() === ownerEmail && saved.role !== "owner") {
      saved.role = "owner";
      changed = true;
    }
    if (changed) await kv.set(key, saved);
    return saved;
  }

  const profile: UserProfile = {
    id: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Aluno",
    bio: "",
    role: ownerEmail && user.email?.toLowerCase() === ownerEmail ? "owner" : "aluno",
    avatarDataUrl: null,
    bannerDataUrl: null,
    joinedAt: user.created_at ?? new Date().toISOString(),
    courses: [],
  };
  await kv.set(key, profile);
  return profile;
}

function validCourses(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((course): course is string => typeof course === "string" && courseIds.has(course)))];
}

async function knownCourse(courseId: string): Promise<boolean> {
  return courseIds.has(courseId) || !!await kv.get(`community:${courseId}`);
}

function validCommunityId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 48;
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/communities", async (c) => {
  return c.json(await kv.getByPrefix("community:") as unknown[]);
});

app.post("/communities", async (c) => {
  const user = await authenticatedUser(c);
  if (!user) return c.json({ error: "Entre para criar uma comunidade." }, 401);
  if ((await profileFor(user)).role !== "owner") return c.json({ error: "Apenas o proprietário pode criar comunidades." }, 403);
  const body = await c.req.json().catch(() => ({}));
  const id = validCommunityId(body.id) ? body.id : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 240) : "";
  const emoji = typeof body.emoji === "string" ? body.emoji.slice(0, 8) : "📚";
  const color = typeof body.color === "string" && /^#[0-9a-f]{6}$/i.test(body.color) ? body.color : "#a9e58b";
  const channels = Array.isArray(body.channels) ? body.channels.slice(0, 12).filter((channel: any) =>
    channel && typeof channel.id === "string" && /^[a-z0-9-]{1,48}$/.test(channel.id) &&
    typeof channel.name === "string" && ["text", "voice"].includes(channel.type),
  ).map((channel: any) => ({ id: channel.id, name: channel.name.slice(0, 40), type: channel.type })) : [];
  const logoDataUrl = typeof body.logoDataUrl === "string" && body.logoDataUrl.length <= 2_100_000 ? body.logoDataUrl : null;
  const bannerDataUrl = typeof body.bannerDataUrl === "string" && body.bannerDataUrl.length <= 2_100_000 ? body.bannerDataUrl : null;
  if (!id || !name || channels.length === 0 || courseIds.has(id)) return c.json({ error: "Nome, identificador e ao menos um canal válido são obrigatórios." }, 400);
  if (await kv.get(`community:${id}`)) return c.json({ error: "Já existe uma comunidade com esse nome." }, 409);
  const community = { id, name, emoji, color, description, channels, logoDataUrl, bannerDataUrl };
  await kv.set(`community:${id}`, community);
  return c.json(community, 201);
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/signup", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const courses = validCourses(body.courses);
  if (!email || !name || password.length < 6 || courses.length === 0) {
    return c.json({ error: "Informe nome, e-mail, senha com ao menos 6 caracteres e escolha um curso." }, 400);
  }

  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error || !data.user) return c.json({ error: error?.message ?? "Não foi possível criar a conta." }, 400);

  const profile = await profileFor(data.user);
  profile.courses = courses;
  await kv.set(`profile:${profile.id}`, profile);
  return c.json({ id: profile.id });
});

app.get("/profile", async (c) => {
  const user = await authenticatedUser(c);
  if (!user) return c.json({ error: "Sessão inválida." }, 401);
  return c.json(await profileFor(user));
});

app.put("/profile", async (c) => {
  const user = await authenticatedUser(c);
  if (!user) return c.json({ error: "Sessão inválida." }, 401);
  const profile = await profileFor(user);
  const body = await c.req.json().catch(() => ({}));
  if (typeof body.name === "string" && body.name.trim()) profile.name = body.name.trim().slice(0, 60);
  if (typeof body.bio === "string") profile.bio = body.bio.slice(0, 300);
  if (typeof body.avatarDataUrl === "string" || body.avatarDataUrl === null) profile.avatarDataUrl = body.avatarDataUrl;
  if (typeof body.bannerDataUrl === "string" || body.bannerDataUrl === null) profile.bannerDataUrl = body.bannerDataUrl;
  await kv.set(`profile:${user.id}`, profile);
  return c.json(profile);
});

app.post("/courses", async (c) => {
  const user = await authenticatedUser(c);
  if (!user) return c.json({ error: "Entre para participar de um curso." }, 401);
  const body = await c.req.json().catch(() => ({}));
  if (typeof body.courseId !== "string" || !await knownCourse(body.courseId)) {
    return c.json({ error: "Curso inválido." }, 400);
  }
  const profile = await profileFor(user);
  profile.courses = [...new Set([...profile.courses, body.courseId])];
  await kv.set(`profile:${user.id}`, profile);
  return c.json(profile);
});

app.get("/users", async (c) => {
  const user = await authenticatedUser(c);
  if (!user) return c.json({ error: "Sessão inválida." }, 401);
  const requester = await profileFor(user);
  const profiles = await kv.getByPrefix("profile:") as UserProfile[];
  return c.json(profiles.map(({ id, email, name, role, joinedAt }) => ({
    id,
    ...(requester.role === "owner" ? { email } : {}),
    name,
    role,
    joinedAt,
  })));
});

app.put("/users/role", async (c) => {
  const user = await authenticatedUser(c);
  if (!user) return c.json({ error: "Sessão inválida." }, 401);
  if ((await profileFor(user)).role !== "owner") return c.json({ error: "Apenas o proprietário pode alterar papéis." }, 403);
  const body = await c.req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role as UserRole;
  if (!email || !["admin", "professor", "aluno"].includes(role)) return c.json({ error: "E-mail ou papel inválido." }, 400);

  const client = adminClient();
  let target: any = null;
  for (let page = 1; !target; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return c.json({ error: error.message }, 400);
    target = data.users.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;
    if (target || data.users.length < 1000) break;
  }
  if (!target) return c.json({ error: "Essa conta ainda não existe. Peça à pessoa para criar uma conta primeiro." }, 404);
  const targetProfile = await profileFor(target);
  targetProfile.role = role;
  await kv.set(`profile:${target.id}`, targetProfile);
  return c.json({ id: target.id, email: target.email, role });
});

app.get("/messages", async (c) => {
  const channel = c.req.query("channel") ?? "";
  if (!/^[a-z0-9-]+::[a-z0-9-]+$/.test(channel)) return c.json({ error: "Canal inválido." }, 400);
  const items = await kv.getByPrefix(`message:${channel}:`);
  return c.json(items.sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt)));
});

app.post("/messages", async (c) => {
  const user = await authenticatedUser(c);
  if (!user) return c.json({ error: "Entre para enviar mensagens." }, 401);
  const body = await c.req.json().catch(() => ({}));
  const channel = typeof body.channel === "string" ? body.channel : "";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
  const courseId = channel.split("::")[0];
  if (!/^[a-z0-9-]+::[a-z0-9-]+$/.test(channel) || !await knownCourse(courseId) || !text) {
    return c.json({ error: "Canal ou mensagem inválidos." }, 400);
  }
  const profile = await profileFor(user);
  if (!profile.courses.includes(courseId) && !["owner", "admin", "professor"].includes(profile.role)) {
    return c.json({ error: "Entre neste curso antes de enviar mensagens." }, 403);
  }
  const createdAt = new Date().toISOString();
  const message = {
    id: crypto.randomUUID(),
    channel,
    author: profile.name,
    avatar: profile.avatarDataUrl ?? "",
    text,
    time: new Date(createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    userId: profile.id,
    createdAt,
  };
  await kv.set(`message:${channel}:${message.id}`, message);
  return c.json(message);
});

app.delete("/messages/:id", async (c) => {
  const user = await authenticatedUser(c);
  if (!user) return c.json({ error: "Sessão inválida." }, 401);
  const channel = c.req.query("channel") ?? "";
  const id = c.req.param("id");
  const key = `message:${channel}:${id}`;
  const message = await kv.get(key);
  if (!message) return c.json({ error: "Mensagem não encontrada." }, 404);
  const profile = await profileFor(user);
  if (message.userId !== user.id && !["owner", "admin", "professor"].includes(profile.role)) {
    return c.json({ error: "Você não pode apagar esta mensagem." }, 403);
  }
  await kv.del(key);
  return c.json({ ok: true });
});

app.post("/ai", async (c) => {
  const user = await authenticatedUser(c);
  if (!user) return c.json({ error: "Entre para conversar com a Conecta IA." }, 401);
  const body = await c.req.json().catch(() => ({}));
  const messages = Array.isArray(body.messages)
    ? body.messages.filter((message: any) =>
        message && ["user", "assistant"].includes(message.role) && typeof message.content === "string",
      ).slice(-24).map((message: any) => ({ role: message.role, content: message.content.slice(0, 6000) }))
    : [];
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return c.json({ error: "Envie uma pergunta para a Conecta IA." }, 400);
  }

  try {
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        temperature: 0.4,
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content: "Você é a Conecta IA, uma tutora educacional paciente. Explique com clareza, incentive o raciocínio e responda em português quando a pergunta estiver em português.",
          },
          ...messages,
        ],
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return c.json({ error: "A IA pública está indisponível no momento. Tente novamente." }, 502);
    const text = result.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) return c.json({ error: "A IA não retornou uma resposta válida." }, 502);
    return c.json({ text: text.trim() });
  } catch {
    return c.json({ error: "Não foi possível conectar à IA pública. Tente novamente." }, 502);
  }
});

Deno.serve(app.fetch);