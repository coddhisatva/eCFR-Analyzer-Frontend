"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Hash, History } from "lucide-react";
import { useEffect, useState } from "react";

type AnalyticsData = {
  totalMetrics: {
    totalAgencies: number;
    totalSections: number;
    totalWords: number;
    totalCorrections: number;
  };
  topAgenciesByCorrections: Array<{
    name: string;
    count: number;
  }>;
  topAgenciesBySections: Array<{
    name: string;
    count: number;
  }>;
};

export function AgencyAnalyticsSidebar() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/agencies/analytics');
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
      <h3 className="text-lg font-semibold mb-4">Agency Analytics</h3>
      
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
              <div className="text-gray-500">Total Agencies:</div>
              <div className="text-right font-medium">{analytics.totalMetrics.totalAgencies}</div>
              
              <div className="text-gray-500">Total Sections:</div>
              <div className="text-right font-medium">{analytics.totalMetrics.totalSections.toLocaleString()}</div>
              
              <div className="text-gray-500">Total Words:</div>
              <div className="text-right font-medium">{analytics.totalMetrics.totalWords.toLocaleString()}</div>
              
              <div className="text-gray-500">Total Corrections:</div>
              <div className="text-right font-medium">{analytics.totalMetrics.totalCorrections.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Top Agencies by Corrections
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="space-y-2">
              {analytics.topAgenciesByCorrections.map((agency, index) => (
                <div key={agency.name} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 truncate">{index + 1}. {agency.name}</span>
                  <span className="font-medium">{agency.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              Top Agencies by Sections
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="space-y-2">
              {analytics.topAgenciesBySections.map((agency, index) => (
                <div key={agency.name} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 truncate">{index + 1}. {agency.name}</span>
                  <span className="font-medium">{agency.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-medium flex items-center">
              <History className="h-4 w-4 mr-2" />
              Correction Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="h-20 bg-gray-100 rounded flex items-end">
              <div className="w-1/6 h-4 bg-blue-500 mx-[2px]"></div>
              <div className="w-1/6 h-8 bg-blue-500 mx-[2px]"></div>
              <div className="w-1/6 h-12 bg-blue-500 mx-[2px]"></div>
              <div className="w-1/6 h-6 bg-blue-500 mx-[2px]"></div>
              <div className="w-1/6 h-10 bg-blue-500 mx-[2px]"></div>
              <div className="w-1/6 h-16 bg-blue-500 mx-[2px]"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 