import { ForecastData } from "@/lib/types";


export function filterHistoricalData(
  forecasts: ForecastData[],
  daysAhead: number,
  time: string
): ForecastData[] {
  const filteredForecasts: ForecastData[] = [];
  const timeComponents = time.split(':');
  const filterHour = parseInt(timeComponents[0]);
  const filterMinute = parseInt(timeComponents[1]);

  for (const forecast of forecasts) {
    const forecastDate = new Date(forecast.datetime);
    const forecastHour = forecastDate.getHours();
    const forecastMinute = forecastDate.getMinutes();

    // Check if the forecast time is just before the specified time
    if (
      forecastHour < filterHour ||
      (forecastHour === filterHour && forecastMinute < filterMinute)
    ) {
      // Calculate the date for 'daysAhead' days before the forecast date
      const historicalDate = new Date(forecastDate);
      historicalDate.setDate(historicalDate.getDate() - daysAhead);

      // Find the latest forecast made on or before the historical date
      const latestHistoricalForecast = forecasts.find(f => {
        const fDate = new Date(f.datetime);
        return fDate <= historicalDate && fDate.getDate() === historicalDate.getDate();
      });

      if (latestHistoricalForecast) {
        filteredForecasts.push({
          ...forecast,
          historical_d_load_fcst: latestHistoricalForecast.d_load_fcst,
          historical_j_load_fcst: latestHistoricalForecast.j_load_fcst,
          historical_mm_load_fcst: latestHistoricalForecast.mm_load_fcst,
          historical_mw_load_fcst: latestHistoricalForecast.mw_load_fcst,
        });
      } else {
        filteredForecasts.push(forecast);
      }
    } else {
      filteredForecasts.push(forecast);
    }
  }

  return filteredForecasts;
}



export async function calculateStatistics(chartData: ForecastData[]) {
  const calculateRMSE = (actual: number[], predicted: number[]): number => {
    if (actual.length !== predicted.length) return NaN;
    const squaredErrors = actual.map((value, index) =>
      Math.pow(value - (predicted[index] || 0), 2)
    );
    const meanSquaredError =
      squaredErrors.reduce((sum, value) => sum + value, 0) / actual.length;
    return Math.sqrt(meanSquaredError);
  };

  const stats: {
    [key: string]: {
      overallRMSE: number;
      dailyRMSE: { [date: string]: number };
    };
  } = {};

  const forecastKeys = [
    "d_load_fcst",
    "j_load_fcst",
    "mm_load_fcst",
    "mw_load_fcst",
    "historical_d_load_fcst",
    "historical_j_load_fcst",
    "historical_mm_load_fcst",
    "historical_mw_load_fcst"
  ];

  forecastKeys.forEach((forecast) => {
    const actualValues = chartData.map((d) => d.load_act as number);
    const predictedValues = chartData.map(
      (d) => d[forecast as keyof ForecastData] as number
    );

    // Calculate overall RMSE
    const overallRMSE = calculateRMSE(actualValues, predictedValues);

    // Calculate daily RMSE
    const dailyRMSE: { [date: string]: number } = {};
    const groupedByDate = chartData.reduce((acc, curr) => {
      const date = new Date(curr.datetime).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {} as { [date: string]: ForecastData[] });

    Object.entries(groupedByDate).forEach(([date, dayData]) => {
      const dayActual = dayData.map((d) => d.load_act as number);
      const dayPredicted = dayData.map(
        (d) => d[forecast as keyof ForecastData] as number
      );
      dailyRMSE[date] = calculateRMSE(dayActual, dayPredicted);
    });

    stats[forecast] = { overallRMSE, dailyRMSE };
  });

  return stats;
}

export async function processForecasts(
  forecasts: ForecastData[],
  dateRange?: { from: Date; to: Date },
  showHistoricalData?: boolean,
  historicalDaysAhead?: number,
  historicalTime?: string
): Promise<ForecastData[]> {
  let processedForecasts = forecasts;

  // Implement date range filtering if dateRange is provided
  if (dateRange) {
    const { from, to } = dateRange;
    processedForecasts = processedForecasts.filter(forecast => {
      const forecastDate = new Date(forecast.datetime);
      return forecastDate >= from && forecastDate <= to;
    });
  }

  // Process historical data if requested
  if (showHistoricalData && historicalDaysAhead !== undefined && historicalTime !== undefined) {
    processedForecasts = filterHistoricalData(processedForecasts, historicalDaysAhead, historicalTime);
  }

  return processedForecasts;
}