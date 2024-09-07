export interface ForecastData {
  datetime: string;
  load_act: number;
  d_load_fcst: number | null;
  j_load_fcst: number | null;
  mm_load_fcst: number | null;
  mw_load_fcst: number | null;
}
