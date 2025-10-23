import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'

// GET /api/clerk/guests - Get all guests for clerk
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.role !== 'clerk') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const guests = await sql`
      SELECT 
        r.id,
        u.name,
        ra.room_number as room,
        ra.id as room_id,
        rt.type_name as roomType,
        r.check_in_date as checkIn,
        r.check_out_date as checkOut,
        r.status,
        r.checkin_status,
        r.num_guests as guests,
        u.phone,
        u.email,
        COALESCE(r.final_price - COALESCE(p.total_paid, 0), 0) as balance,
        r.is_travel_company,
        CASE 
          WHEN r.is_travel_company = 1 THEN CONCAT(u.name, ' (Travel)')
          ELSE u.name
        END as display_name
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN room_assignments ra_assignment ON r.id = ra_assignment.reservation_id
      LEFT JOIN rooms ra ON ra_assignment.room_id = ra.id
      LEFT JOIN (
        SELECT reservation_id, SUM(amount) as total_paid
        FROM payments
        WHERE status = 'completed'
        GROUP BY reservation_id
      ) p ON r.id = p.reservation_id
      WHERE r.checkin_status IN ('not_checked_in', 'checked_in', 'checked_out')
      ORDER BY r.check_in_date DESC
    `

    return NextResponse.json({ guests })
  } catch (error) {
    console.error('Error fetching guests:', error)
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
  }
} 