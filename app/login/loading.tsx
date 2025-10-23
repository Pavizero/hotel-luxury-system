import { Loader2 } from "lucide-react"

/**
 * A loading spinner for route transitions or suspense boundaries.
 * This provides visual feedback while the login page (or other content)
 * is being loaded.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}