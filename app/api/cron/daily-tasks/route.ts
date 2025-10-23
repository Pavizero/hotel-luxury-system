import { NextRequest, NextResponse } from "next/server";
import { CronService } from "@/lib/services/cron-service";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a legitimate cron job
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Starting daily cron tasks...");

    // Run all scheduled tasks
    const results = await CronService.runScheduledTasks();

    console.log("Daily cron tasks completed:", results);

    return NextResponse.json({
      message: "Daily tasks completed successfully",
      results
    });
  } catch (error) {
    console.error("Error in daily cron tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get recent daily reports
    const reports = await CronService.getRecentDailyReports(10);
    
    if (!reports.success) {
      return NextResponse.json(
        { error: reports.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      reports: reports.data
    });
  } catch (error) {
    console.error("Error getting daily reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 