import { NextResponse } from 'next/server';
import { db } from "@/db";
import { load_act, d_load_fcst, j_load_fcst, mm_load_fcst, mw_load_fcst } from "@/db/schema";
import { sql } from "drizzle-orm";
import { ForecastData } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '1000', 10);
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';

  const offset = (page - 1) * limit;

  try {
    const forecastData = await getForecastData(startDate, endDate, limit, offset);
    return NextResponse.json({ data: forecastData, page, limit });
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Implement getForecastData function here, similar to the one in page.tsx