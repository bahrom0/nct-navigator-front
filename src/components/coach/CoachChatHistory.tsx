"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Bot, MessageSquare, PanelRightClose, Plus, UserRound, X } from "lucide-react"
import { useCoachStore } from "@/stores/coach-store"

interface CoachChatHistoryProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
  onNewChat?: () => void
}

export function CoachChatHistory({ mobileOpen = false, onMobileClose, onNewChat }: CoachChatHistoryProps) {
  return (
    <>
      <aside className="hidden h-full w-[300px] shrink-0 py-2 pr-2 lg:flex">
        <HistoryPanel onClose={undefined} onNewChat={onNewChat} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
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
    </>
  )
}

function HistoryPanel({ onClose, onNewChat }: { onClose?: () => void; onNewChat?: () => void }) {
  const messages = useCoachStore((s) => s.messages)
  const goal = useCoachStore((s) => s.goal)
  const sorted = [...messages].sort((a, b) => b.timestamp - a.timestamp)
  const activeMessageId = messages.at(-1)?.id ?? null

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card-bg/90 shadow-[0_20px_54px_rgba(28,24,18,0.10)] backdrop-blur">
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
        {sorted.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-soft text-text-muted">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-foreground">История пуста</p>
            <p className="mt-1 text-xs leading-5 text-text-muted">После первого сообщения здесь появятся фрагменты диалога.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {sorted.map((msg) => {
              const active = msg.id === activeMessageId
              const Icon = msg.role === "coach" ? Bot : UserRound
              return (
                <button
                  key={msg.id}
                  type="button"
                  className={`group w-full rounded-2xl px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border border-border bg-surface-raised"
                      : "border border-transparent text-text-secondary hover:border-border hover:bg-foreground/5"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${msg.role === "coach" ? "text-primary" : "text-text-muted"}`} aria-hidden="true" />
                    <span className="truncate text-xs font-medium text-text-muted">
                      {msg.role === "user" ? "Вы" : "Coach"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {msg.content}
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
