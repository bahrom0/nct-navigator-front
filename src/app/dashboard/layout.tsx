import type { ReactNode } from "react"
import { DashboardSidebar } from "./sidebar"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-shell flex min-h-[calc(100vh-3.5rem)]">
      <DashboardSidebar />
      <main className="dashboard-main flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-3 lg:px-8">
        <div className="dashboard-content mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
