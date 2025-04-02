"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Calendar, Clock, FileText } from "lucide-react";
import { DateRange } from "react-day-picker";

interface Correction {
  id: string;
  error_occurred: string;
  error_corrected: string;
  correction_description: string;
  nodes: {
    title: string;
    agencies: {
      name: string;
      abbreviation: string;
    };
  };
}

interface Analytics {
  totalCorrections: number;
  averageDuration: number;
  mostActiveMonth: {
    month: string;
    count: number;
  };
  longestCorrection: {
    duration: number;
    title: string;
    agency: string;
  };
  correctionsByMonth: Record<string, number>;
}

export default function HistoryPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedAgency, setSelectedAgency] = useState<string>("");
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedAgency, selectedTitle]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange?.from) {
        params.append("startDate", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append("endDate", dateRange.to.toISOString());
      }
      if (selectedAgency) {
        params.append("agency", selectedAgency);
      }
      if (selectedTitle) {
        params.append("title", selectedTitle);
      }

      const response = await fetch(`/api/corrections?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setCorrections(data.corrections);
        setAnalytics(data.analytics);
      } else {
        console.error("Error fetching data:", data.error);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Correction History</h1>
      </div>

      {/* Analytics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Corrections
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : analytics?.totalCorrections.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all agencies and titles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Average Duration
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${analytics?.averageDuration} days`}
            </div>
            <p className="text-xs text-muted-foreground">
              To fix an error
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Most Active Month
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : analytics?.mostActiveMonth.month}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "..." : `${analytics?.mostActiveMonth.count} corrections`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Longest Duration
            </CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${analytics?.longestCorrection.duration} years`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "..." : analytics?.longestCorrection.title}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Corrections Over Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Corrections Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {/* Chart will go here */}
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                {loading ? "Loading..." : "Chart: Corrections by Month"}
              </div>
            </CardContent>
          </Card>

          {/* Duration Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Correction Duration Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {/* Chart will go here */}
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                {loading ? "Loading..." : "Chart: Duration Distribution"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Filters Section */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Search Corrections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Agency</label>
              <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agencies</SelectItem>
                  <SelectItem value="EPA">Environmental Protection Agency</SelectItem>
                  <SelectItem value="DOT">Department of Transportation</SelectItem>
                  <SelectItem value="DOL">Department of Labor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Select value={selectedTitle} onValueChange={setSelectedTitle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Titles</SelectItem>
                  <SelectItem value="40">Title 40 - Protection of Environment</SelectItem>
                  <SelectItem value="49">Title 49 - Transportation</SelectItem>
                  <SelectItem value="29">Title 29 - Labor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Search Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8">Loading corrections...</div>
          ) : corrections.length === 0 ? (
            <div className="col-span-full text-center py-8">No corrections found</div>
          ) : (
            corrections.map((correction) => (
              <Card key={correction.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{correction.nodes.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {correction.nodes.agencies.name}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Error Occurred:</span>
                      <span>{new Date(correction.error_occurred).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>
                        {Math.round(
                          (new Date(correction.error_corrected).getTime() -
                            new Date(correction.error_occurred).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </span>
                    </div>
                    <div className="text-sm mt-2">
                      <p className="text-muted-foreground">Correction:</p>
                      <p className="mt-1">{correction.correction_description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 