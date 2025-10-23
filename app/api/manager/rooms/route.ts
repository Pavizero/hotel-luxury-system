import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'
import crypto from 'crypto'

// GET /api/manager/rooms - Get all rooms
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rooms = await sql`
      SELECT 
        r.id,
        r.room_number as number,
        rt.type_name as type,
        r.room_type_id as roomTypeId,
        r.status,
        rt.base_price as price,
        rt.capacity as maxGuests,
        rt.amenities as features,
        ra.reservation_id as currentGuest,
        res.check_out_date as checkOut
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN room_assignments ra ON r.id = ra.room_id
      LEFT JOIN reservations res ON ra.reservation_id = res.id AND res.checkin_status = 'checked_in'
      ORDER BY r.room_number
    `

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

// POST /api/manager/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { number, roomTypeId, features } = body

    if (!number || !roomTypeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get room type details
    const roomTypes = await sql`
      SELECT id, type_name, base_price, capacity, amenities
      FROM room_types 
      WHERE id = ${roomTypeId}
    `

    if (roomTypes.length === 0) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 400 })
    }

    const roomId = crypto.randomUUID()
    const result = await sql`
      INSERT INTO rooms (id, room_number, room_type_id, status)
      VALUES (${roomId}, ${number}, ${roomTypeId}, 'available')
    `

    return NextResponse.json({ success: true, message: 'Room created successfully' })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
} 