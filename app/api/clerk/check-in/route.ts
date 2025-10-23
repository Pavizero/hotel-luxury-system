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

    // Only clerks can perform check-ins
    if (user.role !== UserRole.CLERK) {
      return NextResponse.json(
        { error: "Only clerks can perform check-ins" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reservationId, roomId } = body;

    if (!reservationId || !roomId) {
      return NextResponse.json(
        { error: "Reservation ID and Room ID are required" },
        { status: 400 }
      );
    }

    const result = await ClerkService.checkInGuest(reservationId, roomId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Guest checked in successfully",
      data: result.data
    });
  } catch (error) {
    console.error("Error checking in guest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 