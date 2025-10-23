import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { hash, compare } from "bcryptjs"
import { sql } from "@/lib/db"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-here")

export interface User {
  id: string
  email: string
  name: string
  role: string
  loyaltyTier?: string
  loyaltyPoints?: number
  employeeId?: string
  companyId?: string
}

export interface JWTPayload {
  id: string;
  role: string;
  [key: string]: unknown;
}

export async function signToken(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch {
    return null
  }
}

// Add a type for the user row returned from the DB
interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash?: string;
  password?: string;
  loyalty_points?: number;
  loyalty_program_id?: string;
  employee_id?: string;
  company_id?: string;
}

// Add a type for the loyalty program row
interface LoyaltyProgramRow {
  tier_name: string;
}

// Add a type for the joined user row with loyalty tier
interface UserWithLoyaltyTierRow extends UserRow {
  loyalty_tier_name?: string;
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  try {
    const result = await sql<UserRow>`SELECT * FROM users WHERE email = ${email}`;
    const user = result[0];
    if (!user) {
      console.log("No user found for email:", email);
      return null;
    }

    // Debug: log the password received and the hash from DB
    console.log("Password received:", JSON.stringify(password));
    if (user.password_hash) {
      console.log("User's hash from DB:", user.password_hash, "| length:", (user.password_hash || '').length);
    }

    let passwordMatch = false;

    // Try bcrypt hash
    if (user.password_hash && typeof user.password_hash === "string" && user.password_hash.length === 60) {
      passwordMatch = await compare(password, user.password_hash.trim());
      console.log("Tried bcrypt compare:", passwordMatch);
    } else if (user.password_hash && user.password_hash.length !== 60) {
      console.log("Hash is wrong length, expected 60, got:", user.password_hash.length);
    }

    // Fallback: try plaintext password (for dev/demo only)
    if (!passwordMatch && user.password && user.password === password) {
      passwordMatch = true;
      console.log("Tried plaintext compare: success");
    }

    if (!passwordMatch) {
      console.log("Password did not match for:", email);
      return null;
    }

    // Get loyalty tier if exists
    let loyaltyTier;
    if (user.loyalty_program_id) {
      const tierResult = await sql<LoyaltyProgramRow>`SELECT tier_name FROM loyalty_programs WHERE id = ${user.loyalty_program_id}`;
      loyaltyTier = tierResult[0]?.tier_name;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      loyaltyTier: loyaltyTier,
      loyaltyPoints: user.loyalty_points,
      employeeId: user.employee_id,
      companyId: user.company_id,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export async function addUser(newUser: Omit<User, "id"> & { password?: string }): Promise<User | null> {
  try {
    const hashedPassword = newUser.password ? await hash(newUser.password, 10) : null

    // Get loyalty_program_id if loyaltyTier is provided
    let loyaltyProgramId: string | null = null
    if (newUser.loyaltyTier) {
      const tierResult = await sql<{ id: string }>`SELECT id FROM loyalty_programs WHERE tier_name = ${newUser.loyaltyTier}`
      loyaltyProgramId = tierResult[0]?.id || null
    }

    await sql`
      INSERT INTO users (name, email, password_hash, role, loyalty_points, loyalty_program_id, employee_id, company_id)
      VALUES (
        ${newUser.name},
        ${newUser.email},
        ${hashedPassword},
        ${newUser.role},
        ${newUser.loyaltyPoints || 0},
        ${loyaltyProgramId},
        ${newUser.employeeId || null},
        ${newUser.companyId || null}
      )
    `
    const insertIdArr = await sql<{ id: string }>`SELECT LAST_INSERT_ID() as id`;
    if (!insertIdArr[0] || typeof insertIdArr[0].id !== 'string') return null;
    const userId = insertIdArr[0].id;

    const insertedUserArr = await sql<UserWithLoyaltyTierRow>`
      SELECT u.*, lp.tier_name as loyalty_tier_name
      FROM users u
      LEFT JOIN loyalty_programs lp ON u.loyalty_program_id = lp.id
      WHERE u.id = ${userId}
    `;
    const insertedUser = insertedUserArr[0];
    if (!insertedUser) {
      return null;
    }
    return {
      id: insertedUser.id,
      email: insertedUser.email,
      name: insertedUser.name,
      role: insertedUser.role,
      loyaltyTier: insertedUser.loyalty_tier_name,
      loyaltyPoints: insertedUser.loyalty_points,
      employeeId: insertedUser.employee_id,
      companyId: insertedUser.company_id,
    };
  } catch (error) {
    console.error("Add user error:", error)
    return null
  }
}

export async function getUser(request?: NextRequest): Promise<User | null> {
  try {
    let token: string | undefined

    if (request) {
      token = request.cookies.get("auth-token")?.value
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get("auth-token")?.value
    }

    if (!token) return null

    const payload = await verifyToken(token)
    if (!payload || !payload.id) return null

    const result = await sql<UserWithLoyaltyTierRow>`
      SELECT u.*, lp.tier_name as loyalty_tier_name
      FROM users u
      LEFT JOIN loyalty_programs lp ON u.loyalty_program_id = lp.id
      WHERE u.id = ${payload.id}
    `;
    const user = result[0];
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      loyaltyTier: user.loyalty_tier_name,
      loyaltyPoints: user.loyalty_points,
      employeeId: user.employee_id,
      companyId: user.company_id,
    };
  } catch (error) {
    console.error("Get user error:", error)
    return null
  }
}

// This function now accepts the response object to set the cookie correctly in Next.js Route Handlers
export function setAuthCookie(response: unknown, token: string) {
  // @ts-expect-error: response.cookies is available in Next.js Response
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  })
}

export function clearAuthCookie() {
  cookies().then(cookieStore => {
    cookieStore.delete("auth-token");
  });
}