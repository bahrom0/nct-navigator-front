import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "NCT Navigator",
  description:
    "Подбор кодов НЦТ, объяснение выбора и план подготовки в одном спокойном интерфейсе.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head />
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <AppShell>{children}</AppShell>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--foreground)",
              fontSize: "14px",
            },
            duration: 2000,
          }}
        />
      </body>
    </html>
  );
}
