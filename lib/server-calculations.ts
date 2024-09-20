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

   const calculateMAPE = (actual: number[], predicted: number[]): number => {
    const validPairs = actual.map((a, i) => [a, predicted[i]])
                             .filter(([a, p]) => !isNaN(a) && !isNaN(p) && a !== 0);
    if (validPairs.length === 0) return NaN;
    
    const sumPercentageErrors = validPairs.reduce((sum, [a, p]) => sum + Math.abs((a - p) / a), 0);
      return (sumPercentageErrors / validPairs.length) * 100;
    };


  const stats: {
    [key: string]: {
      overallRMSE: number;
      overallMAPE: number;
      dailyRMSE: { [date: string]: number };
      dailyMAPE: { [date: string]: number };
    };
  } = {};


   selectedForecasts.forEach((forecast) => {
    const actualValues = chartData.map((d) => d.load_act);
    const predictedValues = chartData.map((d) => d[forecast as keyof ForecastData] as number);

    // Calculate overall RMSE and MAPE
    const overallRMSE = calculateRMSE(actualValues, predictedValues);
    const overallMAPE = calculateMAPE(actualValues, predictedValues);

    // Calculate daily RMSE and MAPE
    const dailyRMSE: { [date: string]: number } = {};
    const dailyMAPE: { [date: string]: number } = {};
    const groupedByDate = chartData.reduce((acc, curr) => {
      if (!acc[curr.date]) acc[curr.date] = [];
      acc[curr.date].push(curr);
      return acc;
    }, {} as { [date: string]: ForecastData[] });


   
     Object.entries(groupedByDate).forEach(([date, dayData]) => {
      const dayActual = dayData.map((d) => d.load_act);
      const dayPredicted = dayData.map((d) => d[forecast as keyof ForecastData] as number);
      dailyRMSE[date] = calculateRMSE(dayActual, dayPredicted);
      dailyMAPE[date] = calculateMAPE(dayActual, dayPredicted);
    });

   stats[forecast] = { overallRMSE, overallMAPE, dailyRMSE, dailyMAPE };
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
      try {

        const dateString = typeof forecast.date === 'number' ? forecast.date as String : forecast.date;
        const year = parseInt(dateString.substring(0, 4));
        const month = parseInt(dateString.substring(4, 6)) - 1; // JS months are 0-indexed
        const day = parseInt(dateString.substring(6, 8));

        const hour = typeof forecast.time === 'number' ? forecast.time : parseInt(forecast.time);
      
        const forecastDate = new Date(Date.UTC(year, month, day, hour));
        
        const isInRange = forecastDate >= dateRange.from && forecastDate <= dateRange.to;
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
    // Filter out `load_act` from historical processings
    const historicalForecasts = processedForecasts.filter(forecast => forecast.toString() !== 'load_act');
    processedForecasts = filterHistoricalData(historicalForecasts, historicalDaysAhead, historicalTime);
  }

  console.log('Final processed forecasts count:', processedForecasts.length);
  return processedForecasts.map(forecast => ({
    ...forecast,
    d_load_fcst: forecast.d_load_fcst,
    j_load_fcst: forecast.j_load_fcst,
    mm_load_fcst: forecast.mm_load_fcst,
    mw_load_fcst: forecast.mw_load_fcst,
    historical_d_load_fcst: forecast.historical_d_load_fcst,
    historical_j_load_fcst: forecast.historical_j_load_fcst,
    historical_mm_load_fcst: forecast.historical_mm_load_fcst,
    historical_mw_load_fcst: forecast.historical_mw_load_fcst,
  }));
}
