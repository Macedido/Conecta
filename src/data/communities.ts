export type Channel = { id: string; name: string; type: 'text' | 'voice' }
export type Community = {
  id: string
  name: string
  emoji: string
  color: string
  description: string
  channels: Channel[]
  logoDataUrl?: string | null
  bannerDataUrl?: string | null
}

export const COMMUNITIES: Community[] = [
  {
    id: 'colegio-apoio',
    name: 'Colégio Apoio',
    emoji: '🏫',
    color: '#f0a35e',
    description: 'A comunidade oficial para aprender, conversar e crescer juntos no Colégio Apoio.',
    channels: [
      { id: 'geral', name: 'geral', type: 'text' },
      { id: 'avisos', name: 'avisos', type: 'text' },
      { id: 'duvidas', name: 'dúvidas', type: 'text' },
      { id: 'estudos', name: 'estudos', type: 'text' },
      { id: 'sala-voz', name: 'sala de voz', type: 'voice' },
    ],
  },
  {
    id: 'matematica',
    name: 'Matemática',
    emoji: '📐',
    color: '#00e676',
    description: 'Aprenda matemática do básico ao avançado com a comunidade.',
    channels: [
      { id: 'geral', name: 'geral', type: 'text' },
      { id: 'duvidas', name: 'dúvidas', type: 'text' },
      { id: 'estudos', name: 'estudos', type: 'text' },
      { id: 'voz-mat', name: 'sala de voz', type: 'voice' },
    ],
  },
  {
    id: 'portugues',
    name: 'Português',
    emoji: '📝',
    color: '#3b82f6',
    description: 'Gramática, redação, literatura e interpretação de texto.',
    channels: [
      { id: 'geral', name: 'geral', type: 'text' },
      { id: 'duvidas', name: 'dúvidas', type: 'text' },
      { id: 'estudos', name: 'estudos', type: 'text' },
      { id: 'voz-por', name: 'sala de voz', type: 'voice' },
    ],
  },
  {
    id: 'historia',
    name: 'História',
    emoji: '🏛️',
    color: '#f59e0b',
    description: 'História do Brasil e do mundo, do geral ao vestibular.',
    channels: [
      { id: 'geral', name: 'geral', type: 'text' },
      { id: 'duvidas', name: 'dúvidas', type: 'text' },
      { id: 'estudos', name: 'estudos', type: 'text' },
      { id: 'voz-his', name: 'sala de voz', type: 'voice' },
    ],
  },
  {
    id: 'fisica',
    name: 'Física',
    emoji: '⚛️',
    color: '#8b5cf6',
    description: 'Mecânica, termodinâmica, eletromagnetismo e muito mais.',
    channels: [
      { id: 'geral', name: 'geral', type: 'text' },
      { id: 'duvidas', name: 'dúvidas', type: 'text' },
      { id: 'estudos', name: 'estudos', type: 'text' },
      { id: 'voz-fis', name: 'sala de voz', type: 'voice' },
    ],
  },
  {
    id: 'quimica',
    name: 'Química',
    emoji: '🧪',
    color: '#ec4899',
    description: 'Tabela periódica, reações químicas, estequiometria e mais.',
    channels: [
      { id: 'geral', name: 'geral', type: 'text' },
      { id: 'duvidas', name: 'dúvidas', type: 'text' },
      { id: 'estudos', name: 'estudos', type: 'text' },
      { id: 'voz-qui', name: 'sala de voz', type: 'voice' },
    ],
  },
  {
    id: 'biologia',
    name: 'Biologia',
    emoji: '🧬',
    color: '#10b981',
    description: 'Células, genética, ecologia, evolução e corpo humano.',
    channels: [
      { id: 'geral', name: 'geral', type: 'text' },
      { id: 'duvidas', name: 'dúvidas', type: 'text' },
      { id: 'estudos', name: 'estudos', type: 'text' },
      { id: 'voz-bio', name: 'sala de voz', type: 'voice' },
    ],
  },
]
