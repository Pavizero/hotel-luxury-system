import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'

// POST /api/clerk/check-out - Check out a guest
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.role !== 'clerk') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reservationId } = body

    if (!reservationId) {
      return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 })
    }

    // Get reservation details with room assignment
    const reservation = await sql<{
      id: string;
      checkin_status: string;
      room_id: string;
      room_number: string;
    }>`
      SELECT r.id, r.checkin_status, ra.room_id, rm.room_number
      FROM reservations r
      LEFT JOIN room_assignments ra ON r.id = ra.reservation_id
      LEFT JOIN rooms rm ON ra.room_id = rm.id
      WHERE r.id = ${reservationId}
    `

    if (!reservation || reservation.length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const reservationData = reservation[0]

    // Check if reservation is checked in
    if (reservationData.checkin_status !== 'checked_in') {
      return NextResponse.json({ error: 'Reservation must be checked in to check out' }, { status: 400 })
    }

    // Update reservation checkin_status to checked out
    await sql`
      UPDATE reservations 
      SET checkin_status = 'checked_out', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${reservationId}
    `

    // Update room status to available if room exists
    if (reservationData.room_id) {
      await sql`
        UPDATE rooms 
        SET status = 'available', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${reservationData.room_id}
      `
      // Remove the room assignment so the room is no longer linked to this reservation
      await sql`
        DELETE FROM room_assignments WHERE reservation_id = ${reservationId}
      `
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Guest checked out successfully',
      data: {
        reservation: { id: reservationId, checkin_status: 'checked_out' },
        room: reservationData.room_id ? { id: reservationData.room_id, status: 'available' } : null
      }
    })
  } catch (error) {
    console.error('Error checking out guest:', error)
    return NextResponse.json({ error: 'Failed to check out guest' }, { status: 500 })
  }
} 