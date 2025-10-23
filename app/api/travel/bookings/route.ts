import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'

// GET /api/travel/bookings - Get travel company bookings
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.role !== 'travel') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookings = await sql`
      SELECT 
        r.id,
        u.name as companyName,
        u.name as contactPerson,
        u.email,
        u.phone,
        r.created_at as bookingDate,
        r.check_in_date as checkIn,
        r.check_out_date as checkOut,
        1 as rooms,
        r.num_guests as guests,
        rt.type_name as roomTypes,
        r.final_price as totalAmount,
        COALESCE(p.amount, 0) as paidAmount,
        r.status,
        CASE 
          WHEN COALESCE(p.amount, 0) >= r.final_price THEN 'paid'
          WHEN COALESCE(p.amount, 0) > 0 THEN 'partial'
          ELSE 'pending'
        END as paymentStatus
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN payments p ON r.id = p.reservation_id
      WHERE r.user_id = ${user.id}
      ORDER BY r.created_at DESC
    `

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching travel bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
} 