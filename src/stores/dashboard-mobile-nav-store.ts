import { create } from "zustand"

interface DashboardMobileNavState {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useDashboardMobileNavStore = create<DashboardMobileNavState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
