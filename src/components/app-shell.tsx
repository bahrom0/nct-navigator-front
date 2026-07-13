"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bot, GraduationCap, MessageCircle, Sparkles } from "lucide-react";
import { ProfileButton, ProfileDrawer } from "@/components/profile";
import { LoginModal } from "@/components/auth/LoginModal";
import { MaintenanceScreen } from "@/components/system/MaintenanceScreen";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { useServerStatusStore } from "@/stores/server-status-store";
import { logActivityEvent } from "@/lib/activity-logger";
import { useProfileSync } from "@/lib/chat/use-profile-sync";
import { useMobileChatNavStore } from "@/stores/mobile-chat-nav-store";
import { useDashboardMobileNavStore } from "@/stores/dashboard-mobile-nav-store";
import { useUserChatStore } from "@/lib/user-chat/store";
import { AnimatedShellTitle } from "@/components/animated-shell-title";
import { ThemeSync } from "@/components/theme/ThemeSync";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const activeGoal = useProfileStore((s) => s.activeGoal);
  const pathname = usePathname();
  const activeConversationId = useUserChatStore((s) => s.activeConversationId);
  const openMobileChatNav = useMobileChatNavStore((s) => s.open);
  const dashboardMobileNavOpen = useDashboardMobileNavStore((s) => s.isOpen);
  const isServerAvailable = useServerStatusStore((s) => s.isAvailable);
  const serverMessage = useServerStatusStore((s) => s.message);
  const maintenanceVariant = useServerStatusStore((s) => s.maintenanceVariant);
  const serverUpdatedAt = useServerStatusStore((s) => s.updatedAt);
  const markServerUnavailable = useServerStatusStore((s) => s.markUnavailable);
  const markServerAvailable = useServerStatusStore((s) => s.markAvailable);

  useProfileSync();

  const isChatRoute = pathname?.startsWith("/chat");
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const isMarketingRoute =
    pathname === "/" ||
    pathname === "/how-it-works" ||
    pathname === "/features" ||
    pathname === "/onboarding";
  const isCoreFlowRoute =
    pathname?.startsWith("/categories") ||
    pathname?.startsWith("/analyze") ||
    pathname?.startsWith("/recommendations") ||
    pathname?.startsWith("/interview") ||
    pathname?.startsWith("/plan") ||
    pathname?.startsWith("/coach");
  const showBackButton = isChatRoute && !!activeConversationId;

  useEffect(() => {
    const handler = () => {
      setOpen(true);
      logActivityEvent("open_profile", "Открытие профиля пользователем");
    };
    const onSync = () => setOpen((v) => v);
    window.addEventListener("profile:open", handler as EventListener);
    window.addEventListener("profile:sync", onSync);
    return () => {
      window.removeEventListener("profile:open", handler as EventListener);
      window.removeEventListener("profile:sync", onSync);
    };
  }, []);

  useEffect(() => {
    if (!isServerAvailable) return;
    hydrate();
  }, [hydrate, isServerAvailable]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 503) {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          void response
            .clone()
            .json()
            .then((payload: unknown) => {
              if (
                payload &&
                typeof payload === "object" &&
                (payload as { code?: string }).code === "SERVER_DISABLED"
              ) {
                markServerUnavailable({
                  message:
                    typeof (payload as { message?: string }).message === "string"
                      ? (payload as { message?: string }).message
                      : undefined,
                  maintenanceVariant:
                    (payload as { maintenanceVariant?: "standard" | "blackout" })
                      .maintenanceVariant === "blackout"
                      ? "blackout"
                      : "standard",
                });
              }
            })
            .catch(() => {});
        }
      } else if (response.ok) {
        markServerAvailable();
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [markServerAvailable, markServerUnavailable]);

  if (!isServerAvailable) {
    return (
      <>
        <ThemeSync />
        <MaintenanceScreen
          message={serverMessage}
          variant={maintenanceVariant}
          updatedAt={serverUpdatedAt}
        />
      </>
    );
  }

  if (isMarketingRoute) {
    return (
      <>
        <ThemeSync />
        <main className="flex-1">{children}</main>
        <LoginModal />
      </>
    );
  }

  return (
    <div className={isDashboardRoute ? "dashboard-route flex min-h-full flex-col" : "flex min-h-full flex-col"}>
      <ThemeSync />
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 lg:px-6">
        <div className={`pointer-events-auto relative mx-auto max-w-7xl overflow-hidden rounded-[1.9rem] border border-[var(--marketing-border)] bg-[var(--marketing-header-bg)] px-3 py-2.5 shadow-[0_24px_80px_rgba(28,24,18,0.14)] ring-1 ring-[rgba(255,255,255,0.28)] backdrop-blur-[22px] transition-opacity duration-300 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] dark:ring-[rgba(255,255,255,0.08)] ${isDashboardRoute && dashboardMobileNavOpen ? "opacity-[.55]" : ""}`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_45%)]" />
          <div className="relative flex min-h-12 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {showBackButton ? (
              <button
                type="button"
                onClick={openMobileChatNav}
                aria-label="Показать чаты"
                title="Показать чаты"
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-[var(--marketing-muted)] transition-colors hover:bg-[var(--marketing-nav-chip-hover)] hover:text-[var(--marketing-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--marketing-accent)]/30"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}
            <Link href="/" className="inline-flex min-w-0 items-center gap-3 text-sm font-semibold tracking-[-0.02em] text-[var(--marketing-foreground)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-surface)] shadow-[0_12px_30px_rgba(32,28,24,0.1)] backdrop-blur-xl dark:shadow-[0_12px_30px_rgba(0,0,0,0.32)]">
                <Sparkles className="h-4 w-4 text-[var(--marketing-accent)]" />
              </span>
              <span className="truncate"><AnimatedShellTitle isChat={!!isChatRoute} /></span>
            </Link>
          </div>
          <div className="relative flex shrink-0 items-center gap-2">
            {isAuthenticated && (
              <Link
                href="/coach"
                className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-primary px-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.24)] transition duration-200 hover:bg-primary-hover dark:bg-primary-hover dark:hover:bg-primary sm:px-4"
                aria-label={activeGoal ? "Coach" : "Основной путь"}
              >
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">{activeGoal ? "Учитель" : "Основной путь"}</span>
              </Link>
            )}
            {isAuthenticated && !isCoreFlowRoute ? (
              <>
                <Link
                  href="/teacher"
                  className="hidden h-10 items-center gap-1.5 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-surface)] px-3 text-sm font-medium text-[var(--marketing-muted)] shadow-[0_10px_24px_rgba(32,28,24,0.06)] backdrop-blur-xl transition-colors hover:border-[var(--marketing-border-strong)] hover:text-[var(--marketing-foreground)] sm:inline-flex"
                  aria-label="AI Help"
                >
                  <Bot className="h-4 w-4" />
                  <span className="hidden lg:inline">ИИ чат</span>
                </Link>
                <Link
                  href="/chat"
                  className="hidden h-10 items-center gap-1.5 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-surface)] px-3 text-sm font-medium text-[var(--marketing-muted)] shadow-[0_10px_24px_rgba(32,28,24,0.06)] backdrop-blur-xl transition-colors hover:border-[var(--marketing-border-strong)] hover:text-[var(--marketing-foreground)] sm:inline-flex"
                  aria-label="Community"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden lg:inline">Сообщество</span>
                </Link>
              </>
            ) : null}
            <ThemeToggle variant="marketing" />
            <ProfileButton />
          </div>
          </div>
        </div>
      </header>
      <main
        className={`flex-1 ${isDashboardRoute ? "pt-[5.75rem] sm:pt-[5.75rem]" : "pt-24 sm:pt-28"} ${
          pathname?.startsWith("/categories")
            ? "bg-[var(--marketing-bg)]"
            : ""
        }`}
      >
        {children}
      </main>
      <ProfileDrawer open={open} onClose={() => setOpen(false)} />
      <LoginModal />
    </div>
  );
}
