import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'
import crypto from 'crypto'

// POST /api/travel/payments - Process a payment
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.role !== 'travel') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, amount, paymentMethod, reference } = body

    if (!bookingId || !amount || !paymentMethod || !reference) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the booking belongs to this user
    const booking = await sql`
      SELECT id FROM reservations 
      WHERE id = ${bookingId} AND user_id = ${user.id}
    `

    if (!booking || booking.length === 0) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
    }

    // Create payment record
    const paymentId = crypto.randomUUID()
    await sql`
      INSERT INTO payments (id, reservation_id, amount, payment_method, reference, status)
      VALUES (${paymentId}, ${bookingId}, ${amount}, ${paymentMethod}, ${reference}, 'completed')
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Payment processed successfully' 
    })
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
} 