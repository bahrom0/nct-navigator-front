import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:4010"
  const incomingUrl = new URL(request.url)
  const redirectUrl = new URL("/auth/callback", backendOrigin)

  incomingUrl.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value)
  })

  return NextResponse.redirect(redirectUrl.toString())
}
