import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of public (unauthenticated) paths
const publicPaths = ["/", "/about", "/contact", "/reservation", "/login", "/signup"]

function normalizePath(path: string) {
  // Lowercase and remove trailing slash (except for root '/')
  if (path === "/") return path
  return path.replace(/\/+$/, "").toLowerCase()
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const path = normalizePath(pathname)

  // Check if current path is public (allow both /contact and /contact/)
  const isPublicPath = publicPaths.includes(path)

  // Get auth token from cookies
  const token = request.cookies.get("auth-token")?.value

  // Allow access to all public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // If not public and no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.nextUrl))
  }

  // If token exists, allow access (role-based checks are client-side)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run middleware on all routes except:
    // - API routes, static files, optimized images, favicon, and public images
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
}