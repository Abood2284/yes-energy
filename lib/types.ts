export interface ForecastData {
  datetime: string;
  load_act: number;
  d_load_fcst: number | null;
  j_load_fcst: number | null;
  mm_load_fcst: number | null;
  mw_load_fcst: number | null;
  historical_d_load_fcst?: number | null;
  historical_j_load_fcst?: number | null;
  historical_mm_load_fcst?: number | null;
  historical_mw_load_fcst?: number | null;
}
export interface ProcessedData {
  processedForecasts: ForecastData[];
  statistics: {
    [key: string]: {
      overallRMSE: number;
      dailyRMSE: { [date: string]: number };
    };
  };
}