"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyticsData = {
  topAgencies: { name: string; count: number }[];
  topNodes: { name: string; count: number }[];
  longestCorrections: { duration: number; title: string }[];
  correctionsByMonth: Record<string, number>;
};

export function HistoryAnalyticsSidebar() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/corrections/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Failed to load analytics</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Agencies by Corrections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topAgencies.map((agency, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm truncate">{agency.name}</span>
                <span className="text-sm font-medium">{agency.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Sections by Corrections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.topNodes.map((node, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm truncate">{node.name}</span>
                <span className="text-sm font-medium">{node.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Longest Corrections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.longestCorrections.map((correction, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm truncate">{correction.title}</span>
                <span className="text-sm font-medium">{correction.duration} days</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 