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
import { ForecastData } from "@/lib/types";
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
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE"];
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
  const [statistics, setStatistics] = useState(initialStatistics);
  const [isLoading, setIsLoading] = useState(false);

  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [historicalDaysAhead, setHistoricalDaysAhead] = useState("1");
  const [historicalTime, setHistoricalTime] = useState("13:00");

  const filteredData = useMemo(() => {
    return chartData.filter((data) => {
      const date = new Date(data.datetime);
      return (
        (!dateRange?.from || date >= dateRange.from) &&
        (!dateRange?.to || date <= dateRange.to)
      );
    });
  }, [chartData, dateRange]);

  const chartWidth = useMemo(() => {
    // Calculate a width based on the number of data points
    // You can adjust the multiplier (20) to change the density of the chart
    return Math.max(filteredData.length * 20, 1000); // Minimum width of 1000px
  }, [filteredData]);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          forecasts: initialForecasts,
          dateRange,
          showHistoricalData,
          historicalDaysAhead,
          historicalTime,
          selectedForecasts,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch processed data");
      }
      const data: ProcessedData = await response.json();
      setChartData(data.processedForecasts);
      setStatistics(data.statistics);
    } catch (error) {
      console.error("Error updating chart data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    initialForecasts,
    dateRange,
    showHistoricalData,
    historicalDaysAhead,
    historicalTime,
    selectedForecasts,
  ]);

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
                      <LineChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="datetime"
                          tickFormatter={(tick) =>
                            new Date(tick).toLocaleDateString()
                          }
                          interval="preserveStartEnd"
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(label) =>
                            new Date(label).toLocaleString()
                          }
                        />
                        <Legend />
                        {selectedForecasts.map((forecast, index) => (
                          <Line
                            key={forecast}
                            type="monotone"
                            dataKey={forecast}
                            stroke={colors[index % colors.length]}
                            activeDot={{ r: 8 }}
                            name={forecast.replace("_", " ").toUpperCase()}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="spreadsheet">
                <ScrollArea className="h-[400px] w-full border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 bg-white z-10">
                          DateTime
                        </TableHead>
                        {selectedForecasts.map((forecast) => (
                          <TableHead
                            key={forecast}
                            className="sticky top-0 bg-white z-10"
                          >
                            {forecast.replace("_", " ").toUpperCase()}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((data, index) => (
                        <TableRow key={index} className="hover:bg-gray-100">
                          <TableCell className="font-medium">
                            {new Date(data.datetime).toLocaleString()}
                          </TableCell>
                          {selectedForecasts.map((forecast) => (
                            <TableCell key={forecast}>
                              {(() => {
                                const value =
                                  data[forecast as keyof ForecastData];
                                if (typeof value === "number") {
                                  return value.toFixed(2);
                                } else if (typeof value === "string") {
                                  return value;
                                } else {
                                  return "N/A";
                                }
                              })()}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="statistics">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Forecast</TableHead>
                      <TableHead>Overall RMSE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(statistics).map(([forecast, stats]) => (
                      <TableRow key={forecast}>
                        <TableCell>
                          {forecast.replace("_", " ").toUpperCase()}
                        </TableCell>
                        <TableCell>{stats.overallRMSE.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
