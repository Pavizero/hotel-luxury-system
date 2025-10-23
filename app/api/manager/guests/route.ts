import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'

// GET /api/manager/guests - Get all guests
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guests = await sql`
      SELECT 
        r.id,
        u.name,
        rm.room_number as room,
        rt.type_name as roomType,
        r.check_in_date as checkIn,
        r.check_out_date as checkOut,
        r.status,
        r.num_guests as guests,
        u.phone,
        u.email,
        COALESCE(r.final_price - COALESCE(p.total_paid, 0), 0) as balance
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN room_assignments ra ON r.id = ra.reservation_id
      LEFT JOIN rooms rm ON ra.room_id = rm.id
      LEFT JOIN room_types rt ON rm.room_type_id = rt.id
      LEFT JOIN (
        SELECT reservation_id, SUM(amount) as total_paid
        FROM payments
        WHERE status = 'completed'
        GROUP BY reservation_id
      ) p ON r.id = p.reservation_id
      ORDER BY r.check_in_date DESC
    `

    return NextResponse.json({ guests })
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
  }
} 