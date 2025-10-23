import { NextRequest, NextResponse } from 'next/server'
import { generateDailyReport } from '@/app/actions/daily-tasks'

export async function POST(request: NextRequest) {
  try {
    const result = await generateDailyReport()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in generate report API:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily report' },
      { status: 500 }
    )
  }
} 