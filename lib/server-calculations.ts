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
    const forecastDate = new Date(Date.UTC(
      parseInt(forecast.date.substring(0, 4)),
      parseInt(forecast.date.substring(4, 6)) - 1,
      parseInt(forecast.date.substring(6, 8)),
      parseInt(forecast.time)
    ));
    const forecastHour = forecastDate.getUTCHours();
    const forecastMinute = forecastDate.getUTCMinutes();

    // Check if the forecast time is just before the specified time
    if (
      forecastHour < filterHour ||
      (forecastHour === filterHour && forecastMinute < filterMinute)
    ) {
      // Calculate the date for 'daysAhead' days before the forecast date
      const historicalDate = new Date(forecastDate);
      historicalDate.setUTCDate(historicalDate.getUTCDate() - daysAhead);

      // Find the latest forecast made on or before the historical date
      const latestHistoricalForecast = forecasts.find(f => {
        const fDate = new Date(Date.UTC(
          parseInt(f.date.substring(0, 4)),
          parseInt(f.date.substring(4, 6)) - 1,
          parseInt(f.date.substring(6, 8)),
          parseInt(f.time)
        ));
        return fDate <= historicalDate && fDate.getUTCDate() === historicalDate.getUTCDate();
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

export async function calculateStatistics(chartData: ForecastData[], selectedForecasts: string[]) {
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

  selectedForecasts.forEach((forecast) => {
    if (forecast === 'load_act') return; // Skip load_act as it's the actual value

    console.log('Processing forecast:', forecast);
    const actualValues = chartData.map((d) => d.load_act);
    const predictedValues = chartData.map((d) => d[forecast as keyof ForecastData] as number);

    // Calculate overall RMSE
    const overallRMSE = calculateRMSE(actualValues, predictedValues);

    // Calculate daily RMSE
    const dailyRMSE: { [date: string]: number } = {};
    const groupedByDate = chartData.reduce((acc, curr) => {
      if (!acc[curr.date]) acc[curr.date] = [];
      acc[curr.date].push(curr);
      return acc;
    }, {} as { [date: string]: ForecastData[] });

    Object.entries(groupedByDate).forEach(([date, dayData]) => {
      const dayActual = dayData.map((d) => d.load_act);
      const dayPredicted = dayData.map((d) => d[forecast as keyof ForecastData] as number);
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
      console.log('Processing forecast:', { date: forecast.date, time: forecast.time });
      try {
        const year = parseInt(forecast.date.substring(0, 4));
        const month = parseInt(forecast.date.substring(4, 6)) - 1; // JS months are 0-indexed
        const day = parseInt(forecast.date.substring(6, 8));
        const hour = parseInt(forecast.time);

        console.log('Parsed components:', { year, month, day, hour });
        
        const forecastDate = new Date(Date.UTC(year, month, day, hour));
        console.log('Created Date object:', forecastDate.toISOString());
        
        const isInRange = forecastDate >= dateRange.from && forecastDate <= dateRange.to;
        console.log('Is in range:', isInRange);
        return isInRange;
      } catch (error) {
        console.error('Error processing forecast:', { date: forecast.date, time: forecast.time }, error);
        return false;
      }
    });
    console.log('Forecasts after date filtering:', processedForecasts.length);
  } else {
    console.log('No date range provided for filtering');
  }

  if (showHistoricalData && historicalDaysAhead !== undefined && historicalTime !== undefined) {
    console.log('Processing historical data');
    processedForecasts = filterHistoricalData(processedForecasts, historicalDaysAhead, historicalTime);
  }

  console.log('Final processed forecasts count:', processedForecasts.length);
  return processedForecasts;
}