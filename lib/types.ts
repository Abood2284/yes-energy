export interface ForecastData {
  datetime: string;
  load_act: number;
  d_load_fcst: number | null;
  d_revision: string;  // Changed from string | null to string
  allRevisions: Array<{ load_fcst: number; revision: string }>;  // Changed revision from string | null to string
}