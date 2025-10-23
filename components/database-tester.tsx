"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { runNetworkTest, runFullTest, getDatabaseInfo, getDebugInfo } from "@/app/actions/database-tests"
import { Loader2 } from "lucide-react"

export function DatabaseTester() {
  const [results, setResults] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const handleTest = async (testFunction: () => Promise<{ success: boolean; message: string; details?: string[]; data?: unknown }>) => {
    setResults("Running test...")
    startTransition(async () => {
      try {
        const res = await testFunction()
        if (res.success) {
          setResults(JSON.stringify(res.data || res.details || res.message, null, 2))
        } else {
          setResults(`Error: ${res.message}\n${JSON.stringify(res.details || {}, null, 2)}`)
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setResults(`Unhandled error: ${errorMessage}`)
      }
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Database Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button onClick={() => handleTest(runNetworkTest)} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Network Test
          </Button>
          <Button onClick={() => handleTest(runFullTest)} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Full Test (CRUD)
          </Button>
          <Button onClick={() => handleTest(getDatabaseInfo)} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Database Info
          </Button>
          <Button onClick={() => handleTest(getDebugInfo)} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Debug Info
          </Button>
        </div>
        <div className="relative">
          <Textarea
            value={results}
            readOnly
            rows={15}
            className="font-mono text-sm bg-gray-50 dark:bg-gray-900"
            placeholder="Test results will appear here..."
          />
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Note: Full Test creates and deletes a temporary table `v0_test_table`.
        </p>
      </CardContent>
    </Card>
  )
}
