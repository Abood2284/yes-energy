"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
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
import { ForecastData } from "@/lib/types";
import { Loader2 } from "lucide-react"; // Import a loader icon

interface ForecastDashboardProps {
  initialForecasts: ForecastData[];
  initialStatistics: {
    [key: string]: {
      overallRMSE: number;
      dailyRMSE: { [date: string]: number };
    };
  };
}

interface ProcessedData {
  processedForecasts: ForecastData[];
  statistics: {
    [key: string]: {
      overallRMSE: number;
      dailyRMSE: { [date: string]: number };
    };
  };
}

export default function ForecastDashboard({
  initialForecasts = [],
  initialStatistics = {},
}: ForecastDashboardProps) {
  const baselineColors = {
    load_act: "#FF0000",
    d_load_fcst: "#00FF00",
    j_load_fcst: "#0000FF",
    mm_load_fcst: "#FFFF00",
    mw_load_fcst: "#FF00FF",
  };
  const historicalColors = {
    d_load_fcst: "#00AA00",
    j_load_fcst: "#0000AA",
    mm_load_fcst: "#AAAA00",
    mw_load_fcst: "#AA00AA",
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
        from: new Date(initialForecasts[0].datetime),
        to: new Date(initialForecasts[initialForecasts.length - 1].datetime),
      };
    }
    return undefined;
  });
  const [chartData, setChartData] = useState(initialForecasts);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [statistics, setStatistics] = useState(initialStatistics);
  const [isLoading, setIsLoading] = useState(false);

  const [forecastType, setForecastType] = useState<"baseline" | "historical">(
    "baseline"
  );
  const [historicalDaysAhead, setHistoricalDaysAhead] = useState<string>("1");
  const [historicalTime, setHistoricalTime] = useState<string>("13:00");
  const [showHistoricalData, setShowHistoricalData] = useState<boolean>(false);

  const filteredData = useMemo(() => {
    return chartData.filter((data) => {
      const date = new Date(data.datetime);
      return (
        (!dateRange?.from || date >= dateRange.from) &&
        (!dateRange?.to || date <= dateRange.to)
      );
    });
  }, [chartData, dateRange]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => {
    updateChartData();
  }, [dateRange, selectedForecasts]);

  const handleForecastToggle = (forecast: string) => {
    setSelectedForecasts((prev) =>
      prev.includes(forecast)
        ? prev.filter((f) => f !== forecast)
        : [...prev, forecast]
    );
  };

  const updateChartData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/process-forecasts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          forecasts: initialForecasts,
          dateRange,
          forecastType,
          historicalDaysAhead: showHistoricalData
            ? historicalDaysAhead
            : undefined,
          historicalTime: showHistoricalData ? historicalTime : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch processed data");
      }
      const data: ProcessedData = await response.json();
      setChartData(data.processedForecasts);
      setStatistics(data.statistics);
      setCurrentPage(1); // Reset to first page when data updates
    } catch (error) {
      console.error("Error updating chart data:", error);
      // Handle the error appropriately (e.g., show an error message to the user)
    } finally {
      setIsLoading(false);
    }
  };

  const SpreadsheetCell = ({
    children,
    isHeader = false,
  }: {
    children: React.ReactNode;
    isHeader?: boolean;
  }) => (
    <div
      style={{
        padding: "8px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        borderRight: "1px solid #e2e8f0",
        fontWeight: isHeader ? "bold" : "normal",
      }}
    >
      {children}
    </div>
  );

  const VirtualizedRow = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const data = paginatedData[index];
    const totalColumns = selectedForecasts.length + 2; // +2 for date and time columns
    return (
      <div
        style={{
          ...style,
          display: "grid",
          gridTemplateColumns: `repeat(${totalColumns}, 1fr)`,
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <SpreadsheetCell>
          {new Date(data.datetime).toLocaleDateString()}
        </SpreadsheetCell>
        <SpreadsheetCell>
          {new Date(data.datetime).toLocaleTimeString()}
        </SpreadsheetCell>
        {selectedForecasts.map((forecast) => (
          <SpreadsheetCell key={forecast}>
            {data[forecast as keyof ForecastData]}
          </SpreadsheetCell>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Load Forecast Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-lg font-semibold mb-4">
                  No forecast data available for the selected date range
                </p>
                <p>
                  Please adjust the date range or ensure data is available for
                  the selected period.
                </p>
              </div>
            ) : (
              <>
                <div className="flex space-x-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Select Forecasts
                    </h3>
                    {[
                      "load_act",
                      "d_load_fcst",
                      "j_load_fcst",
                      "mm_load_fcst",
                      "mw_load_fcst",
                    ].map((forecast) => (
                      <div
                        key={forecast}
                        className="flex items-center space-x-2"
                      >
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
                    <h3 className="text-lg font-semibold mb-2">
                      Historical Data
                    </h3>
                    <Checkbox
                      id="showHistoricalData"
                      checked={showHistoricalData}
                      onCheckedChange={(checked) =>
                        setShowHistoricalData(checked as boolean)
                      }
                    />
                    <Label htmlFor="showHistoricalData">
                      Show Historical Data
                    </Label>
                    {showHistoricalData && (
                      <>
                        <Select
                          value={historicalDaysAhead}
                          onValueChange={setHistoricalDaysAhead}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Days Ahead" />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((days) => (
                              <SelectItem key={days} value={days.toString()}>
                                {days} Day{days !== 1 ? "s" : ""} Ahead
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="time"
                          value={historicalTime}
                          onChange={(e) => setHistoricalTime(e.target.value)}
                        />
                      </>
                    )}
                  </div>
                </div>
                <Tabs defaultValue="graph">
                  <TabsList>
                    <TabsTrigger value="graph">Graph</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                    <TabsTrigger value="spreadsheet">Spreadsheet</TabsTrigger>
                  </TabsList>
                  <TabsContent value="graph">{renderLineChart()}</TabsContent>
                  <TabsContent value="statistics">
                    {/* ... (statistics content remains the same) */}
                  </TabsContent>
                  <TabsContent value="spreadsheet">
                    {/* ... (spreadsheet content remains the same) */}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
