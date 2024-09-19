import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db";
import { sql } from "drizzle-orm";
import {
  d_load_fcst, j_load_fcst, mm_load_fcst, mw_load_fcst, load_act,
  d_load_fcst_full, j_load_fcst_full, mm_load_fcst_full, mw_load_fcst_full, load_act_full
} from "@/db/schema";
import { ForecastData } from '@/lib/types';
import { calculateStatistics, processForecasts  } from '@/lib/server-calculations';

export const runtime = 'edge';

interface ProcessForecastsRequest {
  dateRange: { from: string; to: string };
  showHistoricalData: boolean;
  historicalDaysAhead: number;
  historicalTime: string;
  selectedForecasts: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: ProcessForecastsRequest = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { dateRange, showHistoricalData, historicalDaysAhead, historicalTime, selectedForecasts } = body;

    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    console.log('Converted date range:', { fromDate: fromDate.toISOString(), toDate: toDate.toISOString() });

    const baselineForecasts = await fetchBaselineForecasts({
      from: fromDate.toISOString().split('T')[0].replace(/-/g, ''),
      to: toDate.toISOString().split('T')[0].replace(/-/g, '')
    }, selectedForecasts);
    console.log('Baseline forecasts count:', baselineForecasts.length);

    let historicalForecasts: ForecastData[] = [];
    if (showHistoricalData) {
      historicalForecasts = await fetchHistoricalForecasts(
        {
          from: fromDate.toISOString().split('T')[0].replace(/-/g, ''),
          to: toDate.toISOString().split('T')[0].replace(/-/g, '')
        },
        selectedForecasts,
        historicalDaysAhead,
        historicalTime
      );
      console.log('Historical forecasts count:', historicalForecasts.length);
    }

    const combinedForecasts = combineForecasts(baselineForecasts, historicalForecasts);
    console.log('Combined forecasts count:', combinedForecasts.length);

    const processedForecasts = await processForecasts(
      combinedForecasts,
      { from: fromDate, to: toDate },
      showHistoricalData,
      historicalDaysAhead,
      historicalTime
    );
    console.log('Processed forecasts count:', processedForecasts.length);

    let statistics;
    try {
      statistics = await calculateStatistics(processedForecasts);
    } catch (statsError) {
      console.error('Error calculating statistics:', statsError);
      statistics = { error: 'Failed to calculate statistics' };
    }

    return NextResponse.json({ processedForecasts, statistics });
  } catch (error) {
    console.error('Error processing forecasts:', error);
    return NextResponse.json({
      error: 'Error processing forecasts',
      details: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

async function fetchBaselineForecasts(dateRange: { from: string; to: string }, selectedForecasts: string[]): Promise<ForecastData[]> {
  const tables = {
    d_load_fcst, j_load_fcst, mm_load_fcst, mw_load_fcst, load_act
  };

  const queries = selectedForecasts.map(forecast => 
    db.select()
      .from(tables[forecast as keyof typeof tables])
      .where(sql`date >= ${dateRange.from} AND date <= ${dateRange.to}`)
  );

  const results = await Promise.all(queries);
  console.log('Baseline query results:', results.map(r => r.length));

  return results[0].map((_, index) => {
    const baseObject: ForecastData = {
      datetime: results[0][index].date + ' ' + results[0][index].time,
      load_act: 0,
      d_load_fcst: null,
      j_load_fcst: null,
      mm_load_fcst: null,
      mw_load_fcst: null,
    };

    selectedForecasts.forEach((forecast, i) => {
      const row = results[i][index] as Record<string, any>;
      let value: number | null = null;

      // Check for different possible property names
      if ('load_fcst' in row) value = row.load_fcst;
      else if ('load_act' in row) value = row.load_act;
      else if (forecast in row) value = row[forecast];

      if (forecast === 'load_act') {
        baseObject.load_act = value ?? 0;
      } else if (forecast in baseObject) {
        (baseObject[forecast as keyof ForecastData] as number | null) = value;
      }
    });

    return baseObject;
  });
}
async function fetchHistoricalForecasts(
  dateRange: { from: string; to: string },
  selectedForecasts: string[],
  daysAhead: number,
  time: string
): Promise<ForecastData[]> {
  const tables = {
    d_load_fcst: d_load_fcst_full,
    j_load_fcst: j_load_fcst_full,
    mm_load_fcst: mm_load_fcst_full,
    mw_load_fcst: mw_load_fcst_full,
    load_act: load_act_full
  };

   const queries = selectedForecasts.map(forecast => 
      db.select()
        .from(tables[forecast as keyof typeof tables])
        .where(sql`
          date >= ${dateRange.from} AND date <= ${dateRange.to}
          AND revision <= DATE(date, '-${daysAhead} days')
          AND revision >= DATE(DATE(date, '-${daysAhead} days'), 'start of day')
          AND revision <= DATE(DATE(date, '-${daysAhead} days'), 'start of day', '${time}')
        `)
        .orderBy(sql`revision DESC`)
        .groupBy(sql`date, time`)
   );
  
   
  const results = await Promise.all(queries);
  console.log('Historical query results:', results.map(r => r.length));


return results[0].map((_, index) => {
    const baseObject: ForecastData = {
      datetime: results[0][index].date + ' ' + results[0][index].time,
      load_act: 0,
      d_load_fcst: null,
      j_load_fcst: null,
      mm_load_fcst: null,
      mw_load_fcst: null,
    };

    selectedForecasts.forEach((forecast, i) => {
      const row = results[i][index] as Record<string, any>;
      let value: number | null = null;

      // Check for different possible property names
      if ('load_fcst' in row) value = row.load_fcst;
      else if ('load_act' in row) value = row.load_act;
      else if (forecast in row) value = row[forecast];

      if (forecast === 'load_act') {
        baseObject.load_act = value ?? 0;
      } else {
        const historicalKey = `historical_${forecast}` as keyof ForecastData;
        if (historicalKey in baseObject) {
          (baseObject[historicalKey] as number | null) = value;
        }
      }
    });

    return baseObject;
  });
}

function combineForecasts(baseline: ForecastData[], historical: ForecastData[]): ForecastData[] {
  const combinedMap = new Map();

  baseline.forEach(item => combinedMap.set(item.datetime, item));
  historical.forEach(item => {
    const existing = combinedMap.get(item.datetime) || {};
    combinedMap.set(item.datetime, { ...existing, ...item });
  });

  return Array.from(combinedMap.values());
}