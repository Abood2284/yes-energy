import ForecastDashboard from "@/components/shared/ForecastDashboard";
import { db } from "@/db";
import {
  d_load_fcst,
  j_load_fcst,
  load_act,
  mm_load_fcst,
  mw_load_fcst,
  d_load_fcst_full,
  j_load_fcst_full,
  mm_load_fcst_full,
  mw_load_fcst_full,
  load_act_full,
  LoadAct,
  DLoadFcst,
  JLoadFcst,
  MMLoadFcst,
  MWLoadFcst,
} from "@/db/schema";
import {
  calculateStatistics,
  processForecasts,
} from "@/lib/server-calculations";
import { ForecastData } from "@/lib/types";
import { sql } from "drizzle-orm";

export const runtime = "edge";

function formatDateTime(date: string, time: string): string {
  const hours = time.padStart(4, "0").slice(0, 2);
  const minutes = time.padStart(4, "0").slice(2, 4);
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(
    6,
    8
  )} ${hours}:${minutes}`;
}

async function getForecastData(
  startDate: string,
  endDate: string,
  limit: number = 1000,
  forecastType: "baseline" | "historical" = "baseline"
): Promise<ForecastData[]> {
  try {
    console.log("Fetching data for date range:", startDate, "to", endDate);

    const tables =
      forecastType === "baseline"
        ? [load_act, d_load_fcst, j_load_fcst, mm_load_fcst, mw_load_fcst]
        : [
            load_act_full,
            d_load_fcst_full,
            j_load_fcst_full,
            mm_load_fcst_full,
            mw_load_fcst_full,
          ];

    const [actData, dFcstData, jFcstData, mmFcstData, mwFcstData] =
      await Promise.all(
        tables.map((table) =>
          db
            .select()
            .from(table)
            .where(sql`date >= ${startDate} AND date <= ${endDate}`)
            .orderBy(sql`date`, sql`time`)
            .limit(limit)
        )
      );

    console.log("Fetched data lengths:", {
      actData: actData.length,
      dFcstData: dFcstData.length,
      jFcstData: jFcstData.length,
      mmFcstData: mmFcstData.length,
      mwFcstData: mwFcstData.length,
    });

    const processedData: ForecastData[] = (actData as LoadAct[]).map((act) => {
      const datetime = formatDateTime(act.date, act.time);
      const dFcst = (dFcstData as DLoadFcst[]).find(
        (d) => d.date === act.date && d.time === act.time
      );
      const jFcst = (jFcstData as JLoadFcst[]).find(
        (j) => j.date === act.date && j.time === act.time
      );
      const mmFcst = (mmFcstData as MMLoadFcst[]).find(
        (mm) => mm.date === act.date && mm.time === act.time
      );
      const mwFcst = (mwFcstData as MWLoadFcst[]).find(
        (mw) => mw.date === act.date && mw.time === act.time
      );

      return {
        datetime,
        load_act: parseFloat(act.load_act) || 0,
        d_load_fcst: dFcst ? parseFloat(dFcst.load_fcst) : null,
        j_load_fcst: jFcst ? parseFloat(jFcst.load_fcst) : null,
        mm_load_fcst: mmFcst ? parseFloat(mmFcst.load_fcst) : null,
        mw_load_fcst: mwFcst ? parseFloat(mwFcst.load_fcst) : null,
      };
    });

    console.log("Processed data length:", processedData.length);
    return processedData;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    throw error;
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; forecastType?: string };
}) {
  const page = parseInt(searchParams.page ?? "1", 10);
  const limit = parseInt(searchParams.limit ?? "1000", 10);
  const forecastType =
    (searchParams.forecastType as "baseline" | "historical") ?? "baseline";

  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}${month}${day}`;
  };

  const startDate = formatDate(startOfYear);
  const endDate = formatDate(today);

  console.log("Using date range:", startDate, "to", endDate);

  try {
    const forecastData: ForecastData[] = await getForecastData(
      startDate,
      endDate,
      limit,
      forecastType
    );

    const processedForecasts = await processForecasts(forecastData);
    const statistics = await calculateStatistics(processedForecasts);

    return (
      <>
        {forecastData.length === 0 && (
          <div className="p-4 mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <p>
              No forecast data available for the selected date range. You can
              still interact with the dashboard features.
            </p>
          </div>
        )}
        <ForecastDashboard
          initialForecasts={processedForecasts}
          initialStatistics={statistics}
        />
      </>
    );
  } catch (error) {
    console.error("Error in Page component:", error);
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <h2 className="text-lg font-bold mb-2">Error Loading Forecast Data</h2>
        <p>
          We&apos;re experiencing technical difficulties. Please try again later
          or contact support if the problem persists.
        </p>
        <p className="mt-2 text-sm">
          Error details: {(error as Error).message}
        </p>
      </div>
    );
  }
}
