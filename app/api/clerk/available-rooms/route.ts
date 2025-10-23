import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'

// GET /api/clerk/available-rooms - Get available rooms for clerk
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.role !== 'clerk') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rooms = await sql`
      SELECT 
        r.id,
        r.room_number as number,
        rt.type_name as type,
        rt.base_price as price,
        rt.capacity
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.status = 'available'
      AND r.id NOT IN (
        SELECT ra.room_id
        FROM room_assignments ra
        JOIN reservations res ON ra.reservation_id = res.id
        WHERE res.checkin_status = 'checked_in'
      )
      ORDER BY r.room_number
    `

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('Error fetching available rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch available rooms' }, { status: 500 })
  }
}