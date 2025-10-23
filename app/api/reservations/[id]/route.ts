import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-simple";
import { ReservationService } from "@/lib/services/reservation-service";
import { UserRole } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: reservationId } = await params;

    // Get the specific reservation
    const reservation = await ReservationService.getReservationById(reservationId);

    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error.message },
        { status: 400 }
      );
    }

    // Check if user can access this reservation
    if (user.role === UserRole.CUSTOMER && reservation.data.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only view your own reservations" },
        { status: 403 }
      );
    }

    return NextResponse.json(reservation.data);
  } catch (error) {
    console.error("Error getting reservation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: reservationId } = await params;
    const body = await request.json();

    // Check if user can update this reservation
    if (user.role === UserRole.CUSTOMER) {
      // Customers can only update their own reservations
      const userReservations = await ReservationService.getUserReservations(user.id);
      if (!userReservations.success || !userReservations.data.find(r => r.id === reservationId)) {
        return NextResponse.json(
          { error: "You can only update your own reservations" },
          { status: 403 }
        );
      }
    }

    const reservation = await ReservationService.updateReservation(reservationId, body);
    
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      message: "Reservation updated successfully",
      reservation: reservation.data 
    });
  } catch (error) {
    console.error("Error updating reservation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: reservationId } = await params;

    // Check if user can cancel this reservation
    if (user.role === UserRole.CUSTOMER) {
      // Customers can only cancel their own reservations
      const userReservations = await ReservationService.getUserReservations(user.id);
      if (!userReservations.success || !userReservations.data.find(r => r.id === reservationId)) {
        return NextResponse.json(
          { error: "You can only cancel your own reservations" },
          { status: 403 }
        );
      }
    }

    const reservation = await ReservationService.cancelReservation(reservationId);
    
    if (!reservation.success) {
      return NextResponse.json(
        { error: reservation.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      message: "Reservation cancelled successfully",
      reservation: reservation.data 
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 