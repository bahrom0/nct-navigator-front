"use client"

import type { MessageRecord } from "./types"

type MessageChangeHandler = (msg: MessageRecord) => void
type PresenceHandler = (userId: string, online: boolean) => void
type TypingHandler = (
  conversationId: string,
  userId: string,
  username: string,
  isTyping: boolean,
) => void

export class UserChatRealtime {
  private disconnectFn: (() => void) | null = null

  connect(
    _userId: string,
    _conversationId: string,
    handlers: {
      onMessage: MessageChangeHandler
      onPresence?: PresenceHandler
      onTyping?: TypingHandler
      onSubscribed?: () => void
    },
  ) {
    this.disconnect()

    // Frontend no longer opens a direct Supabase realtime connection.
    // We keep the contract stable and rely on existing HTTP sync flows.
    const timer = window.setTimeout(() => {
      handlers.onSubscribed?.()
    }, 0)

    this.disconnectFn = () => {
      window.clearTimeout(timer)
    }
  }

  disconnect() {
    if (this.disconnectFn) {
      this.disconnectFn()
      this.disconnectFn = null
    }
  }

  sendTyping(_username: string, _isTyping: boolean) {
    // no-op in HTTP-only frontend mode
  }

  isConnected(): boolean {
    return false
  }
}

export const userChatRealtime = new UserChatRealtime()
