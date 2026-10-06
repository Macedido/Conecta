import { authorizedApi } from './authService'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function sendAIMessage(history: AIMessage[]): Promise<string> {
  const result = await authorizedApi<{ text: string }>('/ai', {
    method: 'POST',
    body: JSON.stringify({ messages: history }),
  })
  return result.text
}
