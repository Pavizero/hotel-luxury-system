"use client"

import { AuthProvider as UseAuthProvider } from "@/hooks/use-auth"
import type { ReactNode } from "react"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <UseAuthProvider>{children}</UseAuthProvider>
}