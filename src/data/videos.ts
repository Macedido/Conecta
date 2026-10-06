// ─── Video data ───────────────────────────────────────────────────────────────
// Only videos with confirmed real YouTube IDs are listed here.
// IDs were verified via public search results on 2026-09-23.
// To add more videos, append entries with a real youtubeId.
// DO NOT invent IDs — thumbnail and embed will break silently.

export type Subject = 'Matemática' | 'Português' | 'História' | 'Física' | 'Química' | 'Biologia'

export interface Video {
  id: string
  youtubeId: string
  title: string
  channel: string
  subject: Subject
  topic: string
}

export const SUBJECTS: Subject[] = ['Matemática', 'Português', 'História', 'Física', 'Química', 'Biologia']

// Confirmed real videos — IDs verified via search 2026-09-23
export const VIDEOS: Video[] = [
  // ── Matemática ──────────────────────────────────────────────────────────────
  {
    id: 'm1',
    youtubeId: 'amR4jBSPtn8',
    title: 'Expressões Numéricas — Exercícios',
    channel: 'Gis com Giz Matemática',
    subject: 'Matemática',
    topic: 'Expressões Numéricas',
  },
  {
    id: 'm2',
    youtubeId: 'Xulj6EPYPkw',
    title: 'Geometria Plana',
    channel: 'Brasil Escola',
    subject: 'Matemática',
    topic: 'Geometria',
  },
  {
    id: 'm3',
    youtubeId: 'JQfJMJrV5Bk',
    title: 'Tudo de Matemática do Ensino Fundamental para o ENEM',
    channel: 'Stoodi',
    subject: 'Matemática',
    topic: 'Revisão Geral',
  },
  {
    id: 'm4',
    youtubeId: 'BbUWQs9ia7o',
    title: 'Funções da Geometria — Figuras e Sólidos',
    channel: 'Matemática Básica',
    subject: 'Matemática',
    topic: 'Funções e Geometria',
  },
  // ── Adicione mais vídeos reais aqui ─────────────────────────────────────────
  // Formato:
  // { id: 'x', youtubeId: 'ID_REAL', title: 'Título real', channel: 'Canal real', subject: 'Matéria', topic: 'Tópico' }
]
