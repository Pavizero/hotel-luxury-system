"use server"

import { sql } from "@/lib/db"
import { CronService } from "@/lib/services/cron-service"

// Define interfaces for database row types
interface ReservationRow {
  id: string;
  user_id: string;
  room_type_id: string;
  room_type_name: string;
  check_in: string | Date;
  check_out: string | Date;
  guests: number;
  status: string;
  amount: number;
}

// interface TravelCompanyBookingRow {
//   id: string;
//   company_name: string;
//   contact_person: string;
//   email: string;
//   phone: string;
//   created_at: string | Date;
//   check_in_date: string;
//   check_out_date: string;
//   rooms: number;
//   guests: number;
//   room_types: string;
//   total_amount: number;
//   paid_amount: number;
//   status: string;
//   payment_status: string;
// }

// interface GuestRow {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   status: string;
//   check_in: string | Date;
//   check_out: string | Date;
//   room_number: string;
//   total_charges: number;
// }

interface RoomRow {
  id: string;
  room_number: string;
  room_type_id: string;
  room_type_name: string;
  status: string;
  price: number;
  description: string;
  capacity: number;
}

interface GuestRow {
  id: string;
  name: string;
  room: string | null;
  roomType: string;
  checkIn: string | Date;
  checkOut: string | Date;
  status: string;
  guests: number;
  email: string;
  phone: string;
  balance: number;
}

interface BookingRow {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  bookingDate: string | Date;
  checkIn: string | Date;
  checkOut: string | Date;
  rooms: number;
  guests: number;
  roomType: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paymentStatus: string;
}

// Define interfaces for update field objects
interface ReservationUpdateFields {
  [key: string]: string | number | Date | boolean;
}

interface TravelCompanyBookingUpdateFields {
  [key: string]: string | number | Date;
}

// interface RoomUpdateFields {
//   [key: string]: string | number | Date;
// }

interface BulkBookingData {
  userId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  roomTypes: string[];
  totalAmount: number;
}

// interface LoyaltyProgramRow {
//   current: number;
//   tier: string;
//   nextTier: string;
//   pointsToNext: number;
// }

// --- Automated Daily Tasks ---

// Cancel reservations without credit card details at 7 PM
export async function cancelReservationsWithoutPayment(isTestMode = false) {
  try {
    console.log("Starting auto-cancel job for unpaid reservations...");
    
    const result = await CronService.autoCancelUnpaidReservations();
    
    return { 
      success: result.success, 
      cancelledCount: result.cancelled_reservations.length,
      message: result.message,
      errors: result.errors
    };
  } catch (error) {
    console.error("Error cancelling reservations without payment:", error);
    return { 
      success: false, 
      error: (error as Error).message,
      cancelledCount: 0
    };
  }
}

// Create billing records for no-show customers
export async function createNoShowBilling(isTestMode = false) {
  try {
    console.log("Starting no-show billing job...");
    
    const result = await CronService.billNoShowGuests();
    
    return { 
      success: result.success, 
      billedCount: result.billed_reservations.length,
      totalBilled: result.total_billed,
      message: result.message,
      errors: result.errors
    };
  } catch (error) {
    console.error("Error creating no-show billing:", error);
    return { 
      success: false, 
      error: (error as Error).message,
      billedCount: 0,
      totalBilled: 0
    };
  }
}

// Generate daily occupancy and revenue report
export async function generateDailyReport() {
  try {
    console.log("Starting daily report generation...");
    
    const result = await CronService.generateDailyReport();
    
    if (result.success) {
      return { 
        success: true, 
        report: {
          date: result.report_date,
          occupancyRate: result.occupancy_rate,
          totalRevenue: result.total_revenue,
          reportId: result.report_id
        },
        message: result.message
      };
    } else {
      return { 
        success: false, 
        error: result.message
      };
    }
  } catch (error) {
    console.error("Error generating daily report:", error);
    return { 
      success: false, 
      error: (error as Error).message
    };
  }
}

// Run all scheduled tasks (for testing purposes)
export async function runAllScheduledTasks() {
  try {
    console.log("Running all scheduled tasks...");
    
    const results = await CronService.runScheduledTasks();
    
    return {
      success: true,
      results: {
        autoCancel: results.autoCancel,
        noShowBilling: results.noShowBilling,
        dailyReport: results.dailyReport
      }
    };
  } catch (error) {
    console.error("Error running scheduled tasks:", error);
    return { 
      success: false, 
      error: (error as Error).message
    };
  }
}