"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart as BarChartIcon, Calendar, Clock, FileText } from "lucide-react";
import { DateRange } from "react-day-picker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface FilterOption {
  value: string;
  label: string;
  abbreviation?: string;
}

export default function HistoryPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedAgency, setSelectedAgency] = useState<string>("");
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<FilterOption[]>([]);
  const [titles, setTitles] = useState<FilterOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedAgency, selectedTitle]);

  const fetchData = async () => {
    try {
      console.group('History Page Data Fetch');
      console.log('Fetching with params:', { startDate: dateRange?.from, endDate: dateRange?.to, selectedAgency, selectedTitle });
      
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());
      if (selectedAgency && selectedAgency !== "all") params.append('agency', selectedAgency);
      if (selectedTitle && selectedTitle !== "all") params.append('title', selectedTitle);
      
      const response = await fetch(`/api/corrections?${params}`);
      console.log('Response status:', response.status);
      
      const text = await response.text();
      console.log('Raw response:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('JSON Parse Error:', e);
        console.log('Failed to parse response:', text);
        throw new Error('Failed to parse response');
      }

      if (!response.ok) {
        console.error('API Error Response:', data);
        throw new Error(`API error: ${response.status}`);
      }

      console.log('Parsed data:', data);
      setCorrections(data.corrections || []);
      setAnalytics(data.analytics || {});
      setAgencies(data.filters?.agencies || []);
      setTitles(data.filters?.titles || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setCorrections([]);
      setAnalytics(null);
      setLoading(false);
    } finally {
      console.groupEnd();
    }
  };

  // Transform corrections by month data for chart
  const monthlyChartData = analytics?.correctionsByMonth 
    ? Object.entries(analytics.correctionsByMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    : [];

  // Calculate duration distribution
  const durationRanges = [
    { range: '0-7 days', min: 0, max: 7 },
    { range: '1-2 weeks', min: 8, max: 14 },
    { range: '2-4 weeks', min: 15, max: 30 },
    { range: '1-3 months', min: 31, max: 90 },
    { range: '3-6 months', min: 91, max: 180 },
    { range: '6+ months', min: 181, max: Infinity }
  ];

  const durationDistribution = corrections.reduce((acc, correction) => {
    const duration = Math.round((new Date(correction.error_corrected).getTime() - 
                               new Date(correction.error_occurred).getTime()) / 
                               (1000 * 60 * 60 * 24));
    
    const range = durationRanges.find(r => duration >= r.min && duration <= r.max);
    if (range) {
      acc[range.range] = (acc[range.range] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const durationChartData = Object.entries(durationDistribution)
    .map(([range, count]) => ({ range, count }));

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Correction History</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Corrections</CardTitle>
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
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${analytics?.averageDuration || 0} days`}
            </div>
            <p className="text-xs text-muted-foreground">To fix an error</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Most Active Month</CardTitle>
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
            <CardTitle className="text-sm font-medium">Longest Duration</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Corrections Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Correction Duration Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  Loading...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="range" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

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
                  {agencies.map(agency => (
                    <SelectItem key={agency.value} value={agency.value}>
                      {agency.label}
                    </SelectItem>
                  ))}
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
                  {titles.map(title => (
                    <SelectItem key={title.value} value={title.value}>
                      {title.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

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