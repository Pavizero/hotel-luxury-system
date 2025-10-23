import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge and deduplicate class names using clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as Sri Lankan Rupees (LKR) currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date string or Date object as a human-readable date (long format).
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Format a date string or Date object as a human-readable date and time.
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

/**
 * Generate a random (pseudo-unique) string ID.
 */
export function generateId(): string {
  // Use crypto if available for better randomness, fallback to Math.random
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(2)
    window.crypto.getRandomValues(array)
    return (
      array[0].toString(36).substr(0, 5) + array[1].toString(36).substr(0, 4)
    )
  }
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Trigger a file download in the browser with the given content and filename.
 */
export function downloadFile(content: string, filename: string, type = "text/plain") {
  if (typeof window === "undefined") return
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}