import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

export const OWNER_EMAIL = 'senhoremail448@gmail.com'
export const ADMIN_EMAIL = OWNER_EMAIL

export type UserRole = 'owner' | 'admin' | 'professor' | 'aluno'

export interface UserProfile {
  id: string
  email: string
  name: string
  bio: string
  role: UserRole
  avatarDataUrl: string | null
  bannerDataUrl: string | null
  joinedAt: string
}

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
)

const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-b92ddf44`

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sua sessão expirou. Entre novamente.')

  let response: Response
  try {
    response = await fetch(`${serverUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...init?.headers,
      },
    })
  } catch {
    throw new Error('O Supabase está indisponível. Verifique a conexão do projeto nas configurações do Make.')
  }
  const body = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(body.error || 'Não foi possível concluir a operação.')
  return body as T
}

const authError = (message: string) => {
  if (/failed to fetch|fetch failed|network|load failed/i.test(message)) {
    return 'Não foi possível acessar o Supabase. Reconecte um projeto ativo nas configurações do Make.'
  }
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha incorretos.'
  if (/already registered|already been registered/i.test(message)) return 'Este e-mail já está cadastrado.'
  if (/email not confirmed/i.test(message)) return 'Confirme seu e-mail antes de entrar.'
  return message
}

export async function getSession(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  try {
    return await api<UserProfile>('/profile')
  } catch {
    await supabase.auth.signOut()
    return null
  }
}

export async function clearSession(): Promise<void> {
  await supabase.auth.signOut()
}

export async function authenticate(email: string, password: string): Promise<UserProfile | { error: string }> {
  if (!email.trim()) return { error: 'Informe um e-mail.' }
  if (password.length < 6) return { error: 'Senha deve ter ao menos 6 caracteres.' }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) return { error: authError(error.message) }
  } catch (error) {
    return { error: authError(error instanceof Error ? error.message : 'Falha de rede.') }
  }

  try {
    return await api<UserProfile>('/profile')
  } catch (error) {
    await supabase.auth.signOut()
    return { error: error instanceof Error ? error.message : 'Não foi possível carregar o perfil.' }
  }
}

export async function register(email: string, password: string, name: string): Promise<UserProfile | { error: string }> {
  if (!email.trim()) return { error: 'Informe um e-mail.' }
  if (!name.trim()) return { error: 'Informe seu nome.' }
  if (password.length < 6) return { error: 'Senha deve ter ao menos 6 caracteres.' }

  let data
  try {
    const result = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim() } },
    })
    data = result.data
    if (result.error) return { error: authError(result.error.message) }
  } catch (error) {
    return { error: authError(error instanceof Error ? error.message : 'Falha de rede.') }
  }
  if (!data.session) {
    return { error: 'Cadastro criado. Confirme o e-mail recebido e depois entre.' }
  }

  try {
    return await api<UserProfile>('/profile')
  } catch (profileError) {
    return { error: profileError instanceof Error ? profileError.message : 'Não foi possível criar o perfil.' }
  }
}

export async function updateProfile(updates: Partial<Pick<UserProfile, 'name' | 'bio' | 'avatarDataUrl' | 'bannerDataUrl'>>): Promise<UserProfile> {
  return api<UserProfile>('/profile', { method: 'PUT', body: JSON.stringify(updates) })
}

export async function authorizedApi<T>(path: string, init?: RequestInit): Promise<T> {
  return api<T>(path, init)
}
