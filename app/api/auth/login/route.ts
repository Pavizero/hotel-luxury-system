import { NextRequest, NextResponse } from "next/server"
import { authenticate, signToken, setAuthCookie } from "@/lib/auth-simple"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const user = await authenticate(email, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await signToken({ id: user.id, role: user.role })
    const response = NextResponse.json({ user })

    setAuthCookie(response, token)
    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}