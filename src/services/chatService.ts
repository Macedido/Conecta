import { authorizedApi, publicApi } from './authService'

export interface PersistedMessage {
  id: string
  author: string
  avatar: string
  text: string
  time: string
  userId?: string
  createdAt: string
}

export function getMessages(channel: string): Promise<PersistedMessage[]> {
  return publicApi(`/messages?channel=${encodeURIComponent(channel)}`)
}

export function createMessage(channel: string, text: string): Promise<PersistedMessage> {
  return authorizedApi('/messages', {
    method: 'POST',
    body: JSON.stringify({ channel, text }),
  })
}

export function removeMessage(channel: string, id: string): Promise<void> {
  return authorizedApi(`/messages/${encodeURIComponent(id)}?channel=${encodeURIComponent(channel)}`, {
    method: 'DELETE',
  })
}
