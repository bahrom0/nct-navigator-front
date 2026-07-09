"use client"

import { create } from "zustand"

export interface ServerStatusState {
  isAvailable: boolean
  message: string
  maintenanceVariant: "standard" | "blackout"
  updatedAt: string | null
  markUnavailable: (input?: {
    message?: string
    maintenanceVariant?: "standard" | "blackout"
    updatedAt?: string | null
  }) => void
  markAvailable: () => void
}

const DEFAULT_MESSAGE = "Сайт временно не работает"

export const useServerStatusStore = create<ServerStatusState>((set) => ({
  isAvailable: true,
  message: DEFAULT_MESSAGE,
  maintenanceVariant: "standard",
  updatedAt: null,

  markUnavailable: (input) =>
    set({
      isAvailable: false,
      message: input?.message?.trim() || DEFAULT_MESSAGE,
      maintenanceVariant:
        input?.maintenanceVariant === "blackout" ? "blackout" : "standard",
      updatedAt: input?.updatedAt ?? null,
    }),

  markAvailable: () =>
    set({
      isAvailable: true,
    }),
}))
