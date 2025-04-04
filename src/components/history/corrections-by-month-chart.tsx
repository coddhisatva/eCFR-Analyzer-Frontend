"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type MonthlyData = {
  month: string;
  count: number;
};

export function CorrectionsByMonthChart() {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [data, setData] = useState<MonthlyData[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/corrections/analytics?year=${selectedYear}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        
        // Process the monthly data
        const monthlyData = Object.entries(result.correctionsByMonth)
          .filter(([date]) => date.startsWith(selectedYear))
          .map(([date, count]) => ({
            month: new Date(date).toLocaleString('default', { month: 'short' }),
            count: count as number
          }))
          .sort((a, b) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months.indexOf(a.month) - months.indexOf(b.month);
          });

        // Get unique years from the data
        const years = [...new Set(Object.keys(result.correctionsByMonth)
          .map(date => date.substring(0, 4)))]
          .sort((a, b) => b.localeCompare(a));

        setAvailableYears(years);
        setData(monthlyData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [selectedYear]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Corrections by Month</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Corrections by Month</CardTitle>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 