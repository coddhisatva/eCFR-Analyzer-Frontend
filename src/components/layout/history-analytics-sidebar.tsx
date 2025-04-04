"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AnalyticsData = {
  totalMetrics: {
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
    } | null;
  };
  correctionsByMonth: Record<string, number>;
};

export function HistoryAnalyticsSidebar() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/corrections/analytics');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError((err as Error).message || 'Failed to load analytics');
      }
    }

    fetchAnalytics();
  }, []);

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <div className="text-red-600 font-medium mb-1">Error</div>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading analytics...
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Correction Analytics</h3>
      
      <div className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Overall Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <div className="text-gray-500">Total Corrections:</div>
              <div className="text-right font-medium">{analytics.totalMetrics.totalCorrections.toLocaleString()}</div>
              
              <div className="text-gray-500">Average Duration:</div>
              <div className="text-right font-medium">{analytics.totalMetrics.averageDuration} days</div>
              
              <div className="text-gray-500">Most Active Month:</div>
              <div className="text-right font-medium">{analytics.totalMetrics.mostActiveMonth.month}</div>
              
              <div className="text-gray-500">Longest Correction:</div>
              <div className="text-right font-medium">
                {analytics.totalMetrics.longestCorrection?.duration || 0} days
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Corrections by Month
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="space-y-2">
              {Object.entries(analytics.correctionsByMonth)
                .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                .map(([month, count]) => (
                  <div 
                    key={month} 
                    className="flex justify-between items-center text-sm p-2 rounded hover:bg-gray-100 transition-colors"
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-gray-600 truncate">
                            {month}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{month}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        
        {analytics.totalMetrics.longestCorrection && (
          <Card className="shadow-sm">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm font-medium flex items-center">
                <Hash className="h-4 w-4 mr-2" />
                Longest Correction
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <div className="text-gray-600 truncate">
                    {analytics.totalMetrics.longestCorrection.title}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {analytics.totalMetrics.longestCorrection.agency}
                  </div>
                  <div className="font-medium mt-1">
                    {analytics.totalMetrics.longestCorrection.duration} days
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 