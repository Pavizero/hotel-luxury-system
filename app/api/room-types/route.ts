import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const roomTypes = await sql<{
      id: string;
      type_name: string;
      description: string | null;
      base_price: number;
      capacity: number;
      amenities: string | null;
      is_residential: boolean;
      weekly_rate: number | null;
      monthly_rate: number | null;
    }>`
      SELECT 
        id, 
        type_name, 
        description, 
        base_price, 
        capacity, 
        amenities, 
        is_residential, 
        weekly_rate, 
        monthly_rate
      FROM room_types 
      ORDER BY base_price ASC
    `;

    return NextResponse.json({ roomTypes });
  } catch (error) {
    console.error("Error fetching room types:", error);
    return NextResponse.json(
      { error: "Failed to fetch room types" },
      { status: 500 }
    );
  }
} 