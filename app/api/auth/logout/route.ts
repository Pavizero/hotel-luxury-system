import { NextResponse } from "next/server"
import { clearAuthCookie } from "@/lib/auth-simple"

export async function POST() {
  clearAuthCookie()
  return NextResponse.json({ success: true })
}