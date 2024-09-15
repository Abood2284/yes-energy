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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [statistics, setStatistics] = useState(initialStatistics);
  const [isLoading, setIsLoading] = useState(false);

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
        body: JSON.stringify({ forecasts: initialForecasts, dateRange }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch processed data");
      }
      const data: ProcessedData = await response.json();
      console.log("Processed forecasts:", data.processedForecasts);
      console.log("Statistics:", data.statistics);
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
                </div>
                <Tabs defaultValue="graph">
                  <TabsList>
                    <TabsTrigger value="graph">Graph</TabsTrigger>
                    <TabsTrigger value="statistics">Statistics</TabsTrigger>
                    <TabsTrigger value="spreadsheet">Spreadsheet</TabsTrigger>
                  </TabsList>
                  <TabsContent value="graph">
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="datetime"
                          tickFormatter={(tick) =>
                            new Date(tick).toLocaleDateString()
                          }
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
                            connectNulls={true}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
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
                            <TableCell>
                              {stats.overallRMSE.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <h3 className="text-lg font-semibold mt-6 mb-2">
                      Daily RMSE
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          {selectedForecasts
                            .filter((f) => f !== "load_act")
                            .map((forecast) => (
                              <TableHead key={forecast}>
                                {forecast.replace("_", " ").toUpperCase()}
                              </TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.keys(
                          statistics[selectedForecasts[1]]?.dailyRMSE || {}
                        ).map((date) => (
                          <TableRow key={date}>
                            <TableCell>{date}</TableCell>
                            {selectedForecasts
                              .filter((f) => f !== "load_act")
                              .map((forecast) => (
                                <TableCell key={forecast}>
                                  {statistics[forecast]?.dailyRMSE[
                                    date
                                  ].toFixed(2)}
                                </TableCell>
                              ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="spreadsheet">
                    <div
                      style={{
                        width: "100%",
                        overflowX: "auto",
                        borderLeft: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${
                            selectedForecasts.length + 2
                          }, 1fr)`,
                          borderBottom: "2px solid #e2e8f0",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <SpreadsheetCell isHeader>Date</SpreadsheetCell>
                        <SpreadsheetCell isHeader>Time</SpreadsheetCell>
                        {selectedForecasts.map((forecast) => (
                          <SpreadsheetCell key={forecast} isHeader>
                            {forecast.replace("_", " ").toUpperCase()}
                          </SpreadsheetCell>
                        ))}
                      </div>
                      <List
                        height={400}
                        itemCount={paginatedData.length}
                        itemSize={35}
                        width="100%"
                        style={{ overflowX: "hidden" }}
                      >
                        {VirtualizedRow}
                      </List>
                    </div>
                    <div className="flex justify-between mt-4">
                      <Button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span>
                        Page {currentPage} of{" "}
                        {Math.ceil(filteredData.length / itemsPerPage)}
                      </span>
                      <Button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(
                              prev + 1,
                              Math.ceil(filteredData.length / itemsPerPage)
                            )
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil(filteredData.length / itemsPerPage)
                        }
                      >
                        Next
                      </Button>
                    </div>
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
