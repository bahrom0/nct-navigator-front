"use client"

import { useMemo, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { MessageSquare, PanelRightClose, Plus, X } from "lucide-react"
import { useCoachStore } from "@/stores/coach-store"
import type { CoachMessage } from "@/types/coach"

interface CoachChatHistoryProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
  onNewChat?: () => void
}

const LEGACY_CONVERSATION_KEY = "legacy"

interface ConversationEntry {
  key: string
  id: string | null
  title: string
  updatedAt: number
  messageCount: number
}

function buildConversations(messages: CoachMessage[]): ConversationEntry[] {
  const groups = new Map<string, CoachMessage[]>()

  for (const message of messages) {
    const key = message.conversationId ?? LEGACY_CONVERSATION_KEY
    const bucket = groups.get(key)
    if (bucket) {
      bucket.push(message)
    } else {
      groups.set(key, [message])
    }
  }

  const entries: ConversationEntry[] = []
  for (const [key, bucket] of groups) {
    const ordered = [...bucket].sort((a, b) => a.timestamp - b.timestamp)
    const firstUser = ordered.find((message) => message.role === "user")
    entries.push({
      key,
      id: key === LEGACY_CONVERSATION_KEY ? null : key,
      title: (firstUser ?? ordered[0])?.content.trim() || "Диалог",
      updatedAt: ordered[ordered.length - 1]?.timestamp ?? 0,
      messageCount: ordered.length,
    })
  }

  return entries.sort((a, b) => b.updatedAt - a.updatedAt)
}

export function CoachChatHistory({ mobileOpen = false, onMobileClose, onNewChat }: CoachChatHistoryProps) {
  return (
    <>
      <aside className="hidden h-full w-[300px] shrink-0 py-2 pr-2 lg:flex">
        <HistoryPanel onClose={undefined} onNewChat={onNewChat} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <div className="hidden">
            <motion.button
              type="button"
              aria-label="Закрыть историю чата"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="absolute inset-0 bg-black/45"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-y-0 right-0 w-[min(88vw,340px)] p-2"
            >
              <HistoryPanel onClose={onMobileClose} onNewChat={onNewChat} />
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>
      <MobileHistoryPortal mobileOpen={mobileOpen} onMobileClose={onMobileClose} onNewChat={onNewChat} />
    </>
  )
}

function MobileHistoryPortal({ mobileOpen, onMobileClose, onNewChat }: CoachChatHistoryProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <motion.button
            type="button"
            aria-label="Закрыть историю чата"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 bg-black/45"
            onClick={onMobileClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-y-0 right-0 w-[min(88vw,340px)] p-2"
          >
            <HistoryPanel onClose={onMobileClose} onNewChat={onNewChat} />
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

function HistoryPanel({ onClose, onNewChat }: { onClose?: () => void; onNewChat?: () => void }) {
  const messages = useCoachStore((s) => s.messages)
  const activeConversationId = useCoachStore((s) => s.activeConversationId)
  const setActiveConversation = useCoachStore((s) => s.setActiveConversation)
  const goal = useCoachStore((s) => s.goal)

  const conversations = useMemo(() => buildConversations(messages), [messages])
  const activeKey = activeConversationId ?? LEGACY_CONVERSATION_KEY

  const selectConversation = (id: string | null) => {
    setActiveConversation(id)
    onClose?.()
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border border-border bg-[var(--marketing-surface-strong)] shadow-[0_20px_54px_rgba(28,24,18,0.10)]">
      <div className="shrink-0 border-b border-border px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">История чата</h2>
            </div>
            <p className="mt-1 truncate text-xs text-text-muted">
              {goal?.nctTitle ?? "Текущий диалог с Coach"}
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть историю"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <PanelRightClose className="mt-1 h-4 w-4 text-text-muted" aria-hidden="true" />
          )}
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Новый диалог
        </button>
      </div>

      <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        {conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-soft text-text-muted">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-foreground">История пуста</p>
            <p className="mt-1 text-xs leading-5 text-text-muted">Начните диалог — здесь появится отдельная карточка для него.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const active = conversation.key === activeKey
              return (
                <button
                  key={conversation.key}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  aria-current={active ? "true" : undefined}
                  className={`w-full rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                    active
                      ? "border-border bg-surface-raised shadow-[0_8px_20px_rgba(28,24,18,0.06)]"
                      : "border-transparent hover:border-border hover:bg-foreground/5"
                  }`}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className={`truncate text-sm font-semibold ${active ? "text-foreground" : "text-text-secondary"}`}>
                      {conversation.title}
                    </span>
                    <span className="shrink-0 text-[11px] text-text-muted">
                      {conversation.updatedAt
                        ? new Date(conversation.updatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
                        : null}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {conversation.messageCount} {pluralMessages(conversation.messageCount)}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function pluralMessages(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return "сообщение"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "сообщения"
  return "сообщений"
}
