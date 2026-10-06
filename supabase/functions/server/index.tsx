import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const PREFIX = "/make-server-b92ddf44";
const OWNER_EMAIL = "senhoremail448@gmail.com";
const PROFILE_BUCKET = "profile-media";

type Role = "owner" | "admin" | "professor" | "aluno";
type Profile = {
  id: string;
  email: string;
  name: string;
  bio: string;
  role: Role;
  avatarDataUrl: string | null;
  bannerDataUrl: string | null;
  joinedAt: string;
};

const adminClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

const getUser = async (c: any) => {
  const token = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await adminClient().auth.getUser(token);
  return error ? null : data.user;
};

const getProfile = async (user: any): Promise<Profile> => {
  const key = `profile:${user.id}`;
  const existing = await kv.get(key) as Profile | undefined;
  const email = (user.email || "").toLowerCase();
  const role: Role = email === OWNER_EMAIL ? "owner" : (existing?.role || "aluno");
  const profile: Profile = {
    id: user.id,
    email,
    name: existing?.name || user.user_metadata?.full_name || email.split("@")[0] || "Aluno",
    bio: existing?.bio || "",
    role,
    avatarDataUrl: existing?.avatarDataUrl || null,
    bannerDataUrl: existing?.bannerDataUrl || null,
    joinedAt: existing?.joinedAt || user.created_at || new Date().toISOString(),
  };
  if (!existing || existing.role !== role) await kv.set(key, profile);
  return profile;
};

const requireUser = async (c: any) => {
  const user = await getUser(c);
  if (!user) return { response: c.json({ error: "Sessão inválida ou expirada." }, 401) };
  return { user, profile: await getProfile(user) };
};

const uploadDataUrl = async (userId: string, kind: "avatar" | "banner", dataUrl: string) => {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/);
  if (!match) throw new Error("Formato de imagem inválido.");
  const [, contentType, encoded] = match;
  const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
  if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");

  const client = adminClient();
  await client.storage.createBucket(PROFILE_BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  });
  const extension = contentType.split("/")[1].replace("jpeg", "jpg");
  const path = `${userId}/${kind}.${extension}`;
  const { error } = await client.storage.from(PROFILE_BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = client.storage.from(PROFILE_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
};

app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

app.get(`${PREFIX}/profile`, async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;
  return c.json(auth.profile);
});

app.put(`${PREFIX}/profile`, async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;
  try {
    const body = await c.req.json();
    const profile = auth.profile!;
    const updated: Profile = {
      ...profile,
      name: typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : profile.name,
      bio: typeof body.bio === "string" ? body.bio.trim().slice(0, 300) : profile.bio,
      avatarDataUrl: body.avatarDataUrl === null
        ? null
        : typeof body.avatarDataUrl === "string"
          ? await uploadDataUrl(profile.id, "avatar", body.avatarDataUrl)
          : profile.avatarDataUrl,
      bannerDataUrl: body.bannerDataUrl === null
        ? null
        : typeof body.bannerDataUrl === "string"
          ? await uploadDataUrl(profile.id, "banner", body.bannerDataUrl)
          : profile.bannerDataUrl,
      role: profile.email === OWNER_EMAIL ? "owner" : profile.role,
    };
    await kv.set(`profile:${profile.id}`, updated);
    return c.json(updated);
  } catch (error) {
    console.error("Failed to update profile:", error);
    return c.json({ error: error instanceof Error ? error.message : "Não foi possível salvar o perfil." }, 400);
  }
});

app.get(`${PREFIX}/messages`, async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;
  const channel = c.req.query("channel");
  if (!channel || !/^[a-z-]+::[a-z-]+$/.test(channel)) return c.json({ error: "Canal inválido." }, 400);
  const messages = await kv.getByPrefix(`message:${channel}:`);
  return c.json(messages.sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt)).slice(-200));
});

app.post(`${PREFIX}/messages`, async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;
  const body = await c.req.json();
  const channel = typeof body.channel === "string" ? body.channel : "";
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
  if (!text || !/^[a-z-]+::[a-z-]+$/.test(channel)) return c.json({ error: "Mensagem ou canal inválido." }, 400);
  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const message = {
    id,
    author: auth.profile!.name,
    avatar: auth.profile!.name.split(/\s+/).map((part: string) => part[0]).slice(0, 2).join("").toUpperCase(),
    text,
    time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    userId: auth.user!.id,
    createdAt,
  };
  await kv.set(`message:${channel}:${createdAt}:${id}`, message);
  return c.json(message, 201);
});

app.delete(`${PREFIX}/messages/:id`, async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;
  if (!["owner", "admin"].includes(auth.profile!.role)) return c.json({ error: "Sem permissão para apagar mensagens." }, 403);
  const channel = c.req.query("channel") || "";
  if (!/^[a-z-]+::[a-z-]+$/.test(channel)) return c.json({ error: "Canal inválido." }, 400);
  const id = c.req.param("id");
  const entries = await kv.getByPrefix(`message:${channel}:`);
  const message = entries.find((item: any) => item.id === id);
  if (!message) return c.json({ error: "Mensagem não encontrada." }, 404);
  await kv.del(`message:${channel}:${message.createdAt}:${id}`);
  return c.json({ success: true });
});

app.post(`${PREFIX}/ai`, async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return c.json({ error: "A IA ainda não foi configurada pelo administrador." }, 503);

  const body = await c.req.json();
  const messages = Array.isArray(body.messages)
    ? body.messages
      .filter((message: any) =>
        ["user", "assistant"].includes(message?.role) &&
        typeof message?.content === "string" &&
        message.content.trim()
      )
      .slice(-20)
      .map((message: any) => ({
        role: message.role,
        content: message.content.trim().slice(0, 8000),
      }))
    : [];
  if (messages.length === 0) return c.json({ error: "Envie ao menos uma mensagem." }, 400);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: Deno.env.get("ANTHROPIC_MODEL") || "claude-3-5-haiku-latest",
        max_tokens: 1024,
        system: "Você é a Conecta IA, assistente educacional. Responda em português brasileiro com clareza e precisão. Ajude especialmente com Matemática, Português, História, Física, Química e Biologia. Não invente fatos.",
        messages,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic request failed:", response.status, data?.error?.type);
      return c.json({ error: "A IA está indisponível no momento." }, 502);
    }
    const text = data.content?.find((block: any) => block.type === "text")?.text;
    return text ? c.json({ text }) : c.json({ error: "A IA retornou uma resposta vazia." }, 502);
  } catch (error) {
    console.error("Anthropic request failed:", error);
    return c.json({ error: "Não foi possível conectar à IA." }, 502);
  }
});

Deno.serve(app.fetch);
