import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-simple";
import { ReservationService } from "@/lib/services/reservation-service";
import { 
  CreateReservationRequest, 
  UpdateReservationRequest,
  ReservationStatus,
  CheckinStatus,
  UserRole 
} from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const roomTypeId = searchParams.get("roomTypeId") || undefined;

    // Get reservations based on user role
    let reservations;
    if (user.role === UserRole.CUSTOMER) {
      reservations = await ReservationService.getUserReservations(user.id);
    } else if (user.role === UserRole.CLERK) {
      if (statusParam === ReservationStatus.PENDING) {
        reservations = await ReservationService.getPendingReservations();
      } else if (statusParam === "checked_in") {
        reservations = await ReservationService.getCurrentGuests();
      } else {
        reservations = await ReservationService.getReservationsWithDetails({
          status: statusParam as ReservationStatus,
          dateFrom,
          dateTo,
          roomTypeId
        });
      }
    } else {
      // Manager and travel users can see all reservations
      reservations = await ReservationService.getReservationsWithDetails({
        status: statusParam === "checked_in" ? undefined : statusParam as ReservationStatus,
        dateFrom,
        dateTo,
        roomTypeId
      });
    }

    if (!reservations.success) {
      return NextResponse.json(
        { error: reservations.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ reservations: reservations.data });
  } catch (error) {
    console.error("Error getting reservations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only customers and travel users can create reservations
    if (![UserRole.CUSTOMER, UserRole.TRAVEL].includes(user.role as UserRole)) {
      return NextResponse.json(
        { error: "Only customers and travel users can create reservations" },
        { status: 403 }
      );
    }

    const body: CreateReservationRequest = await request.json();

    // Validate required fields
    if (!body.room_type_id || !body.check_in_date || !body.check_out_date || !body.num_guests) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For travel users, validate minimum room requirement
    if (user.role === UserRole.TRAVEL) {
      const { searchParams } = new URL(request.url);
      const numRooms = parseInt(searchParams.get("numRooms") || "1");
      
      if (numRooms < 3) {
        return NextResponse.json(
          { error: "Travel companies must reserve at least 3 rooms" },
          { status: 400 }
        );
      }

      // Create multiple reservations for travel companies
      const reservations = [];
      for (let i = 0; i < numRooms; i++) {
        const reservation = await ReservationService.createReservation(user.id, body);
        if (reservation.success) {
          reservations.push(reservation.data);
        }
      }

      return NextResponse.json({ 
        message: `Created ${reservations.length} reservations`,
        reservations 
      });
    } else {
      // Single reservation for customers
      const reservation = await ReservationService.createReservation(user.id, body);
      
      if (!reservation.success) {
        return NextResponse.json(
          { error: reservation.error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        message: "Reservation created successfully",
        reservation: reservation.data 
      });
    }
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get("id");
    
    if (!reservationId) {
      return NextResponse.json(
        { error: "Reservation ID is required" },
        { status: 400 }
      );
    }

    const body: UpdateReservationRequest = await request.json();

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

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get("id");
    
    if (!reservationId) {
      return NextResponse.json(
        { error: "Reservation ID is required" },
        { status: 400 }
      );
    }

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