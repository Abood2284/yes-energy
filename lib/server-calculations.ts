import { ForecastData } from "@/lib/types";


function filterHistoricalData(
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
  console.log('Calculating statistics for', chartData.length, 'data points');

  const calculateRMSE = (actual: number[], predicted: number[]): number => {
    if (actual.length !== predicted.length) return NaN;
    const validPairs = actual.map((a, i) => [a, predicted[i]])
                             .filter(([a, p]) => !isNaN(a) && !isNaN(p));
    if (validPairs.length === 0) return NaN;
    
    const squaredErrors = validPairs.map(([a, p]) => Math.pow(a - p, 2));
    const meanSquaredError = squaredErrors.reduce((sum, value) => sum + value, 0) / validPairs.length;
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
    "mw_load_fcst"
  ];

  forecastKeys.forEach((forecast) => {
    console.log('Processing forecast:', forecast);
    const actualValues = chartData.map((d) => parseFloat(d.load_act.toString()));
    const predictedValues = chartData.map((d) => parseFloat(d[forecast as keyof ForecastData] as string));

    // Calculate overall RMSE
    const overallRMSE = calculateRMSE(actualValues, predictedValues);

    // Calculate daily RMSE
    const dailyRMSE: { [date: string]: number } = {};
    const groupedByDate = chartData.reduce((acc, curr) => {
      const date = curr.datetime.split(' ')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(curr);
      return acc;
    }, {} as { [date: string]: ForecastData[] });

    Object.entries(groupedByDate).forEach(([date, dayData]) => {
      const dayActual = dayData.map((d) => parseFloat(d.load_act.toString()));
      const dayPredicted = dayData.map((d) => parseFloat(d[forecast as keyof ForecastData] as string));
      dailyRMSE[date] = calculateRMSE(dayActual, dayPredicted);
    });

    stats[forecast] = { overallRMSE, dailyRMSE };
  });

  console.log('Calculated statistics:', stats);
  return stats;
}


export async function processForecasts(
  forecasts: ForecastData[],
  dateRange?: { from: Date; to: Date },
  showHistoricalData?: boolean,
  historicalDaysAhead?: number,
  historicalTime?: string
): Promise<ForecastData[]> {
  console.log('processForecasts input:', {
    forecastCount: forecasts.length,
    dateRange: dateRange ? {
      from: dateRange.from?.toISOString(),
      to: dateRange.to?.toISOString()
    } : null,
    showHistoricalData,
    historicalDaysAhead,
    historicalTime
  });

  let processedForecasts = forecasts;

  if (dateRange && dateRange.from && dateRange.to) {
    console.log('Filtering by date range:', {
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString()
    });
    processedForecasts = processedForecasts.filter(forecast => {
      const forecastDate = new Date(forecast.datetime.replace(' ', 'T'));
      const isInRange = forecastDate >= dateRange.from && forecastDate <= dateRange.to;
      console.log('Forecast date check:', {
        forecastDate: forecastDate.toISOString(),
        isInRange,
        fromDate: dateRange.from.toISOString(),
        toDate: dateRange.to.toISOString()
      });
      return isInRange;
    });
    console.log('Forecasts after date filtering:', processedForecasts.length);
  } else {
    console.log('No date range provided for filtering');
  }

  if (showHistoricalData && historicalDaysAhead !== undefined && historicalTime !== undefined) {
    console.log('Processing historical data');
    // Implement historical data processing if needed
  }

  console.log('Final processed forecasts count:', processedForecasts.length);
  return processedForecasts;
}