import { sql } from "@/lib/db";
import { 
  Reservation, 
  ReservationWithDetails, 
  CreateReservationRequest, 
  UpdateReservationRequest,
  ReservationStatus,
  UserRole,
  ApiResponse,
  ApiError,
  UUID
} from "@/types";
import { addDays, isAfter, isBefore, parseISO } from "date-fns";

export class ReservationService {
  /**
   * Create a new reservation with validation and pricing calculation
   */
  static async createReservation(
    userId: UUID,
    request: CreateReservationRequest
  ): Promise<ApiResponse<Reservation>> {
    try {
      // Validate dates
      const checkInDate = parseISO(request.check_in_date);
      const checkOutDate = parseISO(request.check_out_date);
      const today = new Date();

      if (isBefore(checkInDate, today)) {
        return {
          success: false,
          error: {
            message: "Check-in date cannot be in the past",
            code: "INVALID_CHECKIN_DATE"
          }
        };
      }

      if (isBefore(checkOutDate, checkInDate)) {
        return {
          success: false,
          error: {
            message: "Check-out date must be after check-in date",
            code: "INVALID_CHECKOUT_DATE"
          }
        };
      }

      // Get room type details
      const roomTypes = await sql<{
        id: string;
        base_price: number;
        is_residential: boolean;
        weekly_rate: number | null;
        monthly_rate: number | null;
      }>`SELECT id, base_price, is_residential, weekly_rate, monthly_rate 
         FROM room_types WHERE id = ${request.room_type_id}`;

      if (roomTypes.length === 0) {
        return {
          success: false,
          error: {
            message: "Room type not found",
            code: "ROOM_TYPE_NOT_FOUND"
          }
        };
      }

      const roomType = roomTypes[0];

      // Calculate pricing
      let totalPrice = 0;
      let discountAmount = 0;

      if (request.is_residential && roomType.is_residential) {
        // Residential pricing
        if (request.residential_duration === 'weekly') {
          totalPrice = roomType.weekly_rate || roomType.base_price * 7;
        } else if (request.residential_duration === 'monthly') {
          totalPrice = roomType.monthly_rate || roomType.base_price * 30;
        }
      } else {
        // Regular daily pricing
        const daysDiff = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        totalPrice = roomType.base_price * daysDiff;
      }

      // Apply loyalty discount
      const userWithLoyalty = await sql<{
        loyalty_points: number;
        loyalty_program_id: string | null;
      }>`SELECT loyalty_points, loyalty_program_id FROM users WHERE id = ${userId}`;

      if (userWithLoyalty.length > 0 && userWithLoyalty[0].loyalty_program_id) {
        const loyaltyProgram = await sql<{
          discount_percentage: number;
        }>`SELECT discount_percentage FROM loyalty_programs WHERE id = ${userWithLoyalty[0].loyalty_program_id}`;

        if (loyaltyProgram.length > 0) {
          discountAmount = (totalPrice * loyaltyProgram[0].discount_percentage) / 100;
        }
      }

      const finalPrice = totalPrice - discountAmount;

      // Check room availability
      const availableRooms = await sql<{ count: number }>`
        SELECT COUNT(*) as count
        FROM rooms r
        WHERE r.room_type_id = ${request.room_type_id}
        AND r.status = 'available'
        AND r.id NOT IN (
          SELECT ra.room_id
          FROM room_assignments ra
          JOIN reservations res ON ra.reservation_id = res.id
          WHERE res.room_type_id = ${request.room_type_id}
          AND res.status IN ('confirmed', 'checked-in')
          AND (
            (res.check_in_date <= ${request.check_in_date} AND res.check_out_date > ${request.check_in_date})
            OR (res.check_in_date < ${request.check_out_date} AND res.check_out_date >= ${request.check_out_date})
            OR (res.check_in_date >= ${request.check_in_date} AND res.check_out_date <= ${request.check_out_date})
          )
        )
      `;

      if (availableRooms[0].count === 0) {
        return {
          success: false,
          error: {
            message: "No rooms available for the selected dates",
            code: "NO_ROOMS_AVAILABLE"
          }
        };
      }

      // Create reservation
      const reservationId = crypto.randomUUID();
      const initialStatus = request.has_credit_card ? 'confirmed' : 'pending';
      await sql`
        INSERT INTO reservations (
          id, user_id, room_type_id, check_in_date, check_out_date, 
          num_guests, status, checkin_status, total_price, discount_amount, final_price,
          special_requests, has_credit_card, credit_card_last4,
          is_residential, residential_duration, is_walk_in
        ) VALUES (
          ${reservationId}, ${userId}, ${request.room_type_id}, 
          ${request.check_in_date}, ${request.check_out_date}, 
          ${request.num_guests}, ${initialStatus}, 'not_checked_in', ${totalPrice}, ${discountAmount}, 
          ${finalPrice}, ${request.special_requests || null}, 
          ${request.has_credit_card}, ${request.credit_card_last4 || null},
          ${request.is_residential || false}, ${request.residential_duration || null},
          ${request.is_walk_in || false}
        )
      `;

      // Get created reservation
      const reservations = await sql<Reservation>`
        SELECT * FROM reservations WHERE id = ${reservationId}
      `;

      return {
        success: true,
        data: reservations[0]
      };
    } catch (error) {
      console.error("Error creating reservation:", error);
      return {
        success: false,
        error: {
          message: "Failed to create reservation",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Update an existing reservation
   */
  static async updateReservation(
    reservationId: UUID,
    request: UpdateReservationRequest
  ): Promise<ApiResponse<Reservation>> {
    try {
      // Check if reservation exists and can be updated
      const existingReservation = await sql<Reservation>`
        SELECT * FROM reservations WHERE id = ${reservationId}
      `;

      if (existingReservation.length === 0) {
        return {
          success: false,
          error: {
            message: "Reservation not found",
            code: "RESERVATION_NOT_FOUND"
          }
        };
      }

      const reservation = existingReservation[0];

      // Only allow updates for pending or confirmed reservations
      if (!['pending', 'confirmed'].includes(reservation.status)) {
        return {
          success: false,
          error: {
            message: "Cannot update reservation in current status",
            code: "INVALID_STATUS_FOR_UPDATE"
          }
        };
      }

      // Enforce separation: Do not allow checkin_status and status to be set together in the same update
      if (
        request.status &&
        request.checkin_status &&
        request.checkin_status !== reservation.checkin_status // only if actually trying to change it
      ) {
        console.warn(
          `Attempted to set both status ('${request.status}') and checkin_status ('${request.checkin_status}') in the same update for reservation ${reservationId}. This is not allowed.`
        );
        return {
          success: false,
          error: {
            message: "Cannot set both reservation status and check-in status in the same update. These actions must be performed separately.",
            code: "INVALID_STATUS_CHECKIN_COMBINATION"
          }
        };
      }

      // Declare updates and values arrays at the top
      const updates: string[] = [];
      const values: any[] = [];

      // Only allow checkin_status to be updated by explicit check-in/out flows (not by payment/confirmation)
      if (request.checkin_status) {
        updates.push("checkin_status = ?");
        values.push(request.checkin_status);
      }

      // Handle credit card updates
      let shouldConfirm = false;
      if (request.has_credit_card !== undefined) {
        updates.push("has_credit_card = ?");
        values.push(request.has_credit_card);
        // If adding card to a pending reservation, auto-confirm
        if (
          reservation.status === "pending" &&
          !reservation.has_credit_card &&
          request.has_credit_card === true
        ) {
          shouldConfirm = true;
        }
      }

      if (request.credit_card_last4 !== undefined) {
        updates.push("credit_card_last4 = ?");
        values.push(request.credit_card_last4);
      }

      // If we should confirm, add status = 'confirmed' to the update
      if (shouldConfirm) {
        updates.push("status = ?");
        values.push("confirmed");
      }

      if (updates.length === 0) {
        return {
          success: false,
          error: {
            message: "No fields to update",
            code: "NO_UPDATES"
          }
        };
      }

      // Update reservation
      await sql.raw(
        `UPDATE reservations SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, reservationId]
      );

      // Get updated reservation
      const updatedReservations = await sql<Reservation>`
        SELECT * FROM reservations WHERE id = ${reservationId}
      `;

      return {
        success: true,
        data: updatedReservations[0]
      };
    } catch (error: any) {
      console.error("Error updating reservation:", error);
      return {
        success: false,
        error: {
          message: error.message || String(error),
          code: "INTERNAL_ERROR",
          details: error
        }
      };
    }
  }

  /**
   * Cancel a reservation
   */
  static async cancelReservation(reservationId: UUID): Promise<ApiResponse<Reservation>> {
    try {
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

      if (reservation[0].status === 'cancelled') {
        return {
          success: false,
          error: {
            message: "Reservation is already cancelled",
            code: "ALREADY_CANCELLED"
          }
        };
      }

      if (['checked_in', 'checked_out'].includes(reservation[0].checkin_status)) {
        return {
          success: false,
          error: {
            message: "Cannot cancel reservation that has been checked in",
            code: "CANNOT_CANCEL_CHECKED_IN"
          }
        };
      }

      await sql`
        UPDATE reservations 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${reservationId}
      `;

      const updatedReservation = await sql<Reservation>`
        SELECT * FROM reservations WHERE id = ${reservationId}
      `;

      return {
        success: true,
        data: updatedReservation[0]
      };
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      return {
        success: false,
        error: {
          message: "Failed to cancel reservation",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Get reservations with detailed information
   */
  static async getReservationsWithDetails(
    filters: {
      userId?: UUID;
      status?: ReservationStatus;
      dateFrom?: string;
      dateTo?: string;
      roomTypeId?: UUID;
    } = {}
  ): Promise<ApiResponse<ReservationWithDetails[]>> {
    try {
      let query = `
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
      `;

      const conditions: string[] = [];
      const values: any[] = [];

      if (filters.userId) {
        conditions.push("r.user_id = ?");
        values.push(filters.userId);
      }

      if (filters.status) {
        conditions.push("r.status = ?");
        values.push(filters.status);
      }

      if (filters.dateFrom) {
        conditions.push("r.check_in_date >= ?");
        values.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        conditions.push("r.check_out_date <= ?");
        values.push(filters.dateTo);
      }

      if (filters.roomTypeId) {
        conditions.push("r.room_type_id = ?");
        values.push(filters.roomTypeId);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += `
        GROUP BY r.id, u.name, u.email, rt.type_name, ra.room_number
        ORDER BY r.created_at DESC
      `;

      const reservations = await sql.raw(query, values) as ReservationWithDetails[];

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
      console.error("Error getting reservations:", error);
      return {
        success: false,
        error: {
          message: "Failed to get reservations",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Get reservations for a specific user
   */
  static async getUserReservations(userId: UUID): Promise<ApiResponse<ReservationWithDetails[]>> {
    return this.getReservationsWithDetails({ userId });
  }

  /**
   * Get pending reservations (for clerks)
   */
  static async getPendingReservations(): Promise<ApiResponse<ReservationWithDetails[]>> {
    return this.getReservationsWithDetails({ status: ReservationStatus.PENDING });
  }

  /**
   * Get current guests (checked-in reservations)
   */
  static async getCurrentGuests(): Promise<ApiResponse<ReservationWithDetails[]>> {
    try {
      let query = `
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
        ORDER BY r.created_at DESC
      `;

      const reservations = await sql.raw(query) as ReservationWithDetails[];

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
   * Auto-cancel unpaid reservations at 7 PM
   */
  static async autoCancelUnpaidReservations(): Promise<{
    success: boolean;
    cancelledCount: number;
    errors: string[];
  }> {
    try {
      const unpaidReservations = await sql<Reservation>`
        SELECT * FROM reservations 
        WHERE status = 'pending' 
        AND has_credit_card = false
        AND check_in_date = CURDATE()
        AND created_at < DATE_SUB(NOW(), INTERVAL 12 HOUR)
      `;

      let cancelledCount = 0;
      const errors: string[] = [];

      for (const reservation of unpaidReservations) {
        try {
          await sql`
            UPDATE reservations 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${reservation.id}
          `;
          cancelledCount++;
        } catch (error) {
          errors.push(`Failed to cancel reservation ${reservation.id}: ${error}`);
        }
      }

      return {
        success: true,
        cancelledCount,
        errors
      };
    } catch (error) {
      console.error("Error in auto-cancel job:", error);
      return {
        success: false,
        cancelledCount: 0,
        errors: [`Auto-cancel job failed: ${error}`]
      };
    }
  }

  /**
   * Get a single reservation by ID with details
   */
  static async getReservationById(reservationId: UUID): Promise<ApiResponse<ReservationWithDetails>> {
    try {
      const query = `
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
        WHERE r.id = ?
        GROUP BY r.id, u.name, u.email, rt.type_name, ra.room_number
      `;

      const result = await sql.raw(query, [reservationId]) as ReservationWithDetails[];
      
      if (result.length === 0) {
        return {
          success: false,
          error: {
            message: "Reservation not found",
            code: "RESERVATION_NOT_FOUND"
          }
        };
      }

      return {
        success: true,
        data: result[0]
      };
    } catch (error) {
      console.error("Error getting reservation by ID:", error);
      return {
        success: false,
        error: {
          message: "Failed to get reservation",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }
} 