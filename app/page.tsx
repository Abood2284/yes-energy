import ForecastDashboard from "@/components/shared/ForecastDashboard";
import { db } from "@/db";
import { load_act, d_load_forecast } from "@/db/schema";
import { ForecastData } from "@/lib/types";
import { sql } from "drizzle-orm";

export const runtime = "edge";
const parseDateFromText = (
  dateText: string,
  fallbackDate: string
): { year: string; month: string; day: string } | null => {
  if (dateText === "text") {
    console.log(
      `Encountered 'text' as date, using fallback date: ${fallbackDate}`
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

    console.log(
      "Load act query:",
      sql`date >= ${startDate} AND date <= ${endDate}`
    );
    console.log(
      "Forecast query:",
      sql`date >= ${startDate} AND date <= ${endDate}`
    );

    const [actData, fcstData] = await Promise.all([
      db
        .select()
        .from(load_act)
        .where(sql`date >= ${startDate} AND date <= ${endDate}`)
        .orderBy(sql`date`, sql`time`),
      db
        .select()
        .from(d_load_forecast)
        .where(sql`date >= ${startDate} AND date <= ${endDate}`)
        .orderBy(sql`date`, sql`time`, sql`revision DESC`),
    ]);

    console.log("Fetched data lengths:", {
      actData: actData.length,
      fcstData: fcstData.length,
    });

    if (actData.length === 0) {
      console.log("No data found for the specified date range");
      return [];
    }

    console.log("Sample actData:", actData[0]);
    console.log("Sample fcstData:", fcstData[0] || "No forecast data");

    // Process Baseline Forecast
    const baselineForecast = fcstData.reduce((acc, curr) => {
      const key = `${curr.date}_${curr.time}`;
      if (
        !acc[key] ||
        (curr.revision &&
          acc[key].revision &&
          new Date(curr.revision) > new Date(acc[key].revision))
      ) {
        acc[key] = curr;
      }
      return acc;
    }, {} as Record<string, (typeof fcstData)[0]>);

    let filteredCount = 0;
    const processedData: ForecastData[] = actData
      .map((act, index) => {
        console.log(
          `Processing act data (${index + 1}/${actData.length}):`,
          act
        );

        const parsedDate = parseDateFromText(act.date, startDate);
        if (!parsedDate) {
          console.error("Failed to parse date:", act.date);
          filteredCount++;
          return null;
        }

        const { year, month, day } = parsedDate;

        // Parse time correctly
        const timeString = act.time.padStart(4, "0");
        const hour = timeString.slice(0, 2);
        const minute = timeString.slice(2, 4);

        console.log("Parsed date parts:", { year, month, day, hour, minute });

        const datetimeString = `${year}-${month}-${day}T${hour}:${minute}:00Z`;
        const datetime = isValidDate(datetimeString)
          ? datetimeString
          : "Invalid Date";

        if (datetime === "Invalid Date") {
          console.error("Invalid datetime constructed:", datetimeString);
          filteredCount++;
          return null;
        }

        console.log("Constructed datetime:", datetime);

        const key = `${act.date}_${act.time}`;

        return {
          datetime,
          load_act: parseFloat(act.load_act) || 0,
          d_load_fcst: baselineForecast[key]
            ? parseFloat(baselineForecast[key].load_fcst)
            : null,
          d_revision: baselineForecast[key]?.revision ?? "",
          allRevisions: fcstData
            .filter((d) => d.date === act.date && d.time === act.time)
            .map((d) => ({
              load_fcst: parseFloat(d.load_fcst),
              revision: d.revision ?? "",
            })),
        };
      })
      .filter((item): item is ForecastData => item !== null);

    console.log("Processed data length:", processedData.length);
    console.log("Filtered out records:", filteredCount);
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
