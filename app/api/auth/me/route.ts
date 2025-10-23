import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-simple"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get me error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}