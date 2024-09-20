"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "./date-picker-with-range";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ForecastData, ProcessedData } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { format } from "date-fns";

interface ForecastDashboardProps {
  initialForecasts: ForecastData[];
  initialStatistics: {
    [key: string]: {
      overallRMSE: number;
      overallMAPE: number;
      dailyRMSE: { [date: string]: number };
      dailyMAPE: { [date: string]: number };
    };
  };
}

export default function ForecastDashboard({
  initialForecasts = [],
  initialStatistics = {},
}: ForecastDashboardProps) {
  const [baselineChartData, setBaselineChartData] = useState(initialForecasts);
  const [historicalChartData, setHistoricalChartData] = useState<
    ForecastData[]
  >([]);

  const colors = {
    load_act: "#8884d8",
    d_load_fcst: "#82ca9d",
    j_load_fcst: "#ffc658",
    mm_load_fcst: "#ff7300",
    mw_load_fcst: "#0088FE",
  };

  const getHistoricalColor = (baseColor: string) => {
    // Function to create a lighter shade of the base color
    const lightenColor = (color: string, amount: number) => {
      return color.replace(/^#/, "").replace(/.{2}/g, (c: string) => {
        const num = Math.min(255, Math.max(0, parseInt(c, 16) + amount));
        return num.toString(16).padStart(2, "0");
      });
    };
    return `#${lightenColor(baseColor, 40)}`;
  };

  const [selectedForecasts, setSelectedForecasts] = useState<string[]>([
    "load_act",
    "d_load_fcst",
    "j_load_fcst",
    "mm_load_fcst",
    "mw_load_fcst",
  ]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (initialForecasts.length > 0) {
      return {
        from: new Date(
          Date.UTC(
            parseInt(initialForecasts[0].date.substring(0, 4)),
            parseInt(initialForecasts[0].date.substring(4, 6)) - 1,
            parseInt(initialForecasts[0].date.substring(6, 8)),
            parseInt(initialForecasts[0].time)
          )
        ),
        to: new Date(
          Date.UTC(
            parseInt(
              initialForecasts[initialForecasts.length - 1].date.substring(0, 4)
            ),
            parseInt(
              initialForecasts[initialForecasts.length - 1].date.substring(4, 6)
            ) - 1,
            parseInt(
              initialForecasts[initialForecasts.length - 1].date.substring(6, 8)
            ),
            parseInt(initialForecasts[initialForecasts.length - 1].time)
          )
        ),
      };
    }
    return undefined;
  });
  const [chartData, setChartData] = useState(initialForecasts);
  const [statistics, setStatistics] = useState(initialStatistics);
  const [isLoading, setIsLoading] = useState(false);

  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [historicalDaysAhead, setHistoricalDaysAhead] = useState("1");
  const [historicalTime, setHistoricalTime] = useState("13:00");

  const filteredData = useMemo(() => {
    return chartData
      .filter((data) => {
        const date = new Date(
          Date.UTC(
            parseInt(data.date.substring(0, 4)),
            parseInt(data.date.substring(4, 6)) - 1,
            parseInt(data.date.substring(6, 8)),
            parseInt(data.time)
          )
        );
        return (
          (!dateRange?.from || date >= dateRange.from) &&
          (!dateRange?.to || date <= dateRange.to)
        );
      })
      .map((data) => {
        const filteredDataPoint: Partial<ForecastData> = {
          date: data.date,
          time: data.time,
        };
        selectedForecasts.forEach((forecast) => {
          if (forecast in data) {
            (filteredDataPoint as any)[forecast] =
              data[forecast as keyof ForecastData];
          }
        });
        return filteredDataPoint as ForecastData;
      });
  }, [chartData, dateRange, selectedForecasts]);

  const calculateYAxisDomain = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    filteredData.forEach((data) => {
      selectedForecasts.forEach((forecast) => {
        const value = Number(data[forecast as keyof ForecastData]);
        if (!isNaN(value)) {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
    });

    // Add some padding to the min and max
    const padding = (max - min) * 0.1;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [filteredData, selectedForecasts]);

  const handleForecastToggle = (forecast: string) => {
    setSelectedForecasts((prev) =>
      prev.includes(forecast)
        ? prev.filter((f) => f !== forecast)
        : [...prev, forecast]
    );
  };

  const updateChartData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/process-forecasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRange,
          showHistoricalData,
          historicalDaysAhead: parseInt(historicalDaysAhead),
          historicalTime,
          selectedForecasts,
        }),
      });
      if (!response.ok) throw new Error("Failed to fetch processed data");
      const data: ProcessedData = await response.json();
      console.log("API Response:", data);

      setBaselineChartData(data.processedForecasts || []);
      setHistoricalChartData(data.processedForecasts || []);
      setStatistics(data.statistics);

      setChartData(data.processedForecasts);

      console.log("Baseline Chart Data:", data.processedForecasts);
      console.log("Historical Chart Data:", data.processedForecasts);

      // Log a few sample entries to verify the date and time
      const sampleEntries = data.processedForecasts.slice(0, 5);
      sampleEntries.forEach((entry, index) => {
        if (entry.load_act) return;
        console.log(`Sample Historical Entry ${index + 1}:`, {
          date: entry.date,
          time: entry.time,
        });
      });
    } catch (error) {
      console.error("Error updating chart data:", error);
      setBaselineChartData([]);
      setHistoricalChartData([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    dateRange,
    showHistoricalData,
    historicalDaysAhead,
    historicalTime,
    selectedForecasts,
  ]);

  const combinedChartData = useMemo(() => {
    return baselineChartData.map((baseline) => {
      const historical = historicalChartData.find(
        (h) => h.date === baseline.date && h.time === baseline.time
      );
      return { ...baseline, ...historical };
    });
  }, [baselineChartData, historicalChartData]);

  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  useEffect(() => {
    console.log("Initial forecasts:", initialForecasts);
    console.log("Initial statistics:", initialStatistics);
  }, [initialForecasts, initialStatistics]);

  const chartWidth = useMemo(() => {
    // Calculate a width based on the number of data points
    // You can adjust the multiplier (20) to change the density of the chart
    return Math.max(filteredData.length * 20, 1000); // Minimum width of 1000px
  }, [filteredData]);

  const renderForecastLines = () => {
    return selectedForecasts.flatMap((forecast) => {
      const baseColor = colors[forecast as keyof typeof colors];
      const lines = [
        <Line
          key={forecast}
          type="monotone"
          dataKey={forecast}
          stroke={baseColor}
          name={forecast.replace("_", " ").toUpperCase()}
          dot={false}
        />,
      ];

      if (showHistoricalData && forecast !== "load_act") {
        const historicalKey = `historical_${forecast}`;
        lines.push(
          <Line
            key={historicalKey}
            type="monotone"
            dataKey={historicalKey}
            stroke={getHistoricalColor(baseColor)}
            name={`HISTORICAL ${forecast.replace("_", " ").toUpperCase()}`}
            strokeDasharray="5 5"
            dot={false}
          />
        );
      }
      return lines;
    });
  };

  const renderSpreadsheet = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="sticky top-0 bg-white z-10">DateTime</TableHead>
          {selectedForecasts.map((forecast) => (
            <TableHead key={forecast} className="sticky top-0 bg-white z-10">
              {forecast.replace("_", " ").toUpperCase()}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.map((data, index) => (
          <TableRow key={index} className="hover:bg-gray-100">
            <TableCell className="font-medium">
              {createDateFromForecast(data).toLocaleString()}
            </TableCell>
            {selectedForecasts.map((forecast) => (
              <TableCell key={forecast}>
                {formatCellValue(data[forecast as keyof ForecastData])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderStatistics = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Forecast</TableHead>
          <TableHead>Overall RMSE</TableHead>
          <TableHead>Overall MAPE</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {selectedForecasts.map(
          (forecast) =>
            statistics[forecast] && (
              <TableRow key={forecast}>
                <TableCell>
                  {forecast.replace("_", " ").toUpperCase()}
                </TableCell>
                <TableCell>
                  {statistics[forecast].overallRMSE.toFixed(2)}
                </TableCell>
                <TableCell>
                  {statistics[forecast].overallMAPE.toFixed(2)}%
                </TableCell>
              </TableRow>
            )
        )}
      </TableBody>
    </Table>
  );

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    return typeof value === "number" ? value.toFixed(2) : String(value);
  };

  const formatTooltipValue = (value: any, name: string, props: any) => {
    const formattedValue = formatCellValue(value);
    return [formattedValue, name];
  };

  useEffect(() => {
    updateChartData();
  }, [
    dateRange,
    showHistoricalData,
    historicalDaysAhead,
    historicalTime,
    updateChartData,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading data...</span>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const [date, time] = label.split(" ");
      const formattedDate = createDateFromForecast({
        date,
        time,
      } as ForecastData);

      return (
        <div className="custom-tooltip bg-white p-3 border border-gray-300 rounded shadow">
          <p className="label font-bold">{`${format(
            formattedDate,
            "MMM dd, yyyy HH:mm"
          )}`}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.color }}>
              {`${pld.name}: ${pld.value}`}
            </p>
          ))}
        </div>
      );
    }

    return null;
  };

  // Utility function to create a Date object from ForecastData
  function createDateFromForecast(forecast: ForecastData): Date {
    const year = parseInt(forecast.date.substring(0, 4));
    const month = parseInt(forecast.date.substring(4, 6)) - 1; // Correct: JS months are 0-indexed
    const day = parseInt(forecast.date.substring(6, 8));

    // Parse time correctly
    const hour = Math.floor(parseInt(forecast.time) / 100);
    const minute = parseInt(forecast.time) % 100;

    return new Date(Date.UTC(year, month, day, hour, minute));
  }

  // In your ForecastDashboard component
  const xAxisTickFormatter = (dateString: string) => {
    const [date, time] = dateString.split(" ");
    const parsedDate = createDateFromForecast({ date, time } as ForecastData);
    return format(parsedDate, "MM/dd/yyyy"); // Or any format you prefer
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Load Forecast Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Forecasts</h3>
                {[
                  "load_act",
                  "d_load_fcst",
                  "j_load_fcst",
                  "mm_load_fcst",
                  "mw_load_fcst",
                ].map((forecast) => (
                  <div key={forecast} className="flex items-center space-x-2">
                    <Checkbox
                      id={forecast}
                      checked={selectedForecasts.includes(forecast)}
                      onCheckedChange={() => handleForecastToggle(forecast)}
                    />
                    <label htmlFor={forecast}>
                      {forecast.replace("_", " ").toUpperCase()}
                    </label>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Date Range</h3>
                <DatePickerWithRange
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Historical Data</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="showHistoricalData"
                    checked={showHistoricalData}
                    onCheckedChange={(checked) =>
                      setShowHistoricalData(checked as boolean)
                    }
                  />
                  <label htmlFor="showHistoricalData">
                    Show Historical Forecast
                  </label>
                </div>
                {showHistoricalData && (
                  <>
                    <Select
                      value={historicalDaysAhead}
                      onValueChange={setHistoricalDaysAhead}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Days Ahead" />
                      </SelectTrigger>
                      <SelectContent>
                        {["0", "1", "2", "3", "4", "5", "6", "7"].map((day) => (
                          <SelectItem key={day} value={day}>
                            {day} {day === "1" ? "Day" : "Days"} Ahead
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={historicalTime}
                      onChange={(e) => setHistoricalTime(e.target.value)}
                      className="mt-2"
                    />
                  </>
                )}
              </div>
            </div>
            <Tabs defaultValue="graph">
              <TabsList>
                <TabsTrigger value="graph">Graph</TabsTrigger>
                <TabsTrigger value="spreadsheet">Spreadsheet</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
              </TabsList>
              <TabsContent value="graph">
                <ScrollArea className="w-full">
                  <div style={{ width: `${chartWidth}px`, height: "400px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey={(v) => `${v.date} ${v.time}`}
                          tickFormatter={xAxisTickFormatter}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          domain={calculateYAxisDomain}
                          label={{
                            value: "Load (MW)",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        {renderForecastLines()}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="spreadsheet">
                <ScrollArea className="h-[400px] w-full border rounded-md">
                  {renderSpreadsheet()}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="statistics">{renderStatistics()}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
