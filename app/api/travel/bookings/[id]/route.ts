import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'

// PUT /api/travel/bookings/[id] - Update a booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user || user.role !== 'travel') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { checkIn, checkOut, guests, totalAmount } = body

    // Check if reservation exists and can be modified
    const reservation = await sql<{id: string; checkin_status: string; status: string}>`
      SELECT id, checkin_status, status FROM reservations 
      WHERE id = ${id} AND user_id = ${user.id}
    `

    if (!reservation || reservation.length === 0) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
    }

    // Prevent modification if already checked in
    if (reservation[0].checkin_status === 'checked_in') {
      return NextResponse.json({ error: 'Cannot modify booking after check-in' }, { status: 400 })
    }

    // Update the reservation with correct column names
    await sql`
      UPDATE reservations 
      SET 
        check_in_date = ${checkIn},
        check_out_date = ${checkOut},
        num_guests = ${guests},
        total_price = ${totalAmount},
        final_price = ${totalAmount}
      WHERE id = ${id} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true, message: 'Booking updated successfully' })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

// DELETE /api/travel/bookings/[id] - Cancel a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user || user.role !== 'travel') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await sql`
      UPDATE reservations 
      SET status = 'cancelled'
      WHERE id = ${id} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true, message: 'Booking cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }
} 