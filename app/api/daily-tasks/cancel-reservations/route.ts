import { NextRequest, NextResponse } from 'next/server'
import { cancelReservationsWithoutPayment } from '@/app/actions/daily-tasks'

export async function POST(request: NextRequest) {
  try {
    const result = await cancelReservationsWithoutPayment()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in cancel reservations API:', error)
    return NextResponse.json(
      { error: 'Failed to cancel reservations' },
      { status: 500 }
    )
  }
} 