"use client"

import { useCallback, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowUp, Loader2 } from "lucide-react"

interface ChatComposerProps {
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  isLoading: boolean
  placeholder?: string
}

export function ChatComposer({
  input,
  onInputChange,
  onSend,
  isLoading,
  placeholder = "Спросите наставника...",
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canSend = typeof input === "string" && input.trim().length > 0 && !isLoading

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="mx-auto w-full max-w-[820px] px-3 pb-[max(0.9rem,env(safe-area-inset-bottom))] sm:px-6">
      <motion.div
        layout
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="group flex items-end gap-2 rounded-[1.6rem] border border-border bg-surface-raised/95 px-3 py-2 shadow-[0_10px_28px_rgba(28,24,18,0.08)] backdrop-blur transition-[border-color,box-shadow] duration-200 focus-within:border-border-hover focus-within:ring-4 focus-within:ring-primary/10"
      >
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={typeof input === "string" ? input : ""}
            onChange={(e) => {
              onInputChange(e.target.value)
              requestAnimationFrame(adjustHeight)
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="min-h-11 w-full resize-none bg-transparent px-1 py-3 text-[15px] leading-6 text-foreground placeholder:text-text-muted focus:outline-none disabled:opacity-50"
            style={{ maxHeight: "128px" }}
            aria-label="Сообщение наставнику"
          />
        </div>

        <motion.button
          type="button"
          whileTap={canSend ? { scale: 0.96 } : undefined}
          onClick={() => onSend()}
          disabled={!canSend}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[1.15rem] bg-primary text-white transition-colors hover:bg-primary-hover disabled:bg-foreground/12 disabled:text-text-muted disabled:opacity-80"
          aria-label="Отправить"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </motion.button>
      </motion.div>
    </div>
  )
}
