import { sql } from "@/lib/db";
import { 
  Reservation, 
  ReservationWithDetails, 
  Room, 
  RoomWithType,
  ReservationStatus,
  RoomStatus,
  ApiResponse,
  UUID
} from "@/types";
import { ReservationService } from "./reservation-service";
import { PaymentService } from "./payment-service";

export class ClerkService {
  /**
   * Check in a guest with room assignment
   */
  static async checkInGuest(
    reservationId: UUID,
    roomId: UUID,
    assignedBy: UUID
  ): Promise<ApiResponse<{
    reservation: Reservation;
    roomAssignment: any;
  }>> {
    try {
      // Validate reservation exists and is in correct status
      const reservation = await sql<Reservation>`
        SELECT * FROM reservations WHERE id = ${reservationId}
      `;

      if (reservation.length === 0) {
        return {
          success: false,
          error: {
            message: "Reservation not found",
            code: "RESERVATION_NOT_FOUND"
          }
        };
      }

      if (reservation[0].checkin_status !== 'not_checked_in') {
        return {
          success: false,
          error: {
            message: "Guest is already checked in",
            code: "ALREADY_CHECKED_IN"
          }
        };
      }

      // Ensure reservation is confirmed before allowing check-in
      if (reservation[0].status !== 'confirmed') {
        return {
          success: false,
          error: {
            message: "Reservation must be confirmed before check-in",
            code: "RESERVATION_NOT_CONFIRMED"
          }
        };
      }

      // Validate room is available and matches reservation type
      const room = await sql<RoomWithType>`
        SELECT r.*, rt.type_name, rt.description, rt.base_price, rt.capacity, rt.amenities
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE r.id = ${roomId}
      `;

      if (room.length === 0) {
        return {
          success: false,
          error: {
            message: "Room not found",
            code: "ROOM_NOT_FOUND"
          }
        };
      }

      if (room[0].status !== 'available') {
        return {
          success: false,
          error: {
            message: "Room is not available",
            code: "ROOM_NOT_AVAILABLE"
          }
        };
      }

      // Check if room type matches reservation
      if (room[0].room_type_id !== reservation[0].room_type_id) {
        return {
          success: false,
          error: {
            message: "Room type does not match reservation",
            code: "ROOM_TYPE_MISMATCH"
          }
        };
      }

      // Check if room is already assigned to another reservation
      const existingAssignment = await sql`
        SELECT * FROM room_assignments WHERE room_id = ${roomId}
      `;

      if (existingAssignment.length > 0) {
        return {
          success: false,
          error: {
            message: "Room is already assigned to another reservation",
            code: "ROOM_ALREADY_ASSIGNED"
          }
        };
      }

      // Create room assignment
      const assignmentId = crypto.randomUUID();
      await sql`
        INSERT INTO room_assignments (
          id, reservation_id, room_id, assigned_by
        ) VALUES (
          ${assignmentId}, ${reservationId}, ${roomId}, ${assignedBy}
        )
      `;

      // Update room status to occupied
      await sql`
        UPDATE rooms 
        SET status = 'occupied', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${roomId}
      `;

      // Update reservation checkin_status to checked in
      await sql`
        UPDATE reservations 
        SET checkin_status = 'checked_in', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${reservationId}
      `;

      // Get updated data
      const updatedReservation = await sql<Reservation>`
        SELECT * FROM reservations WHERE id = ${reservationId}
      `;

      const roomAssignment = await sql`
        SELECT * FROM room_assignments WHERE id = ${assignmentId}
      `;

      return {
        success: true,
        data: {
          reservation: updatedReservation[0],
          roomAssignment: roomAssignment[0]
        }
      };
    } catch (error) {
      console.error("Error checking in guest:", error);
      return {
        success: false,
        error: {
          message: "Failed to check in guest",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Check out a guest
   */
  static async checkOutGuest(
    reservationId: UUID,
    paymentMethod: string,
    amount: number,
    serviceCharges: Array<{
      service_type: string;
      description: string;
      amount: number;
    }>,
    processedBy: UUID
  ): Promise<ApiResponse<{
    reservation: Reservation;
    payment: any;
    serviceCharges: any[];
  }>> {
    try {
      // Validate reservation is checked in
      const reservation = await sql<Reservation>`
        SELECT * FROM reservations WHERE id = ${reservationId}
      `;

      if (reservation.length === 0) {
        return {
          success: false,
          error: {
            message: "Reservation not found",
            code: "RESERVATION_NOT_FOUND"
          }
        };
      }

      if (reservation[0].checkin_status !== 'checked_in') {
        return {
          success: false,
          error: {
            message: "Reservation must be checked in to check out",
            code: "INVALID_STATUS_FOR_CHECKOUT"
          }
        };
      }

      // Process checkout payment
      const paymentResult = await PaymentService.processCheckoutPayment(
        reservationId,
        paymentMethod as any,
        amount,
        serviceCharges,
        processedBy
      );

      if (!paymentResult.success) {
        return paymentResult;
      }

      // Get room assignment and update room status
      const roomAssignment = await sql<{room_id: string}>`
        SELECT room_id FROM room_assignments WHERE reservation_id = ${reservationId}
      `;

      if (roomAssignment.length > 0) {
        await sql`
          UPDATE rooms 
          SET status = 'available', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ${roomAssignment[0].room_id}
        `;
      }

      // Update reservation checkin_status to checked out
      await sql`
        UPDATE reservations 
        SET checkin_status = 'checked_out', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${reservationId}
      `;

      // Get updated reservation
      const updatedReservation = await sql<Reservation>`
        SELECT * FROM reservations WHERE id = ${reservationId}
      `;

      return {
        success: true,
        data: {
          reservation: updatedReservation[0],
          payment: paymentResult.data.payment,
          serviceCharges: paymentResult.data.serviceCharges
        }
      };
    } catch (error) {
      console.error("Error checking out guest:", error);
      return {
        success: false,
        error: {
          message: "Failed to check out guest",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Create a walk-in reservation
   */
  static async createWalkInReservation(
    guestInfo: {
      name: string;
      email: string;
      phone: string;
      address?: string;
    },
    reservationData: {
      room_type_id: UUID;
      check_in_date: string;
      check_out_date: string;
      num_guests: number;
      special_requests?: string;
      has_credit_card: boolean;
      credit_card_last4?: string;
    },
    assignedBy: UUID
  ): Promise<ApiResponse<{
    user: any;
    reservation: Reservation;
    roomAssignment?: any;
  }>> {
    try {
      // Create user account for walk-in guest
      const userId = crypto.randomUUID();
      await sql`
        INSERT INTO users (
          id, name, email, password_hash, role, phone, address
        ) VALUES (
          ${userId}, ${guestInfo.name}, ${guestInfo.email}, 
          'walk-in-no-password', 'customer', ${guestInfo.phone}, 
          ${guestInfo.address || null}
        )
      `;

      // Create reservation
      const reservationResult = await ReservationService.createReservation(
        userId,
        {
          ...reservationData,
          is_walk_in: true
        }
      );

      if (!reservationResult.success) {
        return reservationResult;
      }

      // Find available room and assign it
      const availableRooms = await sql<Room>`
        SELECT * FROM rooms 
        WHERE room_type_id = ${reservationData.room_type_id}
        AND status = 'available'
        LIMIT 1
      `;

      if (availableRooms.length > 0) {
        const checkInResult = await this.checkInGuest(
          reservationResult.data.id,
          availableRooms[0].id,
          assignedBy
        );

        if (checkInResult.success) {
          return {
            success: true,
            data: {
              user: { id: userId, ...guestInfo },
              reservation: reservationResult.data,
              roomAssignment: checkInResult.data.roomAssignment
            }
          };
        }
      }

      return {
        success: true,
        data: {
          user: { id: userId, ...guestInfo },
          reservation: reservationResult.data
        }
      };
    } catch (error) {
      console.error("Error creating walk-in reservation:", error);
      return {
        success: false,
        error: {
          message: "Failed to create walk-in reservation",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Get available rooms for a specific room type
   */
  static async getAvailableRooms(roomTypeId?: UUID): Promise<ApiResponse<RoomWithType[]>> {
    try {
      let query = `
        SELECT r.*, rt.type_name, rt.description, rt.base_price, rt.capacity, rt.amenities
        FROM rooms r
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE r.status = 'available'
      `;

      const values: any[] = [];

      if (roomTypeId) {
        query += ` AND r.room_type_id = ?`;
        values.push(roomTypeId);
      }

      query += ` ORDER BY r.room_number`;

      const rooms = await sql.raw(query, values) as RoomWithType[];

      return {
        success: true,
        data: rooms
      };
    } catch (error) {
      console.error("Error getting available rooms:", error);
      return {
        success: false,
        error: {
          message: "Failed to get available rooms",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Get current guests with room assignments
   */
  static async getCurrentGuests(): Promise<ApiResponse<ReservationWithDetails[]>> {
    try {
      const guests = await sql<ReservationWithDetails>`
        SELECT 
          r.*,
          u.name as user_name,
          u.email as user_email,
          rt.type_name as room_type_name,
          ra.room_number,
          COALESCE(SUM(p.amount), 0) as total_paid,
          COALESCE(SUM(sc.amount), 0) as service_charges_total
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN room_types rt ON r.room_type_id = rt.id
        LEFT JOIN room_assignments ra_assignment ON r.id = ra_assignment.reservation_id
        LEFT JOIN rooms ra ON ra_assignment.room_id = ra.id
        LEFT JOIN payments p ON r.id = p.reservation_id AND p.status = 'completed'
        LEFT JOIN service_charges sc ON r.id = sc.reservation_id
        WHERE r.checkin_status = 'checked_in'
        GROUP BY r.id, u.name, u.email, rt.type_name, ra.room_number
        ORDER BY r.check_in_date ASC
      `;

      // Calculate outstanding balance
      const guestsWithBalance = guests.map(guest => ({
        ...guest,
        outstanding_balance: guest.final_price - guest.total_paid + guest.service_charges_total
      }));

      return {
        success: true,
        data: guestsWithBalance
      };
    } catch (error) {
      console.error("Error getting current guests:", error);
      return {
        success: false,
        error: {
          message: "Failed to get current guests",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Get pending reservations
   */
  static async getPendingReservations(): Promise<ApiResponse<ReservationWithDetails[]>> {
    try {
      const reservations = await sql<ReservationWithDetails>`
        SELECT 
          r.*,
          u.name as user_name,
          u.email as user_email,
          rt.type_name as room_type_name,
          ra.room_number,
          COALESCE(SUM(p.amount), 0) as total_paid,
          COALESCE(SUM(sc.amount), 0) as service_charges_total
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        JOIN room_types rt ON r.room_type_id = rt.id
        LEFT JOIN room_assignments ra_assignment ON r.id = ra_assignment.reservation_id
        LEFT JOIN rooms ra ON ra_assignment.room_id = ra.id
        LEFT JOIN payments p ON r.id = p.reservation_id AND p.status = 'completed'
        LEFT JOIN service_charges sc ON r.id = sc.reservation_id
        WHERE r.status = 'pending'
        GROUP BY r.id, u.name, u.email, rt.type_name, ra.room_number
        ORDER BY r.created_at ASC
      `;

      // Calculate outstanding balance
      const reservationsWithBalance = reservations.map(reservation => ({
        ...reservation,
        outstanding_balance: reservation.final_price - reservation.total_paid + reservation.service_charges_total
      }));

      return {
        success: true,
        data: reservationsWithBalance
      };
    } catch (error) {
      console.error("Error getting pending reservations:", error);
      return {
        success: false,
        error: {
          message: "Failed to get pending reservations",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Add service charges to a guest
   */
  static async addServiceCharge(
    reservationId: UUID,
    serviceType: string,
    description: string,
    amount: number,
    chargedBy: UUID
  ): Promise<ApiResponse<any>> {
    try {
      // Validate reservation exists and is checked in
      const reservation = await sql<Reservation>`
        SELECT * FROM reservations WHERE id = ${reservationId}
      `;

      if (reservation.length === 0) {
        return {
          success: false,
          error: {
            message: "Reservation not found",
            code: "RESERVATION_NOT_FOUND"
          }
        };
      }

      if (reservation[0].checkin_status !== 'checked_in') {
        return {
          success: false,
          error: {
            message: "Can only add charges to checked-in guests",
            code: "INVALID_STATUS_FOR_CHARGES"
          }
        };
      }

      // Create service charge
      const chargeId = crypto.randomUUID();
      await sql`
        INSERT INTO service_charges (
          id, reservation_id, service_type, description, 
          amount, charged_by
        ) VALUES (
          ${chargeId}, ${reservationId}, ${serviceType}, 
          ${description}, ${amount}, ${chargedBy}
        )
      `;

      const serviceCharge = await sql`
        SELECT * FROM service_charges WHERE id = ${chargeId}
      `;

      return {
        success: true,
        data: serviceCharge[0]
      };
    } catch (error) {
      console.error("Error adding service charge:", error);
      return {
        success: false,
        error: {
          message: "Failed to add service charge",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Mark room as cleaned and available
   */
  static async markRoomAsCleaned(roomId: UUID): Promise<ApiResponse<Room>> {
    try {
      const room = await sql<Room>`
        SELECT * FROM rooms WHERE id = ${roomId}
      `;

      if (room.length === 0) {
        return {
          success: false,
          error: {
            message: "Room not found",
            code: "ROOM_NOT_FOUND"
          }
        };
      }

      if (room[0].status !== 'cleaning') {
        return {
          success: false,
          error: {
            message: "Room is not in cleaning status",
            code: "INVALID_ROOM_STATUS"
          }
        };
      }

      await sql`
        UPDATE rooms 
        SET status = 'available', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${roomId}
      `;

      const updatedRoom = await sql<Room>`
        SELECT * FROM rooms WHERE id = ${roomId}
      `;

      return {
        success: true,
        data: updatedRoom[0]
      };
    } catch (error) {
      console.error("Error marking room as cleaned:", error);
      return {
        success: false,
        error: {
          message: "Failed to mark room as cleaned",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }
} 