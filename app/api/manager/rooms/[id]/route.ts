import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getUser } from '@/lib/auth-simple'

// PUT /api/manager/rooms/[id] - Update a room
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { number, roomTypeId } = body

    if (!number || !roomTypeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify room type exists
    const roomTypes = await sql`
      SELECT id FROM room_types WHERE id = ${roomTypeId}
    `

    if (roomTypes.length === 0) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 400 })
    }

    await sql`
      UPDATE rooms 
      SET 
        room_number = ${number},
        room_type_id = ${roomTypeId}
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true, message: 'Room updated successfully' })
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

// DELETE /api/manager/rooms/[id] - Delete a room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request)
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if room is occupied
    const room = await sql`
      SELECT status FROM rooms WHERE id = ${id}
    `

    if (room && (room as any[])[0]?.status === 'occupied') {
      return NextResponse.json({ 
        error: 'Cannot delete room that is currently occupied' 
      }, { status: 400 })
    }

    await sql`
      DELETE FROM rooms WHERE id = ${id}
    `

    return NextResponse.json({ success: true, message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
} 