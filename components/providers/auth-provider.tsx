"use client"

import { AuthProvider as SimpleAuthProvider } from "@/hooks/use-auth"
import type { ReactNode } from "react"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SimpleAuthProvider>{children}</SimpleAuthProvider>
}
