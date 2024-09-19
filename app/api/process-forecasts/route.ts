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

    const baselineForecasts = await fetchBaselineForecasts({
      from: fromDate.toISOString().split('T')[0].replace(/-/g, ''),
      to: toDate.toISOString().split('T')[0].replace(/-/g, '')
    }, selectedForecasts);

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
    }

    const combinedForecasts = combineForecasts(baselineForecasts, historicalForecasts);

    const processedForecasts = await processForecasts(
      combinedForecasts,
      { from: fromDate, to: toDate },
      showHistoricalData,
      historicalDaysAhead,
      historicalTime
    );

    const statistics = await calculateStatistics(processedForecasts, selectedForecasts);

    return NextResponse.json({ processedForecasts, statistics });
  } catch (error) {
    console.error('Error processing forecasts:', error);
    return NextResponse.json({
      error: 'Error processing forecasts',
      details: (error as Error).message,
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
    date: results[0][index].date,
    time: results[0][index].time,
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

  try {
    console.log(`Fetching historical forecasts for date range: ${dateRange.from} to ${dateRange.to}`);
    console.log(`Selected forecasts: ${selectedForecasts.join(', ')}`);
    console.log(`Days ahead: ${daysAhead}, Time: ${time}`);

    const queries = selectedForecasts.map(forecast => {
      const query = db.select()
        .from(tables[forecast as keyof typeof tables])
        .where(sql`
          date >= ${dateRange.from} AND date <= ${dateRange.to}
          AND (SUBSTR(revision, 7, 4) || '-' || SUBSTR(revision, 4, 2) || '-' || SUBSTR(revision, 1, 2) || ' ' || SUBSTR(revision, 12, 2) || ':' || SUBSTR(revision, 15, 2)) <= (date || ' ' || time)
          AND (SUBSTR(revision, 7, 4) || '-' || SUBSTR(revision, 4, 2) || '-' || SUBSTR(revision, 1, 2) || ' ' || SUBSTR(revision, 12, 2) || ':' || SUBSTR(revision, 15, 2)) >= (DATE(date, ${`-${daysAhead} days`}) || ' 00:00')
          AND (SUBSTR(revision, 7, 4) || '-' || SUBSTR(revision, 4, 2) || '-' || SUBSTR(revision, 1, 2) || ' ' || SUBSTR(revision, 12, 2) || ':' || SUBSTR(revision, 15, 2)) <= (DATE(date, ${`-${daysAhead} days`}) || ' ' || ${time})
        `)
        .orderBy(sql`revision DESC`)
        .groupBy(sql`date, time`);

      console.log(`Query for ${forecast}:`, query.toSQL());
      return query;
    });

    const results = await Promise.all(queries);
    console.log('Historical query results summary:');
    selectedForecasts.forEach((forecast, index) => {
      console.log(`  ${forecast}: ${results[index].length} rows`);
    });

    // Process results (limit logging to avoid overwhelming output)
    const processedResults = results[0].map((_, index) => {
      const baseObject: ForecastData = {
        date: results[0][index].date,
        time: results[0][index].time,
        load_act: 0,
        d_load_fcst: null,
        j_load_fcst: null,
        mm_load_fcst: null,
        mw_load_fcst: null,
      };
      
      selectedForecasts.forEach((forecast, i) => {
        const row = results[i][index] as Record<string, any>;
        let value: number | null = null;

        if ('load_fcst' in row) value = row.load_fcst;
        else if ('load_act' in row) value = row.load_act;
        else if (forecast in row) value = row[forecast];

        if (forecast === 'load_act') {
          baseObject.load_act = value ?? 0;
        } else {
          const historicalKey = `historical_${forecast}` as keyof ForecastData;
          (baseObject[historicalKey] as number | null) = value;
        }
      });

      return baseObject;
    });

    console.log(`Processed ${processedResults.length} historical forecast entries`);

    // Log a sample of processed results (e.g., first 3 entries)
    console.log('Sample of processed historical forecasts:');
    console.log(JSON.stringify(processedResults.slice(0, 3), null, 2));

    return processedResults;
  } catch (error) {
    console.error('Error fetching historical forecasts:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}


function combineForecasts(baseline: ForecastData[], historical: ForecastData[]): ForecastData[] {
  const combinedMap = new Map<string, ForecastData>();

  baseline.forEach(item => {
    const key = `${item.date}-${item.time}`;
    combinedMap.set(key, item);
  });

  historical.forEach(item => {
    const key = `${item.date}-${item.time}`;
    const existing = combinedMap.get(key) || {
      date: item.date,
      time: item.time,
      load_act: 0,
      d_load_fcst: null,
      j_load_fcst: null,
      mm_load_fcst: null,
      mw_load_fcst: null
    };
    
    combinedMap.set(key, { 
      ...existing, 
      historical_d_load_fcst: item.d_load_fcst,
      historical_j_load_fcst: item.j_load_fcst,
      historical_mm_load_fcst: item.mm_load_fcst,
      historical_mw_load_fcst: item.mw_load_fcst
    });
  });

  return Array.from(combinedMap.values());
}