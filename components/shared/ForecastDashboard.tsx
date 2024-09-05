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
  ]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(initialForecasts[0].datetime),
    to: new Date(initialForecasts[initialForecasts.length - 1].datetime),
  });
  const [chartData, setChartData] = useState(initialForecasts);
  const [historicForecastDays, setHistoricForecastDays] = useState<number>(1);

  const [historicForecastTime, setHistoricForecastTime] =
    useState<string>("09:00");
  useEffect(() => {
    if (initialForecasts.length > 0) {
      const firstDate = new Date(initialForecasts[0].datetime);
      const lastDate = new Date(
        initialForecasts[initialForecasts.length - 1].datetime
      );
      setDateRange({ from: firstDate, to: lastDate });
    } else {
      // If there are no forecasts, set a default date range (e.g., today and 7 days from now)
      const today = new Date();
      const sevenDaysLater = new Date(
        today.getTime() + 7 * 24 * 60 * 60 * 1000
      );
      setDateRange({ from: today, to: sevenDaysLater });
    }
  }, [initialForecasts]);

  useEffect(() => {
    updateChartData();
  }, [dateRange, historicForecastDays, historicForecastTime]);

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
      return (
        dateRange?.from &&
        dateRange?.to &&
        date >= dateRange.from &&
        date <= dateRange.to
      );
    });

    const processedData = filteredData.map((d) => {
      const historicForecast = getHistoricForecast(
        d,
        historicForecastDays,
        historicForecastTime
      );
      return {
        ...d,
        historic_forecast: historicForecast,
      };
    });

    setChartData(processedData);
  };

  const getHistoricForecast = (
    data: ForecastData,
    days: number,
    time: string
  ) => {
    const [hours, minutes] = time.split(":").map(Number);
    const forecastDate = new Date(data.datetime);
    const targetDate = new Date(forecastDate);
    targetDate.setDate(targetDate.getDate() - days);
    targetDate.setHours(hours, minutes, 0, 0);

    const relevantRevision = data.allRevisions.find((rev) => {
      const revisionDate = new Date(rev.revision);
      return revisionDate <= targetDate && revisionDate <= forecastDate;
    });

    return relevantRevision ? relevantRevision.load_fcst : null;
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
                    {["load_act", "d_load_fcst", "historic_forecast"].map(
                      (forecast) => (
                        <div
                          key={forecast}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={forecast}
                            checked={selectedForecasts.includes(forecast)}
                            onCheckedChange={() =>
                              handleForecastToggle(forecast)
                            }
                          />
                          <label htmlFor={forecast}>
                            {forecast.replace("_", " ").toUpperCase()}
                          </label>
                        </div>
                      )
                    )}
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
                      Historic Forecast
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={historicForecastDays}
                        onChange={(e) =>
                          setHistoricForecastDays(Number(e.target.value))
                        }
                        className="w-20"
                      />
                      <span>days ahead at</span>
                      <Input
                        type="time"
                        value={historicForecastTime}
                        onChange={(e) =>
                          setHistoricForecastTime(e.target.value)
                        }
                        className="w-24"
                      />
                    </div>
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
