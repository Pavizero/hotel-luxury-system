import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'
import crypto from 'crypto'

// POST /api/travel/bulk-bookings - Create bulk bookings
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.role !== 'travel') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { checkIn, checkOut, rooms, guests, roomTypes, totalAmount } = body

    if (!checkIn || !checkOut || !rooms || !guests || !roomTypes || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check room availability without assigning them
    const availableRooms = await sql<{count: number}>`
      SELECT COUNT(*) as count
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.status = 'available' 
      AND rt.type_name = ${roomTypes}
    `

    if (availableRooms[0].count < rooms) {
      return NextResponse.json({ 
        error: `Only ${availableRooms[0].count} rooms available, requested ${rooms}` 
      }, { status: 400 })
    }

    // Get room type ID for the specified type
    const roomTypeData = await sql<{id: string}>`
      SELECT id FROM room_types WHERE type_name = ${roomTypes}
    `

    if (roomTypeData.length === 0) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 400 })
    }

    const roomTypeId = roomTypeData[0].id

    // Create reservations for each room (without room assignment)
    const reservations = []
    for (let i = 0; i < rooms; i++) {
      const roomGuests = Math.ceil(guests / rooms) // Distribute guests across rooms
      
      // Auto-confirmation logic: 2+ rooms = confirmed, < 2 rooms = pending
      const autoConfirm = rooms >= 2;
      const reservationStatus = autoConfirm ? 'confirmed' : 'pending';

      const reservationId = crypto.randomUUID()
      const reservation = await sql`
        INSERT INTO reservations (
          id, user_id, room_type_id, check_in_date, check_out_date, 
          num_guests, total_price, final_price, status, checkin_status, is_travel_company
        ) VALUES (
          ${reservationId}, ${user.id}, ${roomTypeId}, ${checkIn}, ${checkOut}, 
          ${roomGuests}, ${totalAmount / rooms}, ${totalAmount / rooms}, ${reservationStatus}, 'not_checked_in', true
        )
      `

      reservations.push({ reservationId, guests: roomGuests })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created ${reservations.length} reservations. Rooms will be assigned during check-in.`,
      reservations 
    })
  } catch (error) {
    console.error('Error creating bulk bookings:', error)
    return NextResponse.json({ error: 'Failed to create bulk bookings' }, { status: 500 })
  }
} 