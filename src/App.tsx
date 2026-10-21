import { useState, useRef, useEffect, useCallback } from 'react'
import Logo from './components/Logo'
import { COMMUNITIES } from './data/communities'
import type { Community } from './data/communities'
import { VIDEOS, SUBJECTS } from './data/videos'
import type { Subject } from './data/videos'
import { sendAIMessage } from './services/aiService'
import type { AIMessage } from './services/aiService'
import {
  authenticate, register, clearSession, getSession, updateProfile, joinCourse, getUsers, updateUserRole, listCommunities, createCommunity,
} from './services/authService'
import type { ManagedUser, UserProfile, UserRole } from './services/authService'
import { createMessage, getMessages, removeMessage } from './services/chatService'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'communities' | 'ai' | 'video' | 'explore' | 'profile' | 'admin'
type ChatMessage = { id: string; author: string; avatar: string; text: string; time: string; isAI?: boolean }

const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const initials = (name: string) => name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

// ─── Icons ────────────────────────────────────────────────────────────────────
const IHash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
const IVol = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
const ISend = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
const ISearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IPlus = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IEye = ({ show }: { show: boolean }) => show
  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
const IClose = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IEdit = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const ILogout = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const IVideo = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
const IPlay = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const IShield = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#00e676','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#10b981','#f97316']
function avatarColor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function Avatar({ src, name, size = 36 }: { src?: string | null; name: string; size?: number }) {
  const color = avatarColor(name)
  const abbr = initials(name) || '?'
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: color + '33', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color, flexShrink: 0 }}>{abbr}</div>
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40, opacity: 0.5, textAlign: 'center' }}>
      <span style={{ fontSize: 38 }}>{emoji}</span>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{sub}</div>}
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onBrowse }: { onLogin: (p: UserProfile) => void; onBrowse: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await (mode === 'login'
        ? authenticate(email, password)
        : register(email, password, name, selectedCourses))
      if ('error' in result) { setError(result.error); return }
      onLogin(result)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível acessar o Supabase.')
    } finally {
      setLoading(false)
    }
  }

  const field = (label: string, value: string, set: (v: string) => void, type = 'text', extra?: React.ReactNode) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type={type} value={value} onChange={e => set(e.target.value)} autoComplete="off"
          style={{ width: '100%', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: extra ? '10px 40px 10px 12px' : '10px 12px', color: 'var(--foreground)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        {extra}
      </div>
    </div>
  )

  return (
    <div className="login-shell">
      <section className="login-story">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Logo size={64} />
          <span style={{ font: "700 20px 'Space Grotesk', sans-serif" }}>CONECTA</span>
          </div>
        <h1>Aprender junto <span>muda tudo.</span></h1>
        <p className="login-story-copy">Um espaço vivo para estudar, trocar ideias e avançar no seu ritmo, com pessoas que também querem chegar mais longe.</p>
        <div className="login-highlights"><span>✳ Cursos por interesse</span><span>↗ Comunidades reais</span><span>◉ Apoio inteligente</span></div>
      </section>
      <div className="login-card">
          <h2 className="login-card-title">{mode === 'login' ? 'Boas-vindas de volta' : 'Comece por aqui'}</h2>
          <div style={{ display: 'flex', background: 'var(--muted)', borderRadius: 10, padding: 3, marginBottom: 24 }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: mode === m ? 'var(--card)' : 'transparent', color: mode === m ? 'var(--foreground)' : 'var(--muted-foreground)', transition: 'all 0.18s' }}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && field('Nome completo', name, setName)}
            {mode === 'signup' && (
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8, textTransform: 'uppercase' }}>Escolha seus cursos</legend>
                <div className="course-picker">
                  {COMMUNITIES.map(course => {
                    const selected = selectedCourses.includes(course.id)
                    return (
                      <label key={course.id} className={`course-option${selected ? ' selected' : ''}`}>
                        <input type="checkbox" checked={selected} onChange={() => setSelectedCourses(current => selected ? current.filter(id => id !== course.id) : [...current, course.id])} />
                        <span>{course.emoji}</span><span>{course.name}</span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            )}
            {field('E-mail', email, setEmail, 'email')}
            {field('Senha', password, setPassword, showPass ? 'text' : 'password',
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex', padding: 0 }}>
                <IEye show={showPass} />
              </button>
            )}
            {error && <div style={{ fontSize: 13, color: '#ef4444', background: '#ef444418', border: '1px solid #ef444440', borderRadius: 8, padding: '9px 12px' }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ padding: '12px 0', borderRadius: 10, background: loading ? 'var(--muted)' : 'var(--primary)', border: 'none', color: loading ? 'var(--muted-foreground)' : 'var(--primary-foreground)', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar minha conta'}
            </button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 16px', color: 'var(--muted-foreground)', fontSize: 11 }}>
            <span style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            ou
            <span style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>
          <button type="button" onClick={onBrowse}
            style={{ width: '100%', padding: '11px 0', borderRadius: 10, background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Explorar sem entrar
          </button>
          <p style={{ margin: '10px 0 0', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 11, lineHeight: 1.4 }}>
            No modo visitante você pode explorar cursos e vídeos disponíveis.
          </p>
      </div>
    </div>
  )
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ user, onSave, onClose }: { user: UserProfile; onSave: (p: UserProfile) => void; onClose: () => void }) {
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarDataUrl)
  const [bannerPreview, setBannerPreview] = useState<string | null>(user.bannerDataUrl)
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const readFile = (file: File, set: (url: string) => void) => {
    const reader = new FileReader()
    reader.onload = e => set(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateProfile({ name: name.trim(), bio: bio.slice(0, 300), avatarDataUrl: avatarPreview, bannerDataUrl: bannerPreview })
      onSave(updated)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Editar Perfil</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex' }}><IClose /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Banner */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Banner</label>
            <div style={{ height: 100, borderRadius: 10, background: bannerPreview ? 'transparent' : 'linear-gradient(135deg, #00e676 0%, #7c3aed 100%)', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
              onClick={() => bannerRef.current?.click()}>
              {bannerPreview && <img src={bannerPreview} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', opacity: 0, transition: '0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Alterar banner</span>
              </div>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && readFile(e.target.files[0], setBannerPreview)} />
          </div>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => avatarRef.current?.click()}>
              <Avatar src={avatarPreview} name={name || user.name} size={64} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                <IEdit />
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{name || 'Sem nome'}</div>
              <button onClick={() => avatarRef.current?.click()} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginTop: 2 }}>Alterar foto</button>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && readFile(e.target.files[0], setAvatarPreview)} />
          </div>
          {/* Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={60}
              style={{ width: '100%', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--foreground)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          {/* Bio */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Bio <span style={{ fontWeight: 400, textTransform: 'none' }}>({bio.length}/300)</span></label>
            <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 300))} rows={3}
              placeholder="Fale um pouco sobre você..."
              style={{ width: '100%', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--foreground)', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--primary)', border: 'none', color: 'var(--primary-foreground)', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateCommunityModal({ onCreate, onClose }: { onCreate: (community: Community) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('📚')
  const [logo, setLogo] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const readImage = (file: File | undefined, setter: (value: string | null) => void) => {
    if (!file) return
    if (file.size > 1_500_000) {
      setError('As imagens devem ter no máximo 1,5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = event => setter(typeof event.target?.result === 'string' ? event.target.result : null)
    reader.readAsDataURL(file)
    setError('')
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const id = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
    if (!name.trim() || !id) { setError('Informe um nome válido para a comunidade.'); return }
    setSaving(true)
    setError('')
    try {
      await onCreate({
        id,
        name: name.trim(),
        description: description.trim(),
        emoji,
        color: '#a9e58b',
        logoDataUrl: logo,
        bannerDataUrl: banner,
        channels: [
          { id: 'geral', name: 'geral', type: 'text' },
          { id: 'duvidas', name: 'dúvidas', type: 'text' },
          { id: 'estudos', name: 'estudos', type: 'text' },
          { id: 'sala-voz', name: 'sala de voz', type: 'voice' },
        ],
      })
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Não foi possível criar a comunidade.')
    } finally {
      setSaving(false)
    }
  }

  const fieldStyle: React.CSSProperties = { width: '100%', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--foreground)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, padding: 16, background: 'rgba(0,0,0,0.72)', display: 'grid', placeItems: 'center' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 17 }}>Nova comunidade</strong>
          <button type="button" aria-label="Fechar" onClick={onClose} style={{ background: 'none', border: 0, color: 'var(--muted-foreground)', cursor: 'pointer', display: 'flex' }}><IClose /></button>
        </div>
        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>Nome da comunidade
          <input required maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Clube de Ciências" style={fieldStyle} />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>Descrição
          <textarea maxLength={240} value={description} onChange={event => setDescription(event.target.value)} rows={2} placeholder="O que as pessoas vão encontrar aqui?" style={{ ...fieldStyle, resize: 'vertical' }} />
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>Ícone
          <input value={emoji} onChange={event => setEmoji(event.target.value)} maxLength={8} style={fieldStyle} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 7, fontSize: 12, color: 'var(--muted-foreground)' }}>Logo
            <input type="file" accept="image/*" onChange={event => readImage(event.target.files?.[0], setLogo)} />
            {logo && <img src={logo} alt="Prévia da logo" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 10 }} />}
          </label>
          <label style={{ display: 'grid', gap: 7, fontSize: 12, color: 'var(--muted-foreground)' }}>Banner
            <input type="file" accept="image/*" onChange={event => readImage(event.target.files?.[0], setBanner)} />
            {banner && <img src={banner} alt="Prévia do banner" style={{ width: '100%', height: 54, objectFit: 'cover', borderRadius: 6 }} />}
          </label>
        </div>
        {error && <div role="alert" style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button type="submit" disabled={saving} style={{ padding: '9px 14px', border: 0, borderRadius: 8, background: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>{saving ? 'Criando...' : 'Criar comunidade'}</button>
        </div>
      </form>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('communities')
  const [communities, setCommunities] = useState<Community[]>(COMMUNITIES)
  const [activeCommunity, setActiveCommunity] = useState(COMMUNITIES[0])
  const [activeChannel, setActiveChannel] = useState(COMMUNITIES[0].channels[0])
  const [channelMessages, setChannelMessages] = useState<Record<string, ChatMessage[]>>({})
  const [aiHistory, setAiHistory] = useState<AIMessage[]>([])
  const [aiChat, setAiChat] = useState<ChatMessage[]>([{
    id: 'welcome', author: 'Conecta IA', avatar: 'IA', isAI: true,
    text: 'Olá! Sou a Conecta IA. Pode me perguntar sobre Matemática, Português, História, Física, Química, Biologia ou qualquer outro assunto. Como posso te ajudar?',
    time: now(),
  }])
  const [chatInput, setChatInput] = useState('')
  const [aiInput, setAiInput] = useState('')
  const [aiTyping, setAiTyping] = useState(false)
  const [aiError, setAiError] = useState('')
  const [videoSubject, setVideoSubject] = useState<Subject | 'Todas'>('Todas')
  const [videoSearch, setVideoSearch] = useState('')
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showCreateCommunity, setShowCreateCommunity] = useState(false)
  const [exploreSearch, setExploreSearch] = useState('')
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([])
  const [roleEmail, setRoleEmail] = useState('')
  const [roleToAssign, setRoleToAssign] = useState<Exclude<UserRole, 'owner'>>('professor')
  const [directoryError, setDirectoryError] = useState('')
  const [roleSaving, setRoleSaving] = useState(false)
  const msgEndRef = useRef<HTMLDivElement>(null)
  const aiEndRef = useRef<HTMLDivElement>(null)

  const channelKey = `${activeCommunity.id}::${activeChannel.id}`
  const messages = channelMessages[channelKey] ?? []

  useEffect(() => {
    getSession().then(setUser).finally(() => setSessionLoading(false))
  }, [])

  useEffect(() => {
    listCommunities().then(custom => {
      setCommunities([...COMMUNITIES, ...custom.filter(item => !COMMUNITIES.some(base => base.id === item.id))])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let active = true
    getMessages(channelKey)
      .then(items => {
        if (active) setChannelMessages(prev => ({ ...prev, [channelKey]: items }))
      })
      .catch(() => {
        if (active) setChannelMessages(prev => ({ ...prev, [channelKey]: [] }))
      })
    return () => { active = false }
  }, [channelKey])

  useEffect(() => {
    if (!user || (activeTab !== 'explore' && activeTab !== 'admin')) return
    getUsers().then(setManagedUsers).catch(error => {
      setDirectoryError(error instanceof Error ? error.message : 'Não foi possível carregar as contas.')
    })
  }, [user, activeTab])

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiChat])

  const logout = useCallback(async () => {
    await clearSession()
    setUser(null)
    setIsGuest(false)
    setChannelMessages({})
  }, [])

  if (sessionLoading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted-foreground)' }}>Carregando Conecta...</div>
  if (!user && !isGuest) return <LoginScreen onLogin={profile => {
    setUser(profile)
    setIsGuest(false)
    const firstCourse = communities.find(course => course.id === profile.courses[0])
    if (firstCourse) {
      setActiveCommunity(firstCourse)
      setActiveChannel(firstCourse.channels[0])
    }
  }} onBrowse={() => setIsGuest(true)} />

  const isAdmin = !!user && (user.role === 'owner' || user.role === 'admin')
  const canModerate = isAdmin || user?.role === 'professor'
  const canAccessAllCourses = !!user && ['owner', 'admin', 'professor'].includes(user.role)
  const isEnrolled = !!user && (canAccessAllCourses || user.courses.includes(activeCommunity.id))

  const enterCourse = async (courseId: string) => {
    if (!user) {
      setIsGuest(false)
      return
    }
    try {
      const updated = await joinCourse(courseId)
      setUser(updated)
      const course = communities.find(item => item.id === courseId)
      if (course) {
        setActiveCommunity(course)
        setActiveChannel(course.channels[0])
        setActiveTab('communities')
      }
      setDirectoryError('')
    } catch (error) {
      setDirectoryError(error instanceof Error ? error.message : 'Não foi possível entrar no curso.')
    }
  }

  const saveCommunity = async (community: Community) => {
    const created = await createCommunity(community)
    setCommunities(current => [...current, created])
    setActiveCommunity(created)
    setActiveChannel(created.channels[0])
    setActiveTab('communities')
    setShowCreateCommunity(false)
  }

  const assignRole = async (event: React.FormEvent) => {
    event.preventDefault()
    setRoleSaving(true)
    setDirectoryError('')
    try {
      await updateUserRole(roleEmail, roleToAssign)
      setRoleEmail('')
      setManagedUsers(await getUsers())
    } catch (error) {
      setDirectoryError(error instanceof Error ? error.message : 'Não foi possível alterar o papel.')
    } finally {
      setRoleSaving(false)
    }
  }

  // ── Send chat message ──────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!user || !chatInput.trim()) return
    const text = chatInput.trim()
    setChatInput('')
    try {
      const msg = await createMessage(channelKey, text)
      setChannelMessages(prev => ({
        ...prev,
        [channelKey]: [...(prev[channelKey] ?? []), msg],
      }))
    } catch {
      setChatInput(text)
    }
  }

  // ── Send AI message ────────────────────────────────────────────────────────
  const sendAI = async () => {
    if (!user || !aiInput.trim() || aiTyping) return
    const text = aiInput.trim()
    setAiInput('')
    setAiError('')
    const userMsg: ChatMessage = { id: Date.now().toString(), author: user.name, avatar: initials(user.name), text, time: now() }
    setAiChat(prev => [...prev, userMsg])
    const newHistory: AIMessage[] = [...aiHistory, { role: 'user', content: text }]
    setAiHistory(newHistory)
    setAiTyping(true)
    try {
      const reply = await sendAIMessage(newHistory)
      setAiHistory(prev => [...prev, { role: 'assistant', content: reply }])
      setAiChat(prev => [...prev, { id: Date.now().toString(), author: 'Conecta IA', avatar: 'IA', text: reply, time: now(), isAI: true }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido.'
      setAiError(msg)
    } finally {
      setAiTyping(false)
    }
  }

  // ── Delete channel message (admin) ─────────────────────────────────────────
  const deleteMessage = async (msgId: string) => {
    try {
      await removeMessage(channelKey, msgId)
      setChannelMessages(prev => ({ ...prev, [channelKey]: (prev[channelKey] ?? []).filter(m => m.id !== msgId) }))
    } catch {
      // Keep the message visible if the server rejects the operation.
    }
  }

  // ── Filtered videos ────────────────────────────────────────────────────────
  const filteredVideos = VIDEOS.filter(v => {
    const matchSubject = videoSubject === 'Todas' || v.subject === videoSubject
    const matchSearch = !videoSearch || v.title.toLowerCase().includes(videoSearch.toLowerCase()) || v.topic.toLowerCase().includes(videoSearch.toLowerCase())
    return matchSubject && matchSearch
  })

  // ── Nav items ──────────────────────────────────────────────────────────────
  const navItems = ([
    { tab: 'communities', label: 'Comunidades', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { tab: 'ai', label: 'Conecta IA', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
    { tab: 'video', label: 'Vídeos', icon: <IVideo /> },
    { tab: 'explore', label: 'Explorar', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg> },
    { tab: 'profile', label: 'Perfil', icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    ...(user?.role === 'owner' ? [{ tab: 'admin' as const, label: 'Gestão', icon: <IShield /> }] : []),
  ] satisfies { tab: Tab; icon: React.ReactNode; label: string }[]).filter(item => user || item.tab !== 'profile')

  // ── Styles helpers ─────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = { flex: 1, background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 13px', color: 'var(--foreground)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }
  const btnPrimary: React.CSSProperties = { padding: '9px 16px', borderRadius: 8, background: 'var(--primary)', border: 'none', color: 'var(--primary-foreground)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--background)', color: 'var(--foreground)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>

      {/* ── Nav rail ── */}
      <nav style={{ width: 66, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 3, background: 'var(--card)', borderRight: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ marginBottom: 8 }}><Logo size={36} /></div>
        <div style={{ width: '60%', height: 1, background: 'var(--border)', margin: '2px 0 6px' }} />
        {navItems.map(({ tab, icon, label }) => (
          <button key={tab} title={label} onClick={() => setActiveTab(tab)}
            style={{ width: 42, height: 42, borderRadius: activeTab === tab ? 13 : '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? 'var(--primary-foreground)' : 'var(--muted-foreground)', border: 'none', cursor: 'pointer', transition: 'all 0.18s' }}
            onMouseEnter={e => { if (activeTab !== tab) { const b = e.currentTarget; b.style.background = 'var(--secondary)'; b.style.color = 'var(--foreground)'; b.style.borderRadius = '13px' }}}
            onMouseLeave={e => { if (activeTab !== tab) { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = 'var(--muted-foreground)'; b.style.borderRadius = '50%' }}}
          >{icon}</button>
        ))}
        {isAdmin && (
          <div title="Admin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginTop: 2 }}><IShield /></div>
        )}
        <div style={{ flex: 1 }} />
        <button title={user ? 'Sair' : 'Entrar'} onClick={user ? logout : () => setIsGuest(false)} style={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'var(--muted-foreground)', border: 'none', cursor: 'pointer' }}>
          <ILogout />
        </button>
      </nav>

      {/* ══════════════════ COMMUNITIES ══════════════════ */}
      {activeTab === 'communities' && (
        <>
          {/* Sidebar */}
          <aside style={{ width: 232, background: 'var(--muted)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Comunidades</div>
                {user?.role === 'owner' && <button title="Criar comunidade" aria-label="Criar comunidade" onClick={() => setShowCreateCommunity(true)} style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', border: 0, borderRadius: 6, background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer' }}><IPlus /></button>}
              </div>
              {communities.filter(course => canAccessAllCourses || user?.courses.includes(course.id)).map(c => (
                <button key={c.id} onClick={() => { setActiveCommunity(c); setActiveChannel(c.channels[0]) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 1, background: activeCommunity.id === c.id ? 'var(--secondary)' : 'transparent', color: activeCommunity.id === c.id ? 'var(--foreground)' : 'var(--muted-foreground)', transition: 'all 0.12s', fontFamily: 'inherit' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden', background: c.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, border: `2px solid ${activeCommunity.id === c.id ? c.color : 'transparent'}`, transition: 'border-color 0.12s' }}>{c.logoDataUrl ? <img src={c.logoDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.emoji}</span>
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  </div>
                </button>
              ))}
              {/* Channels */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted-foreground)', padding: '0 4px', marginBottom: 6 }}>{activeCommunity.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', padding: '0 4px', marginBottom: 10 }}>{activeCommunity.description}</div>
                {['text', 'voice'].map(type => (
                  <div key={type}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-foreground)', padding: '6px 4px 4px' }}>
                      {type === 'text' ? 'Canais de Texto' : 'Canais de Voz'}
                    </div>
                    {activeCommunity.channels.filter(ch => ch.type === type).map(ch => (
                      <button key={ch.id} onClick={() => { if (ch.type === 'voice') { setActiveTab('video') } else { setActiveChannel(ch) } }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', marginBottom: 1, background: activeChannel.id === ch.id && ch.type === 'text' ? 'var(--secondary)' : 'transparent', color: activeChannel.id === ch.id && ch.type === 'text' ? 'var(--foreground)' : 'var(--muted-foreground)', fontSize: 13, fontFamily: 'inherit', transition: 'all 0.1s' }}>
                        {ch.type === 'text' ? <IHash /> : <IVol />}
                        {ch.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {/* User bar */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 9 }}>
              <Avatar src={user?.avatarDataUrl} name={user?.name ?? 'Visitante'} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {user?.name ?? 'Visitante'}
                  {isAdmin && <span title="Admin" style={{ color: '#f59e0b' }}><IShield /></span>}
                </div>
                {user
                  ? <div style={{ fontSize: 11, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />Online
                    </div>
                  : <button onClick={() => setIsGuest(false)} style={{ border: 0, padding: 0, background: 'transparent', color: 'var(--primary)', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer' }}>Entrar ou criar conta</button>
                }
              </div>
            </div>
          </aside>

          {/* Chat area */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {activeCommunity.bannerDataUrl && <div role="img" aria-label={`Banner de ${activeCommunity.name}`} style={{ height: 92, flexShrink: 0, backgroundImage: `linear-gradient(90deg, rgba(11,17,15,.24), rgba(11,17,15,.08)), url("${activeCommunity.bannerDataUrl}")`, backgroundPosition: 'center', backgroundSize: 'cover' }} />}
            <header style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {activeCommunity.logoDataUrl
                ? <img src={activeCommunity.logoDataUrl} alt={`Logo de ${activeCommunity.name}`} style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover' }} />
                : <span style={{ fontSize: 20 }}>{activeCommunity.emoji}</span>}
              <span style={{ color: 'var(--muted-foreground)' }}><IHash /></span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{activeChannel.name}</span>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)', marginLeft: 8 }}>— {activeCommunity.description}</span>
            </header>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {messages.length === 0
                ? <EmptyState emoji="#" title="Nenhuma mensagem ainda" sub="Seja o primeiro a enviar uma mensagem neste canal." />
                : messages.map((msg, i) => {
                    const showHead = i === 0 || messages[i - 1].author !== msg.author
                    return (
                      <div key={msg.id} className="msg-row" style={{ display: 'flex', gap: 11, padding: showHead ? '9px 0 2px' : '1px 0', alignItems: 'flex-start', position: 'relative' }}
                        onMouseEnter={e => { if (canModerate) { const btn = e.currentTarget.querySelector<HTMLButtonElement>('.del-btn'); if (btn) btn.style.display = 'flex' }}}
                        onMouseLeave={e => { const btn = e.currentTarget.querySelector<HTMLButtonElement>('.del-btn'); if (btn) btn.style.display = 'none' }}>
                        {showHead
                          ? <Avatar src={null} name={msg.author} size={36} />
                          : <div style={{ width: 36, flexShrink: 0 }} />
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {showHead && <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{msg.author}</span>
                            <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{msg.time}</span>
                          </div>}
                          <div style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</div>
                        </div>
                        {canModerate && (
                          <button className="del-btn" onClick={() => deleteMessage(msg.id)}
                            style={{ display: 'none', position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', padding: '3px 8px', fontSize: 11, cursor: 'pointer', alignItems: 'center', gap: 3 }}>
                            🗑 Apagar
                          </button>
                        )}
                      </div>
                    )
                  })
              }
              <div ref={msgEndRef} />
            </div>
            {user && isEnrolled
              ? <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder={`Mensagem em #${activeChannel.name}`} style={inputStyle} />
                  <button onClick={sendChat} style={{ ...btnPrimary, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ISend /></button>
                </div>
                : <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--muted-foreground)', fontSize: 13 }}>
                  {user ? 'Entre neste curso para participar da conversa.' : 'Entre para participar da conversa.'}
                  <button onClick={() => user ? enterCourse(activeCommunity.id) : setIsGuest(false)} style={{ ...btnPrimary, padding: '7px 14px' }}>{user ? 'Entrar no curso' : 'Entrar'}</button>
                </div>
            }
          </main>
        </>
      )}

      {/* ══════════════════ AI ══════════════════ */}
      {activeTab === 'ai' && (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <header style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>IA</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Conecta IA</div>
              <div style={{ fontSize: 11, color: 'var(--primary)' }}>● Ativa</div>
            </div>
          </header>
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 740, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['O que é derivada?', 'Explique a Proclamação da República', 'Como funciona a fotossíntese?', 'Diferença entre ácido e base'].map(s => (
                <button key={s} onClick={() => setAiInput(s)} style={{ padding: '5px 13px', borderRadius: 20, background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--muted-foreground)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
              ))}
            </div>
            {aiChat.map(msg => {
              const isAI = !!msg.isAI
              return (
                <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isAI ? 'row' : 'row-reverse' }}>
                  <div style={{ width: 34, height: 34, borderRadius: isAI ? 10 : '50%', background: isAI ? '#7c3aed' : avatarColor(user?.name ?? 'Visitante'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{isAI ? 'IA' : initials(user?.name ?? 'Visitante')}</div>
                  <div style={{ maxWidth: '72%', background: isAI ? 'var(--card)' : 'var(--primary)', borderRadius: isAI ? '4px 14px 14px 14px' : '14px 4px 14px 14px', padding: '11px 15px', border: isAI ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: 14, lineHeight: 1.65, color: isAI ? 'var(--foreground)' : 'var(--primary-foreground)', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    <div style={{ fontSize: 11, color: isAI ? 'var(--muted-foreground)' : 'rgba(0,0,0,0.4)', marginTop: 4 }}>{msg.time}</div>
                  </div>
                </div>
              )
            })}
            {aiTyping && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>IA</div>
                <div style={{ background: 'var(--card)', borderRadius: '4px 14px 14px 14px', padding: '13px 16px', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--muted-foreground)', display: 'inline-block', animation: `bounce 1s ${i * 0.15}s infinite` }} />)}
                </div>
              </div>
            )}
            {aiError && (
              <div style={{ background: '#ef444418', border: '1px solid #ef444440', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#ef4444' }}>
                {aiError}
                {aiError.includes('não foi configurada') && (
                  <div style={{ marginTop: 8, color: 'var(--muted-foreground)', fontSize: 12 }}>
                    Configure o segredo <code style={{ background: 'var(--secondary)', padding: '2px 6px', borderRadius: 4 }}>ANTHROPIC_API_KEY</code> na função Supabase.
                  </div>
                )}
              </div>
            )}
            <div ref={aiEndRef} />
          </div>
          {user
            ? <div style={{ padding: '10px 22px', borderTop: '1px solid var(--border)', maxWidth: 740, width: '100%', margin: '0 auto', display: 'flex', gap: 8, boxSizing: 'border-box' as const }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAI()} disabled={aiTyping}
                  placeholder="Pergunte sobre qualquer matéria..." style={inputStyle} />
                <button onClick={sendAI} disabled={aiTyping} style={{ ...btnPrimary, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#7c3aed' }}><ISend /></button>
              </div>
            : <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--muted-foreground)', fontSize: 13 }}>
                Entre para conversar com a Conecta IA.
                <button onClick={() => setIsGuest(false)} style={{ ...btnPrimary, padding: '7px 14px' }}>Entrar</button>
              </div>
          }
          <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
        </main>
      )}

      {/* ══════════════════ VIDEO ══════════════════ */}
      {activeTab === 'video' && (
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {playingVideoId ? (() => {
            const vid = VIDEOS.find(v => v.id === playingVideoId)!
            return (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <header style={{ padding: '11px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setPlayingVideoId(null)} style={{ ...btnPrimary, background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '6px 12px', fontSize: 13 }}>← Voltar</button>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{vid.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{vid.channel} · {vid.subject} · {vid.topic}</div>
                  </div>
                </header>
                <div style={{ flex: 1, background: '#000' }}>
                  <iframe src={`https://www.youtube.com/embed/${vid.youtubeId}?autoplay=1&rel=0`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title={vid.title} />
                </div>
              </div>
            )
          })() : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Vídeos Educacionais</h1>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 20px' }}>Conteúdo real do YouTube organizado por matéria.</p>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                {(['Todas', ...SUBJECTS] as const).map(s => (
                  <button key={s} onClick={() => setVideoSubject(s)}
                    style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${videoSubject === s ? 'var(--primary)' : 'var(--border)'}`, background: videoSubject === s ? 'var(--primary)' : 'transparent', color: videoSubject === s ? 'var(--primary-foreground)' : 'var(--muted-foreground)', fontSize: 13, fontWeight: videoSubject === s ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{s}</button>
                ))}
              </div>
              <div style={{ position: 'relative', marginBottom: 22 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}><ISearch /></span>
                <input value={videoSearch} onChange={e => setVideoSearch(e.target.value)} placeholder="Buscar por título ou assunto..."
                  style={{ ...inputStyle, paddingLeft: 36, width: '100%', maxWidth: 400, boxSizing: 'border-box' as const }} />
              </div>

              {filteredVideos.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 38, marginBottom: 12 }}>📹</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Nenhum vídeo encontrado</div>
                  <div style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                    {videoSubject !== 'Todas'
                      ? `Vídeos de ${videoSubject} serão adicionados em breve.`
                      : 'Tente outro termo de busca.'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {filteredVideos.map(vid => (
                    <div key={vid.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onClick={() => setPlayingVideoId(vid.id)}>
                      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#111' }}>
                        <img src={`https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`} alt={vid.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', opacity: 0, transition: '0.2s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-foreground)' }}><IPlay /></div>
                        </div>
                        <div style={{ position: 'absolute', top: 7, left: 7, background: 'rgba(0,0,0,0.75)', borderRadius: 5, padding: '2px 8px', fontSize: 10, color: '#fff', fontWeight: 600 }}>{vid.subject}</div>
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4, marginBottom: 4 }}>{vid.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{vid.channel} · {vid.topic}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending notice */}
              <div style={{ marginTop: 32, padding: '14px 18px', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--muted-foreground)' }}>
                ℹ️ Apenas vídeos com IDs verificados são exibidos. Para adicionar mais, edite <code style={{ background: 'var(--secondary)', padding: '1px 6px', borderRadius: 4 }}>src/data/videos.ts</code> com IDs reais do YouTube.
              </div>
            </div>
          )}
        </main>
      )}

      {/* ══════════════════ EXPLORE ══════════════════ */}
      {activeTab === 'explore' && (
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}>Explorar</h1>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 20px' }}>Descubra as comunidades da plataforma.</p>

            <div style={{ position: 'relative', marginBottom: 26 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}><ISearch /></span>
              <input value={exploreSearch} onChange={e => setExploreSearch(e.target.value)} placeholder="Buscar comunidades..."
                style={{ ...inputStyle, paddingLeft: 36, width: '100%', maxWidth: 440, boxSizing: 'border-box' as const }} />
            </div>

            <section style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Comunidades</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {communities.filter(c => !exploreSearch || c.name.toLowerCase().includes(exploreSearch.toLowerCase())).map(c => {
                  const enrolled = canAccessAllCourses || !!user?.courses.includes(c.id)
                  return (
                    <div key={c.id} className="course-card" style={{ borderTop: `2px solid ${c.color}` }}>
                      <span className="course-card-icon" style={{ background: c.color + '22' }}>{c.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12, lineHeight: 1.4 }}>{c.description}</div>
                        <button onClick={() => enrolled ? (setActiveCommunity(c), setActiveChannel(c.channels[0]), setActiveTab('communities')) : enterCourse(c.id)}
                          style={{ ...btnPrimary, padding: '6px 12px', fontSize: 12 }}>{enrolled ? 'Abrir curso' : user ? 'Entrar no curso' : 'Fazer login'}</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Pessoas</h2>
              {directoryError && <p role="alert" style={{ color: '#ef7777', fontSize: 13 }}>{directoryError}</p>}
              {!user ? <div className="empty-directory">Entre para ver as pessoas cadastradas na plataforma.</div> : managedUsers.filter(person => person.id !== user.id).length === 0
                ? <div className="empty-directory">Nenhuma outra conta cadastrada ainda.</div>
                : <div className="people-list">{managedUsers.filter(person => person.id !== user.id).map(person => (
                    <div key={person.id} className="person-row">
                      <Avatar name={person.name} size={38} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{person.name}</div>
                        {person.email && <div style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{person.email}</div>}
                      </div>
                      <span className="role-label">{person.role}</span>
                    </div>
                  ))}</div>}
            </section>
          </div>
        </main>
      )}

      {activeTab === 'admin' && user?.role === 'owner' && (
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div className="section-kicker">PAINEL DO PROPRIETÁRIO</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 4px' }}>Gestão de pessoas</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '0 0 24px' }}>Promova contas já cadastradas para administração ou docência.</p>
            <form onSubmit={assignRole} className="role-form">
              <input required type="email" value={roleEmail} onChange={event => setRoleEmail(event.target.value)} placeholder="E-mail da conta existente" style={inputStyle} />
              <select value={roleToAssign} onChange={event => setRoleToAssign(event.target.value as Exclude<UserRole, 'owner'>)} className="role-select">
                <option value="professor">Professor</option>
                <option value="admin">Administrador</option>
                <option value="aluno">Aluno</option>
              </select>
              <button disabled={roleSaving} style={btnPrimary}>{roleSaving ? 'Salvando...' : 'Atualizar papel'}</button>
            </form>
            {directoryError && <p role="alert" style={{ color: '#ef7777', fontSize: 13 }}>{directoryError}</p>}
            <div className="people-list" style={{ marginTop: 18 }}>
              {managedUsers.map(person => (
                <div key={person.id} className="person-row">
                  <Avatar name={person.name} size={38} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{person.name}{person.id === user.id ? ' (você)' : ''}</div>
                    {person.email && <div style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{person.email}</div>}
                  </div>
                  <span className="role-label">{person.role}</span>
                </div>
              ))}
              {managedUsers.length === 0 && <div className="empty-directory">Nenhuma conta cadastrada.</div>}
            </div>
          </div>
        </main>
      )}

      {/* ══════════════════ PROFILE ══════════════════ */}
      {activeTab === 'profile' && user && (
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 28px' }}>
          <div style={{ maxWidth: 660, margin: '0 auto' }}>
            {/* Cover */}
            <div style={{ height: 130, borderRadius: '16px 16px 0 0', background: user.bannerDataUrl ? 'transparent' : 'linear-gradient(135deg, #00e676 0%, #7c3aed 100%)', overflow: 'hidden', position: 'relative' }}>
              {user.bannerDataUrl && <img src={user.bannerDataUrl} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', bottom: -34, left: 24 }}>
                <div style={{ border: '4px solid var(--background)', borderRadius: '50%' }}>
                  <Avatar src={user.avatarDataUrl} name={user.name} size={68} />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0 0 16px 16px', padding: '44px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {user.name}
                    {user.role !== 'aluno' && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: '#f0a35e18', border: '1px solid #f0a35e', color: '#f0a35e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><IShield />{user.role === 'owner' ? 'Proprietário' : user.role === 'professor' ? 'Professor' : 'Administrador'}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
                    {user.email} · Membro desde {new Date(user.joinedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <button onClick={() => setShowEditProfile(true)} style={{ ...btnPrimary, background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IEdit /> Editar perfil
                </button>
              </div>

              {user.bio && <p style={{ fontSize: 14, color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: 20 }}>{user.bio}</p>}

              {/* Communities */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 10 }}>Comunidades</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {communities.map(c => {
                    const enrolled = canAccessAllCourses || user.courses.includes(c.id)
                    return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9, background: 'var(--muted)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 16 }}>{c.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{c.name}</span>
                      {enrolled
                        ? <span className="role-label" style={{ color: c.color }}>Matriculado</span>
                        : <button onClick={() => enterCourse(c.id)} style={{ ...btnPrimary, padding: '4px 10px', fontSize: 11 }}>Entrar</button>}
                    </div>
                    )
                  })}
                </div>
              </div>

              {/* Friends */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 10 }}>Amigos</div>
                <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>
                  Nenhum amigo ainda. Quando outros usuários se cadastrarem, você poderá adicioná-los em Explorar.
                </div>
              </div>

              {/* Activity */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 10 }}>Atividade recente</div>
                {Object.keys(channelMessages).length === 0
                  ? <div style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Nenhuma atividade ainda.</div>
                  : Object.entries(channelMessages).slice(0, 5).map(([key, msgs]) => {
                      const myMsgs = msgs.filter(m => m.author === user.name)
                      if (myMsgs.length === 0) return null
                      const [cId] = key.split('::')
                      const comm = communities.find(c => c.id === cId)
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                          <span>{comm?.emoji ?? '💬'}</span>
                          <span>Enviou {myMsgs.length} mensagem{myMsgs.length > 1 ? 's' : ''} em {comm?.name ?? key}</span>
                        </div>
                      )
                    })
                }
              </div>
            </div>
          </div>
        </main>
      )}

      {showEditProfile && user && (
        <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} onSave={updated => { setUser(updated); setShowEditProfile(false) }} />
      )}
      {showCreateCommunity && user?.role === 'owner' && (
        <CreateCommunityModal onClose={() => setShowCreateCommunity(false)} onCreate={saveCommunity} />
      )}
    </div>
  )
}
