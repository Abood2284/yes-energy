import ForecastDashboard from "@/components/shared/ForecastDashboard";
import { db } from "@/db";
import { d_load_fcst, j_load_fcst, load_act, mm_load_fcst, mw_load_fcst } from "@/db/schema";
import { ForecastData } from "@/lib/types";
import { sql } from "drizzle-orm";

export const runtime = "edge";

const parseDateFromText = (
  dateText: string,
  fallbackDate: string
): { year: string; month: string; day: string } | null => {
  if (dateText === "text") {
    console.log(
      `Encoun tered 'text' as date, using fallback date: ${fallbackDate}`
    );
    const match = fallbackDate.match(/(\d{4})(\d{2})(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return { year, month, day };
    }
  } else {
    const match = dateText.match(/(\d{4})(\d{2})(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return { year, month, day };
    }
  }
  console.error(
    `Failed to parse date: ${dateText}, fallback date: ${fallbackDate}`
  );
  return null;
};

const isValidDate = (dateString: string) => {
  const d = new Date(dateString);
  return !isNaN(d.getTime());
};

async function getForecastData(
  startDate: string,
  endDate: string
): Promise<ForecastData[]> {
  try {
    console.log("Fetching data for date range:", startDate, "to", endDate);

    const [actData, dFcstData, jFcstData, mmFcstData, mwFcstData] =
      await Promise.all([
        db
          .select()
          .from(load_act)
          .where(sql`date >= ${startDate} AND date <= ${endDate}`)
          .orderBy(sql`date`, sql`time`),
        db
          .select()
          .from(d_load_fcst)
          .where(sql`date >= ${startDate} AND date <= ${endDate}`)
          .orderBy(sql`date`, sql`time`),
        db
          .select()
          .from(j_load_fcst)
          .where(sql`date >= ${startDate} AND date <= ${endDate}`)
          .orderBy(sql`date`, sql`time`),
        db
          .select()
          .from(mm_load_fcst)
          .where(sql`date >= ${startDate} AND date <= ${endDate}`)
          .orderBy(sql`date`, sql`time`),
        db
          .select()
          .from(mw_load_fcst)
          .where(sql`date >= ${startDate} AND date <= ${endDate}`)
          .orderBy(sql`date`, sql`time`),
      ]);

    console.log("Fetched data lengths:", {
      actData: actData.length,
      dFcstData: dFcstData.length,
      jFcstData: jFcstData.length,
      mmFcstData: mmFcstData.length,
      mwFcstData: mwFcstData.length,
    });

    if (actData.length === 0) {
      console.log("No data found for the specified date range");
      return [];
    }

    const processedData: ForecastData[] = actData.map((act) => {
      const datetime = `${act.date}T${act.time.padStart(4, "0")}:00Z`;
      const dFcst = dFcstData.find(
        (d) => d.date === act.date && d.time === act.time
      );
      const jFcst = jFcstData.find(
        (j) => j.date === act.date && j.time === act.time
      );
      const mmFcst = mmFcstData.find(
        (mm) => mm.date === act.date && mm.time === act.time
      );
      const mwFcst = mwFcstData.find(
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
    console.log("First processed data item:", processedData[0]);
    console.log(
      "Last processed data item:",
      processedData[processedData.length - 1]
    );

    return processedData;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    throw error;
  }
}

export default async function Page() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1); // January 1st of current year

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
      endDate
    );

    console.log("Forecast data length:", forecastData.length);

    if (forecastData.length === 0) {
      return (
        <div>
          No forecast data available for the selected date range. Please try a
          different range.
        </div>
      );
    }

    return <ForecastDashboard initialForecasts={forecastData} />;
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
