import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'
import { PaymentService } from '@/lib/services/payment-service'

// POST /api/clerk/process-payment - Process a payment for a reservation
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.role !== 'clerk') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reservationId, amount, paymentMethod, reference } = body

    if (!reservationId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Reservation ID, amount, and payment method are required' }, { status: 400 })
    }

    // Validate reservation exists
    const reservation = await sql`
      SELECT * FROM reservations WHERE id = ${reservationId}
    `

    if (!reservation || (reservation as any[]).length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Process payment using PaymentService
    const paymentResult = await PaymentService.processPayment({
      reservation_id: reservationId,
      amount: amount,
      payment_method: paymentMethod,
      transaction_id: reference,
      notes: `Payment processed by clerk ${user.name}`
    }, user.id)

    if (!paymentResult.success) {
      return NextResponse.json({ error: paymentResult.error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment processed successfully',
      payment: paymentResult.data
    })
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
} 