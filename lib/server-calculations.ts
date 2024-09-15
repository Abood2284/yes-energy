import { ForecastData } from "@/lib/types";

export async function calculateStatistics(chartData: ForecastData[]) {
  const calculateRMSE = (actual: number[], predicted: number[]): number => {
    if (actual.length !== predicted.length) return NaN;
    const squaredErrors = actual.map((value, index) =>
      Math.pow(value - predicted[index], 2)
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

  const forecastKeys = ["d_load_fcst", "j_load_fcst", "mm_load_fcst", "mw_load_fcst"];

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

export async function processForecasts(forecastData: ForecastData[], dateRange?: { from: Date; to: Date }) {
  let filteredData = forecastData;

  if (dateRange && dateRange.from && dateRange.to) {
    filteredData = filteredData.filter((d) => {
      const date = new Date(d.datetime);
      return date >= dateRange.from! && date <= dateRange.to!;
    });
  }

  return filteredData;
}