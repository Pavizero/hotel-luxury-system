import { sql } from "@/lib/db";
import { 
  BillingType,
  ReservationStatus,
  ApiResponse,
  UUID,
  AutoCancelResult,
  NoShowBillingResult,
  DailyReportResult
} from "@/types";

export class CronService {
  /**
   * Auto-cancel unpaid reservations at 7 PM
   */
  static async autoCancelUnpaidReservations(): Promise<AutoCancelResult> {
    try {
      console.log("Starting auto-cancel job for unpaid reservations...");

      // Find unpaid reservations that should be cancelled
      const unpaidReservations = await sql<{
        id: string;
        user_id: string;
        check_in_date: string;
        created_at: string;
      }>`
        SELECT id, user_id, check_in_date, created_at
        FROM reservations 
        WHERE status = 'pending' 
        AND has_credit_card = false
        AND check_in_date = CURDATE()
        AND created_at < DATE_SUB(NOW(), INTERVAL 12 HOUR)
      `;

      console.log(`Found ${unpaidReservations.length} unpaid reservations to cancel`);

      const cancelledReservations: UUID[] = [];
      const errors: string[] = [];

      for (const reservation of unpaidReservations) {
        try {
          // Cancel the reservation
          await sql`
            UPDATE reservations 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${reservation.id}
          `;

          cancelledReservations.push(reservation.id);
          console.log(`Cancelled reservation ${reservation.id}`);
        } catch (error) {
          const errorMsg = `Failed to cancel reservation ${reservation.id}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      const result: AutoCancelResult = {
        success: true,
        message: `Auto-cancel job completed. Cancelled ${cancelledReservations.length} reservations.`,
        processed_count: cancelledReservations.length,
        cancelled_reservations: cancelledReservations,
        errors
      };

      console.log("Auto-cancel job completed:", result);
      return result;
    } catch (error) {
      console.error("Error in auto-cancel job:", error);
      return {
        success: false,
        message: `Auto-cancel job failed: ${error}`,
        processed_count: 0,
        cancelled_reservations: [],
        errors: [`Auto-cancel job failed: ${error}`]
      };
    }
  }

  /**
   * Bill no-show guests at 7 PM
   */
  static async billNoShowGuests(): Promise<NoShowBillingResult> {
    try {
      console.log("Starting no-show billing job...");

      // Find reservations that are no-shows (pending reservations for today that haven't been checked in)
      const noShowReservations = await sql<{
        id: string;
        user_id: string;
        final_price: number;
        check_in_date: string;
      }>`
        SELECT id, user_id, final_price, check_in_date
        FROM reservations 
        WHERE status = 'pending' 
        AND check_in_date = CURDATE()
        AND check_in_date < CURDATE() + INTERVAL 1 DAY
        AND check_in_date + INTERVAL 1 DAY < NOW()
      `;

      console.log(`Found ${noShowReservations.length} no-show reservations to bill`);

      const billedReservations: UUID[] = [];
      const errors: string[] = [];
      let totalBilled = 0;

      for (const reservation of noShowReservations) {
        try {
          // Calculate no-show fee (typically 50% of the reservation cost)
          const noShowFee = Math.round(reservation.final_price * 0.5 * 100) / 100;

          // Create billing record
          const billingId = crypto.randomUUID();
          await sql`
            INSERT INTO billing_records (
              id, reservation_id, billing_type, amount, 
              description, billed_by, status
            ) VALUES (
              ${billingId}, ${reservation.id}, 'no_show', ${noShowFee},
              'No-show fee for reservation on ${reservation.check_in_date}', 
              NULL, 'pending'
            )
          `;

          // Update reservation status to no-show
          await sql`
            UPDATE reservations 
            SET status = 'no-show', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ${reservation.id}
          `;

          billedReservations.push(reservation.id);
          totalBilled += noShowFee;
          console.log(`Billed no-show fee for reservation ${reservation.id}: $${noShowFee}`);
        } catch (error) {
          const errorMsg = `Failed to bill no-show reservation ${reservation.id}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      const result: NoShowBillingResult = {
        success: true,
        message: `No-show billing job completed. Billed ${billedReservations.length} reservations.`,
        processed_count: billedReservations.length,
        billed_reservations: billedReservations,
        total_billed: totalBilled,
        errors
      };

      console.log("No-show billing job completed:", result);
      return result;
    } catch (error) {
      console.error("Error in no-show billing job:", error);
      return {
        success: false,
        message: `No-show billing job failed: ${error}`,
        processed_count: 0,
        billed_reservations: [],
        total_billed: 0,
        errors: [`No-show billing job failed: ${error}`]
      };
    }
  }

  /**
   * Generate daily occupancy and revenue report
   */
  static async generateDailyReport(): Promise<DailyReportResult> {
    try {
      console.log("Starting daily report generation...");

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const reportDate = yesterday.toISOString().split('T')[0];

      // Get total rooms
      const totalRoomsResult = await sql<{ count: number }>`
        SELECT COUNT(*) as count FROM rooms WHERE status != 'maintenance'
      `;
      const totalRooms = totalRoomsResult[0].count;

      // Get occupied rooms for yesterday
      const occupiedRoomsResult = await sql<{ count: number }>`
        SELECT COUNT(DISTINCT ra.room_id) as count
        FROM room_assignments ra
        JOIN reservations r ON ra.reservation_id = r.id
        WHERE r.check_in_date <= ${reportDate}
        AND r.check_out_date > ${reportDate}
        AND r.status IN ('checked-in', 'checked-out')
      `;
      const occupiedRooms = occupiedRoomsResult[0].count;

      // Calculate occupancy rate
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      // Get total revenue for yesterday
      const revenueResult = await sql<{ total: number }>`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        JOIN reservations r ON p.reservation_id = r.id
        WHERE DATE(p.payment_date) = ${reportDate}
        AND p.status = 'completed'
      `;
      const totalRevenue = revenueResult[0].total;

      // Get reservation statistics
      const reservationStats = await sql<{
        total_reservations: number;
        total_check_ins: number;
        total_check_outs: number;
        total_cancellations: number;
        total_no_shows: number;
      }>`
        SELECT 
          COUNT(*) as total_reservations,
          SUM(CASE WHEN status = 'checked-in' THEN 1 ELSE 0 END) as total_check_ins,
          SUM(CASE WHEN status = 'checked-out' THEN 1 ELSE 0 END) as total_check_outs,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as total_cancellations,
          SUM(CASE WHEN status = 'no-show' THEN 1 ELSE 0 END) as total_no_shows
        FROM reservations 
        WHERE DATE(created_at) = ${reportDate}
      `;

      const stats = reservationStats[0];

      // Create daily report record
      const reportId = crypto.randomUUID();
      await sql`
        INSERT INTO daily_reports (
          id, report_date, total_occupancy, total_rooms, occupancy_rate,
          total_revenue, total_reservations, total_check_ins, total_check_outs,
          total_cancellations, total_no_shows, generated_by
        ) VALUES (
          ${reportId}, ${reportDate}, ${occupiedRooms}, ${totalRooms}, ${occupancyRate},
          ${totalRevenue}, ${stats.total_reservations}, ${stats.total_check_ins}, 
          ${stats.total_check_outs}, ${stats.total_cancellations}, ${stats.total_no_shows}, NULL
        )
      `;

      const result: DailyReportResult = {
        success: true,
        message: `Daily report generated for ${reportDate}`,
        processed_count: 1,
        report_id: reportId,
        report_date: reportDate,
        occupancy_rate: occupancyRate,
        total_revenue: totalRevenue,
        errors: []
      };

      console.log("Daily report generation completed:", result);
      return result;
    } catch (error) {
      console.error("Error generating daily report:", error);
      return {
        success: false,
        message: `Daily report generation failed: ${error}`,
        processed_count: 0,
        report_id: "",
        report_date: "",
        occupancy_rate: 0,
        total_revenue: 0,
        errors: [`Daily report generation failed: ${error}`]
      };
    }
  }

  /**
   * Run all scheduled tasks (called at 7 PM daily)
   */
  static async runScheduledTasks(): Promise<{
    autoCancel: AutoCancelResult;
    noShowBilling: NoShowBillingResult;
    dailyReport: DailyReportResult;
  }> {
    console.log("Starting scheduled tasks at 7 PM...");

    const autoCancel = await this.autoCancelUnpaidReservations();
    const noShowBilling = await this.billNoShowGuests();
    const dailyReport = await this.generateDailyReport();

    console.log("All scheduled tasks completed");

    return {
      autoCancel,
      noShowBilling,
      dailyReport
    };
  }

  /**
   * Get recent daily reports
   */
  static async getRecentDailyReports(limit: number = 30): Promise<ApiResponse<any[]>> {
    try {
      const reports = await sql`
        SELECT * FROM daily_reports 
        ORDER BY report_date DESC 
        LIMIT ${limit}
      `;

      return {
        success: true,
        data: reports
      };
    } catch (error) {
      console.error("Error getting recent daily reports:", error);
      return {
        success: false,
        error: {
          message: "Failed to get recent daily reports",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }

  /**
   * Get billing records for no-shows
   */
  static async getNoShowBillingRecords(): Promise<ApiResponse<any[]>> {
    try {
      const billingRecords = await sql`
        SELECT br.*, r.check_in_date, u.name as guest_name, u.email as guest_email
        FROM billing_records br
        JOIN reservations r ON br.reservation_id = r.id
        JOIN users u ON r.user_id = u.id
        WHERE br.billing_type = 'no_show'
        ORDER BY br.billed_at DESC
      `;

      return {
        success: true,
        data: billingRecords
      };
    } catch (error) {
      console.error("Error getting no-show billing records:", error);
      return {
        success: false,
        error: {
          message: "Failed to get no-show billing records",
          code: "INTERNAL_ERROR"
        }
      };
    }
  }
} 