import { sql } from "@/lib/db";
import { 
  Payment, 
  CreatePaymentRequest, 
  PaymentMethod, 
  PaymentStatus,
  ReservationStatus,
  ApiResponse,
  UUID
} from "@/types";

export class PaymentService {
  /**
   * Process a payment for a reservation
   */
  static async processPayment(
    request: CreatePaymentRequest,
    processedBy: UUID
  ): Promise<ApiResponse<Payment>> {
    try {
      // Validate reservation exists and can accept payments
      const reservation = await sql<{
        id: string;
        status: string;
        final_price: number;
        is_travel_company: boolean;
        travel_company_id: string | null;
      }>`SELECT id, status, final_price, is_travel_company, travel_company_id 
         FROM reservations WHERE id = ${request.reservation_id}`;

      if (reservation.length === 0) {
        return {
          success: false,
          error: {
            message: "Reservation not found",
            code: "RESERVATION_NOT_FOUND"
          }
        };
      }

      const res = reservation[0];

      // Check if reservation is in a valid state for payment
      if (!['pending', 'confirmed'].includes(res.status)) {
        return {
          success: false,
          error: {
            message: "Cannot process payment for reservation in current status",
            code: "INVALID_STATUS_FOR_PAYMENT"
          }
        };
      }

      // For travel company payments, validate company credit limit
      if (request.payment_method === PaymentMethod.TRAVEL_COMPANY && res.is_travel_company) {
        const travelCompany = await sql<{
          credit_limit: number;
          current_balance: number;
        }>`SELECT credit_limit, current_balance FROM travel_companies WHERE id = ${res.travel_company_id}`;

        if (travelCompany.length === 0) {
          return {
            success: false,
            error: {
              message: "Travel company not found",
              code: "TRAVEL_COMPANY_NOT_FOUND"
            }
          };
        }

        const company = travelCompany[0];
        if (company.current_balance + request.amount > company.credit_limit) {
          return {
            success: false,
            error: {
              message: "Payment would exceed travel company credit limit",
              code: "CREDIT_LIMIT_EXCEEDED"
            }
          };
        }
      }

      // Create payment record
      const paymentId = crypto.randomUUID();
      await sql`
        INSERT INTO payments (
          id, reservation_id, amount, payment_method, 
          transaction_id, status, processed_by
        ) VALUES (
          ${paymentId}, ${request.reservation_id}, ${request.amount}, 
          ${request.payment_method}, ${request.transaction_id || null}, 
          'completed', ${processedBy}
        )
      `;

      // Update travel company balance if applicable
      if (request.payment_method === PaymentMethod.TRAVEL_COMPANY && res.is_travel_company) {
        await sql`
          UPDATE travel_companies 
          SET current_balance = current_balance + ${request.amount}
          WHERE id = ${res.travel_company_id}
        `;
      }

      // Update reservation status if this completes the payment
      const totalPaid = await this.getTotalPaidForReservation(request.reservation_id);
      if (totalPaid >= res.final_price) {
        await sql`
          UPDATE reservations 
          SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
          WHERE id = ${request.reservation_id}
        `;
      }

      // Get created payment
      const payments = await sql<Payment>`
        SELECT * FROM payments WHERE id = ${paymentId}
      `;

      return {
        success: true,
        data: payments[0]
      };
    } catch (error: any) {
      console.error("Error processing payment:", error);
      return {
        success: false,
        error: {
          message: "Failed to process payment",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Get total amount paid for a reservation
   */
  static async getTotalPaidForReservation(reservationId: UUID): Promise<number> {
    try {
      const payments = await sql<{ amount: number }>`
        SELECT amount FROM payments 
        WHERE reservation_id = ${reservationId} 
        AND status = 'completed'
      `;

      return payments.reduce((total, payment) => total + payment.amount, 0);
    } catch (error) {
      console.error("Error getting total paid:", error);
      return 0;
    }
  }

  /**
   * Get outstanding balance for a reservation
   */
  static async getOutstandingBalance(reservationId: UUID): Promise<number> {
    try {
      const reservation = await sql<{
        final_price: number;
      }>`SELECT final_price FROM reservations WHERE id = ${reservationId}`;

      if (reservation.length === 0) return 0;

      const totalPaid = await this.getTotalPaidForReservation(reservationId);
      const serviceCharges = await this.getServiceChargesTotal(reservationId);

      return reservation[0].final_price - totalPaid + serviceCharges;
    } catch (error) {
      console.error("Error getting outstanding balance:", error);
      return 0;
    }
  }

  /**
   * Get total service charges for a reservation
   */
  static async getServiceChargesTotal(reservationId: UUID): Promise<number> {
    try {
      const serviceCharges = await sql<{ amount: number }>`
        SELECT amount FROM service_charges 
        WHERE reservation_id = ${reservationId}
      `;

      return serviceCharges.reduce((total, charge) => total + charge.amount, 0);
    } catch (error) {
      console.error("Error getting service charges total:", error);
      return 0;
    }
  }

  /**
   * Process checkout payment with service charges
   */
  static async processCheckoutPayment(
    reservationId: UUID,
    paymentMethod: PaymentMethod,
    amount: number,
    serviceCharges: Array<{
      service_type: string;
      description: string;
      amount: number;
    }>,
    processedBy: UUID
  ): Promise<ApiResponse<{
    payment: Payment;
    serviceCharges: any[];
  }>> {
    try {
      // Validate reservation is checked in
      const reservation = await sql<{
        id: string;
        status: string;
      }>`SELECT id, status FROM reservations WHERE id = ${reservationId}`;

      if (reservation.length === 0) {
        return {
          success: false,
          error: {
            message: "Reservation not found",
            code: "RESERVATION_NOT_FOUND"
          }
        };
      }

      // Check checkin_status for checkout
      const checkinStatusResult = await sql<{ checkin_status: string }>`SELECT checkin_status FROM reservations WHERE id = ${reservationId}`;
      if (checkinStatusResult.length === 0 || checkinStatusResult[0].checkin_status !== 'checked_in') {
        return {
          success: false,
          error: {
            message: "Reservation must be checked in to process checkout payment",
            code: "INVALID_STATUS_FOR_CHECKOUT"
          }
        };
      }

      // Add service charges first
      const serviceChargeIds: string[] = [];
      for (const charge of serviceCharges) {
        const chargeId = crypto.randomUUID();
        await sql`
          INSERT INTO service_charges (
            id, reservation_id, service_type, description, 
            amount, charged_by
          ) VALUES (
            ${chargeId}, ${reservationId}, ${charge.service_type}, 
            ${charge.description}, ${charge.amount}, ${processedBy}
          )
        `;
        serviceChargeIds.push(chargeId);
      }

      // Process payment
      const paymentResult = await this.processPayment({
        reservation_id: reservationId,
        amount,
        payment_method: paymentMethod,
        transaction_id: `CHECKOUT_${Date.now()}`
      }, processedBy);

      if (!paymentResult.success) {
        return paymentResult;
      }

      // Do not update status to checked-out; checkin_status is handled elsewhere

      // Get service charges
      const createdServiceCharges = await sql`
        SELECT * FROM service_charges WHERE id IN (${serviceChargeIds.join(',')})
      `;

      return {
        success: true,
        data: {
          payment: paymentResult.data,
          serviceCharges: createdServiceCharges
        }
      };
    } catch (error) {
      console.error("Error processing checkout payment:", error);
      return {
        success: false,
        error: {
          message: "Failed to process checkout payment",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Get payment history for a reservation
   */
  static async getPaymentHistory(reservationId: UUID): Promise<ApiResponse<Payment[]>> {
    try {
      const payments = await sql<Payment>`
        SELECT * FROM payments 
        WHERE reservation_id = ${reservationId}
        ORDER BY payment_date DESC
      `;

      return {
        success: true,
        data: payments
      };
    } catch (error) {
      console.error("Error getting payment history:", error);
      return {
        success: false,
        error: {
          message: "Failed to get payment history",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(
    paymentId: UUID,
    refundAmount: number,
    reason: string,
    processedBy: UUID
  ): Promise<ApiResponse<Payment>> {
    try {
      const payment = await sql<Payment>`
        SELECT * FROM payments WHERE id = ${paymentId}
      `;

      if (payment.length === 0) {
        return {
          success: false,
          error: {
            message: "Payment not found",
            code: "PAYMENT_NOT_FOUND"
          }
        };
      }

      if (payment[0].status !== 'completed') {
        return {
          success: false,
          error: {
            message: "Only completed payments can be refunded",
            code: "INVALID_PAYMENT_STATUS"
          }
        };
      }

      if (refundAmount > payment[0].amount) {
        return {
          success: false,
          error: {
            message: "Refund amount cannot exceed original payment amount",
            code: "INVALID_REFUND_AMOUNT"
          }
        };
      }

      // Create refund payment record
      const refundId = crypto.randomUUID();
      await sql`
        INSERT INTO payments (
          id, reservation_id, amount, payment_method, 
          transaction_id, status, processed_by, notes
        ) VALUES (
          ${refundId}, ${payment[0].reservation_id}, -${refundAmount}, 
          ${payment[0].payment_method}, ${payment[0].transaction_id}_REFUND, 
          'refunded', ${processedBy}, ${reason}
        )
      `;

      // Update original payment status
      await sql`
        UPDATE payments 
        SET status = 'refunded', notes = ${reason}
        WHERE id = ${paymentId}
      `;

      // Get refund payment
      const refundPayment = await sql<Payment>`
        SELECT * FROM payments WHERE id = ${refundId}
      `;

      return {
        success: true,
        data: refundPayment[0]
      };
    } catch (error) {
      console.error("Error refunding payment:", error);
      return {
        success: false,
        error: {
          message: "Failed to refund payment",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Generate payment summary for checkout
   */
  static async generateCheckoutSummary(reservationId: UUID): Promise<ApiResponse<{
    reservation: any;
    totalPaid: number;
    outstandingBalance: number;
    serviceCharges: any[];
    payments: Payment[];
  }>> {
    try {
      const reservation = await sql`
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

      const totalPaid = await this.getTotalPaidForReservation(reservationId);
      const outstandingBalance = await this.getOutstandingBalance(reservationId);
      const serviceCharges = await sql`
        SELECT * FROM service_charges WHERE reservation_id = ${reservationId}
      `;
      const payments = await this.getPaymentHistory(reservationId);

      return {
        success: true,
        data: {
          reservation: reservation[0],
          totalPaid,
          outstandingBalance,
          serviceCharges,
          payments: payments.success ? payments.data : []
        }
      };
    } catch (error) {
      console.error("Error generating checkout summary:", error);
      return {
        success: false,
        error: {
          message: "Failed to generate checkout summary",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }
} 