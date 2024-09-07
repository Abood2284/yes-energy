"use client";

import React, { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ForecastData } from "@/lib/types";

interface ForecastDashboardProps {
  initialForecasts: ForecastData[];
}

export default function ForecastDashboard({
  initialForecasts,
}: ForecastDashboardProps) {
  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE"];
  const [selectedForecasts, setSelectedForecasts] = useState<string[]>([
    "load_act",
    "d_load_fcst",
    "j_load_fcst",
    "mm_load_fcst",
    "mw_load_fcst",
  ]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(initialForecasts[0].datetime),
    to: new Date(initialForecasts[initialForecasts.length - 1].datetime),
  });
  const [chartData, setChartData] = useState(initialForecasts);

  useEffect(() => {
    updateChartData();
  }, [dateRange]);

  const handleForecastToggle = (forecast: string) => {
    setSelectedForecasts((prev) =>
      prev.includes(forecast)
        ? prev.filter((f) => f !== forecast)
        : [...prev, forecast]
    );
  };

  const updateChartData = () => {
    if (!dateRange || !dateRange.from || !dateRange.to) {
      setChartData(initialForecasts);
      return;
    }

    const filteredData = initialForecasts.filter((d) => {
      const date = new Date(d.datetime);
      return date >= dateRange.from! && date <= dateRange.to!;
    });

    setChartData(filteredData);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Load Forecast Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="graph">
              <TabsList>
                <TabsTrigger value="graph">Graph</TabsTrigger>
                <TabsTrigger value="statistics">Statistics</TabsTrigger>
              </TabsList>
              <TabsContent value="graph">
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
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="datetime" />
                    <YAxis />
                    <Tooltip />
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
                {/* Implement statistics display here */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
