import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      message: "Auth API is working",
      env: {
        hasSecret: Boolean(process.env.JWT_SECRET),
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    console.error("Test auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}