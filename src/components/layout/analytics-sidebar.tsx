"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePathname } from "next/navigation";
import Link from "next/link";

type Correction = {
  id: string;
  error_occurred: string;
  error_corrected: string;
  correction_duration: number;
  nodes: {
    node_name: string;
    level_type: string;
    number: string;
  };
};

export function AnalyticsSidebar() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  // Only show for regulation pages
  const isRegulationPage = pathname.startsWith("/browse/") && pathname !== "/browse";
  
  useEffect(() => {
    if (!isRegulationPage) return;

    async function fetchCorrections() {
      try {
        // Extract node path from URL
        const nodePath = pathname.replace("/browse/", "");
        const response = await fetch(`/api/regulation/corrections?path=${nodePath}&limit=5`);
        if (!response.ok) throw new Error('Failed to fetch corrections');
        const data = await response.json();
        setCorrections(data.corrections || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load corrections');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCorrections();
  }, [pathname, isRegulationPage]);

  if (!isRegulationPage) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Select a regulation to view corrections</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Corrections</h3>
        <Card>
          <CardContent className="py-6">
            <div className="text-gray-500 text-center">Loading corrections...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Corrections</h3>
        <Card>
          <CardContent className="py-6">
            <div className="text-red-500 text-center">Failed to load corrections</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (corrections.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Corrections</h3>
        <Card>
          <CardContent className="py-6">
            <div className="text-gray-500 text-center">No recent corrections found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Recent Corrections</h3>
      <div className="space-y-4">
        {corrections.map((correction) => (
          <Card key={correction.id}>
            <CardContent className="py-4">
              <Link href={`/browse/${correction.nodes.level_type}=${correction.nodes.number}`} className="text-blue-600 hover:underline block mb-4">
                {correction.nodes.node_name}
              </Link>
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-500">Error Occurred</div>
                  <div>{new Date(correction.error_occurred).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Error Corrected</div>
                  <div>{new Date(correction.error_corrected).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Duration</div>
                  <div>{correction.correction_duration} days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}