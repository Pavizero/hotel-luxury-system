"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const getRoleBasedRedirect = useCallback((role: string) => {
    switch (role) {
      case "clerk":
        return "/dashboard/clerk"
      case "manager":
        return "/dashboard/manager"
      case "travel":
        return "/dashboard/travel"
      case "customer":
        return callbackUrl !== "/" ? callbackUrl : "/dashboard/customer"
      default:
        return "/"
    }
  }, [callbackUrl])

  useEffect(() => {
    if (!loading && user) {
      const redirectUrl = getRoleBasedRedirect(user.role)
      router.push(redirectUrl)
    }
  }, [user, loading, router, getRoleBasedRedirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const success = await login(email, password)

    if (success) {
      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      })
      // Redirect handled in useEffect
    } else {
      setError("Invalid email or password. Please try again.")
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const demoAccounts = [
    { role: "Customer", email: "customer@hotel.com", description: "Book rooms, view reservations" },
    { role: "Clerk", email: "clerk@hotel.com", description: "Check-in/out, walk-in bookings" },
    { role: "Manager", email: "manager@hotel.com", description: "Reports, room management" },
    { role: "Travel Company", email: "travel.agency@hotel.com", description: "Bulk bookings, invoices" },
  ]

  const quickLogin = (email: string) => {
    setEmail(email)
    setPassword("password")
  }

  // Show loading indicator if auth context is still loading (prevents flicker)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-4 text-charcoal text-lg">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sage/10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-primary">
            Hotel Luxury
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-charcoal">Sign in to your account</h2>
          <p className="mt-2 text-sm text-charcoal/70">Access your reservations and manage your stay</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-charcoal/50" />
                  ) : (
                    <Eye className="h-5 w-5 text-charcoal/50" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-charcoal mb-3">Demo accounts for testing:</p>
              <div className="space-y-2">
                {demoAccounts.map((account, index) => (
                  <div key={index} className="text-xs bg-sage/10 rounded p-2">
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <div className="font-semibold text-charcoal">{account.role}</div>
                        <div className="text-charcoal/70">{account.email} / password</div>
                        <div className="text-charcoal/60 text-xs">{account.description}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => quickLogin(account.email)}
                        className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/90 transition-colors"
                        disabled={isLoading}
                      >
                        Quick Login
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-charcoal/70">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-primary hover:text-primary/80 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}