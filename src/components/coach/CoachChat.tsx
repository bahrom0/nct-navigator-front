"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { MessageSquare, Sparkles } from "lucide-react"
import { useCoachStore } from "@/stores/coach-store"
import { useProfileStore } from "@/stores/profile-store"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatComposer } from "@/components/chat/chat-composer"
import { CoachChatHistory } from "./CoachChatHistory"
import { CoachMiniTest } from "./CoachMiniTest"
import type { CoachMessage, CoachMiniTest as CoachMiniTestData, CoachMiniTestResult, CoachMiniTestAnswerReview } from "@/types/coach"
import type { TeacherMessage } from "@/types/teacher"

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type PersistedCoachMessageRow = {
  id: string
  role: "user" | "coach"
  content: string
  message_type?: CoachMessage["type"]
  created_at?: string
  metadata?: {
    miniTest?: CoachMiniTestData
  } | null
}

function toMiniTestFromResponse(subject: string | undefined, questions: unknown[]): CoachMiniTestData {
  return {
    id: generateId(),
    subject: subject ?? "",
    questions: questions.map((question) => {
      const candidate = question as {
        question?: string
        options?: string[]
        explanation?: string
        correctIndex?: number
        correct_answer?: string
      }
      let correctIndex = candidate.correctIndex
      if (correctIndex == null && candidate.correct_answer && Array.isArray(candidate.options)) {
        const resolved = candidate.options.indexOf(candidate.correct_answer)
        correctIndex = resolved >= 0 ? resolved : 0
      }

      return {
        id: generateId(),
        question: candidate.question ?? "",
        options: candidate.options ?? [],
        correctIndex: correctIndex ?? 0,
        explanation: candidate.explanation ?? "",
      }
    }),
  }
}

function toCoachMessage(row: PersistedCoachMessageRow): CoachMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    type: row.message_type ?? "text",
    miniTest: row.metadata?.miniTest,
    timestamp: row.created_at ? Date.parse(row.created_at) : Date.now(),
  }
}

async function persistCoachMessage(message: CoachMessage, goalId?: string): Promise<void> {
  await fetch("/api/coach/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: message.id,
      goalId,
      role: message.role,
      content: message.content,
      type: message.type,
      timestamp: message.timestamp,
      miniTest: message.miniTest,
    }),
  })
}

async function patchCoachMessage(messageId: string, patch: { content?: string; miniTest?: CoachMiniTestData }): Promise<void> {
  await fetch("/api/coach/messages", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: messageId,
      ...patch,
    }),
  })
}

export function CoachChat() {
  const {
    messages: rawMessages,
    setMessages,
    addMessage,
    goal,
    plan,
    roadmap,
    dayPlan,
    dailyHistory,
    diagnostics: rawDiagnostics,
    miniTests: rawMiniTests,
    setMiniTests,
    addMiniTest,
    setMiniTestResult,
    clearMessages,
    progress,
    isLoading,
    setLoading,
    error,
    setError,
  } = useCoachStore()
  const profileGoal = useProfileStore((s) => s.activeGoal)
  const resolvedGoal = goal ?? profileGoal

  const [input, setInput] = useState("")
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const hydratedGoalRef = useRef<string | null>(null)
  const messages = useMemo(() => (Array.isArray(rawMessages) ? rawMessages : []), [rawMessages])
  const diagnostics = useMemo(() => (Array.isArray(rawDiagnostics) ? rawDiagnostics : []), [rawDiagnostics])
  const miniTests = useMemo(() => (Array.isArray(rawMiniTests) ? rawMiniTests : []), [rawMiniTests])
  const resolvedGoalId = resolvedGoal?.id

  const chatMessages = useMemo<TeacherMessage[]>(
    () =>
      messages.map((message) => ({
        id: message.id,
        role: message.role === "coach" ? "assistant" : "user",
        content: message.content,
        timestamp: message.timestamp,
      })),
    [messages],
  )

  useEffect(() => {
    const goalId = resolvedGoalId
    if (!goalId || hydratedGoalRef.current === goalId) return
    const activeGoalId = goalId

    let cancelled = false

    async function loadPersistedMessages() {
      try {
        const res = await fetch(`/api/coach/messages?goalId=${encodeURIComponent(activeGoalId)}`, {
          method: "GET",
        })

        if (!res.ok) {
          return
        }

        const payload = await res.json()
        if (cancelled || payload.status !== "success" || !Array.isArray(payload.data)) {
          return
        }

        const nextMessages: CoachMessage[] = payload.data.map((row: PersistedCoachMessageRow) => toCoachMessage(row))
        const nextMiniTests = nextMessages
          .map((message: CoachMessage) => message.miniTest)
          .filter((item): item is CoachMiniTestData => Boolean(item))

        setMessages(nextMessages)
        setMiniTests(nextMiniTests)
        hydratedGoalRef.current = activeGoalId
      } catch {
        // fall back to persisted client state
      }
    }

    void loadPersistedMessages()

    return () => {
      cancelled = true
    }
  }, [resolvedGoalId, setMessages, setMiniTests])

  const handleSend = useCallback(async (prefilledText?: string) => {
    const text = (prefilledText ?? input).trim()
    if (!text || isLoading) return

    setInput("")
    setStreamingId(null)

    const userMsg: CoachMessage = {
      id: generateId(),
      role: "user",
      content: text,
      type: "text",
      timestamp: Date.now(),
    }
    addMessage(userMsg)
    if (resolvedGoalId) {
      void persistCoachMessage(userMsg, resolvedGoalId)
    }

    setLoading(true)
    setError(null)

    const history = messages.slice(-20).map((message) => ({
      role: (message.role === "coach" ? "assistant" : "user") as "user" | "assistant",
      content: message.content,
    }))

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          goal: resolvedGoal,
          plan,
          roadmap,
          dayPlan,
          dailyHistory,
          diagnostics: diagnostics[0] ?? null,
          miniTests: miniTests.map((test) => test.result).filter(Boolean),
          progress,
        }),
      })

      const result = await res.json()
      if (result.status === "error") {
        setError(result.error ?? "Ошибка при получении ответа")
        return
      }

      const reply = result.data?.reply?.trim()
      if (!reply) {
        setError(result.error ?? "Coach временно не отвечает. Попробуйте ещё раз.")
        return
      }

      let nextMiniTest: CoachMiniTestData | undefined
      if (result.data?.type === "mini_test" && Array.isArray(result.data.questions) && result.data.questions.length > 0) {
        nextMiniTest = toMiniTestFromResponse(result.data.subject, result.data.questions)
        addMiniTest(nextMiniTest)
      }

      const coachMsg: CoachMessage = {
        id: generateId(),
        role: "coach",
        content: reply,
        type: result.data?.type ?? "text",
        miniTest: nextMiniTest,
        timestamp: Date.now(),
      }

      addMessage(coachMsg)
      setStreamingId(coachMsg.id)

      if (resolvedGoalId) {
        void persistCoachMessage(coachMsg, resolvedGoalId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сети")
    } finally {
      setLoading(false)
    }
  }, [input, isLoading, addMessage, messages, resolvedGoal, resolvedGoalId, setLoading, setError, plan, roadmap, dayPlan, dailyHistory, diagnostics, miniTests, progress, addMiniTest])

  const handleMiniTestComplete = useCallback(async (
    testId: string,
    results: {
      correct: number
      total: number
      selectedAnswers: Array<number | null>
      review: CoachMiniTestAnswerReview[]
    },
  ) => {
    const miniTest = miniTests.find((item) => item.id === testId)
      ?? messages.find((message) => message.miniTest?.id === testId)?.miniTest

    if (!miniTest) return

    const resultPayload: CoachMiniTestResult = {
      totalQuestions: results.total,
      correctAnswers: results.correct,
      subject: miniTest.subject ?? "",
      takenAt: Date.now(),
      selectedAnswers: results.selectedAnswers,
      review: results.review,
    }

    setMiniTestResult(testId, resultPayload)

    const ownerMessage = messages.find((message) => message.miniTest?.id === testId)
    const persistedMiniTest: CoachMiniTestData = {
      ...miniTest,
      result: resultPayload,
    }

    if (ownerMessage?.id) {
      void patchCoachMessage(ownerMessage.id, { miniTest: persistedMiniTest })
    }

    try {
      const res = await fetch("/api/coach/mini-test-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          miniTest: persistedMiniTest,
          result: resultPayload,
        }),
      })

      const payload = await res.json()
      if (payload.status !== "success" || !payload.data?.reply?.trim()) {
        return
      }

      const reportMessage: CoachMessage = {
        id: generateId(),
        role: "coach",
        content: payload.data.reply.trim(),
        type: "progress_update",
        timestamp: Date.now(),
      }

      addMessage(reportMessage)
      if (resolvedGoalId) {
        void persistCoachMessage(reportMessage, resolvedGoalId)
      }
    } catch {
      // Non-blocking: the quiz result is already saved locally/server-side.
    }
  }, [miniTests, messages, setMiniTestResult, addMessage, resolvedGoalId])

  const regenerateMessage = useCallback(
    (messageId: string) => {
      const messageIndex = chatMessages.findIndex((message) => message.id === messageId)
      const previousUserMessage = chatMessages
        .slice(0, messageIndex)
        .reverse()
        .find((message) => message.role === "user")

      if (previousUserMessage) {
        void handleSend(previousUserMessage.content)
      }
    },
    [chatMessages, handleSend],
  )

  const startNewChat = useCallback(() => {
    clearMessages()
    setInput("")
    setStreamingId(null)
    setError(null)
    setHistoryOpen(false)
  }, [clearMessages, setError])

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-background lg:rounded-[1.75rem] lg:border lg:border-border lg:bg-card-bg/45 lg:shadow-[0_18px_54px_rgba(28,24,18,0.06)] lg:backdrop-blur">
      <div className="relative flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-raised/95 text-text-secondary shadow-sm backdrop-blur transition-colors hover:text-foreground lg:hidden"
          aria-label="Открыть историю чата"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
        </button>
        <ChatMessages
          messages={chatMessages}
          isLoading={isLoading}
          error={error}
          streamingId={streamingId}
          onRegenerate={regenerateMessage}
          loadingText="Coach думает..."
          emptyState={(
            <AnimatePresence mode="wait">
              <motion.div
                key="coach-empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mx-auto flex max-w-xl flex-col items-center text-center"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-soft text-primary">
                  <Sparkles className="h-7 w-7" aria-hidden="true" />
                </div>
                <h1 className="text-xl font-semibold tracking-[-0.02em] text-foreground">С чего начнём?</h1>
                <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                  Спросите наставника о теме, задании, плане подготовки или мини-тесте по текущей цели.
                </p>
              </motion.div>
            </AnimatePresence>
          )}
          renderAfterMessage={(messageId) => {
            const message = messages.find((item) => item.id === messageId)
            if (!message?.miniTest) return null

            return (
              <div className="mx-auto w-full max-w-[760px] sm:px-6">
                <CoachMiniTest
                  questions={message.miniTest.questions}
                  subject={message.miniTest.subject}
                  result={message.miniTest.result}
                  onComplete={(results) => void handleMiniTestComplete(message.miniTest!.id, results)}
                />
              </div>
            )
          }}
        />
        <div className="z-20 shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-3 sm:pt-4">
          <ChatComposer
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            isLoading={isLoading}
            placeholder="Спросите наставника..."
          />
        </div>
      </div>
      <CoachChatHistory
        mobileOpen={historyOpen}
        onMobileClose={() => setHistoryOpen(false)}
        onNewChat={startNewChat}
      />
    </div>
  )
}
