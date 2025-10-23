import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'

// POST /api/clerk/add-charges - Add charges to a guest
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user || user.role !== 'clerk') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reservationId, amount, description, notes } = body

    if (!reservationId || !amount || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify reservation exists
    const reservation = await sql`
      SELECT id FROM reservations WHERE id = ${reservationId}
    `

    if (!reservation || (reservation as any[]).length === 0) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Add service charge record
    const chargeId = crypto.randomUUID();
    await sql`
      INSERT INTO service_charges (
        id, reservation_id, service_type, description, amount, charged_by
      ) VALUES (
        ${chargeId}, ${reservationId}, 'other', ${description}, ${amount}, ${user.id}
      )
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Charge added successfully' 
    })
  } catch (error) {
    console.error('Error adding charge:', error)
    return NextResponse.json({ error: 'Failed to add charge' }, { status: 500 })
  }
} 