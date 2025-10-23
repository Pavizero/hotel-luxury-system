import { NextRequest, NextResponse } from 'next/server'
import { createNoShowBilling } from '@/app/actions/daily-tasks'

export async function POST(request: NextRequest) {
  try {
    const result = await createNoShowBilling()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in no-show billing API:', error)
    return NextResponse.json(
      { error: 'Failed to create no-show billing' },
      { status: 500 }
    )
  }
} 