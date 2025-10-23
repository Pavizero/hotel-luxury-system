import { NextRequest, NextResponse } from "next/server"
import { addUser, signToken, setAuthCookie } from "@/lib/auth-simple"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = "customer", companyName, loyaltyTier, loyaltyPoints, employeeId, companyId } = await request.json()

    // Ensure required fields are present
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["customer", "clerk", "manager", "travel"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // For travel companies, use company name as the user name
    const finalName = role === "travel" && companyName ? companyName : name
    
    // Create the user
    const user = await addUser({ name: finalName, email, password, role, loyaltyTier, loyaltyPoints, employeeId, companyId })
    if (!user) {
      return NextResponse.json({ error: "User creation failed (email may already exist)" }, { status: 400 })
    }

    // Sign a JWT token for the new user
    const token = await signToken({ id: user.id, role: user.role })
    const response = NextResponse.json({ user })

    // Set the auth-token cookie
    setAuthCookie(response, token)
    return response
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}