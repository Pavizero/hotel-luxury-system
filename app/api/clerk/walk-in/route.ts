import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-simple";
import { ClerkService } from "@/lib/services/clerk-service";
import { UserRole } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only clerks can create walk-in reservations
    if (user.role !== UserRole.CLERK) {
      return NextResponse.json(
        { error: "Only clerks can create walk-in reservations" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      roomId, 
      checkIn, 
      checkOut, 
      guests 
    } = body;

    if (!name || !roomId || !checkIn || !checkOut || !guests) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get room type from room ID
    const { sql } = await import("@/lib/db");
    const rooms = await sql<{
      room_type_id: string;
      base_price: number;
    }>`
      SELECT rt.id as room_type_id, rt.base_price
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = ${roomId}
    `;

    if (rooms.length === 0) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 400 }
      );
    }

    const roomType = rooms[0];

    // Calculate total price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const daysDiff = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = roomType.base_price * daysDiff;

    const result = await ClerkService.createWalkInReservation(
      {
        name,
        email: email || `walk-in-${Date.now()}@hotel.com`,
        phone: phone || "N/A",
      },
      {
        room_type_id: roomType.room_type_id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        num_guests: parseInt(guests),
        has_credit_card: false,
      },
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Walk-in guest created successfully",
      data: result.data
    });
  } catch (error) {
    console.error("Error creating walk-in reservation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 