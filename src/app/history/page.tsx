"use client";

import { useState } from "react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";

interface Correction {
  id: number;
  error_occurred: string;
  error_corrected: string;
  correction_duration: number;
  nodes: {
    node_name: string;
    level_type: string;
    number: string;
  };
}

export default function HistoryPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const handleDateChange = (newDate: DateRange | undefined) => {
    if (newDate?.from && newDate?.to) {
      setDate(newDate);
    }
  };

  const handleSearch = async () => {
    if (!date.from || !date.to) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        start_date: date.from.toISOString().split('T')[0],
        end_date: date.to.toISOString().split('T')[0]
      });

      const response = await fetch(`/api/corrections?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch corrections');
      }
      
      console.log('Received corrections:', data.corrections?.length || 0);
      setCorrections(data.corrections || []);
    } catch (err) {
      console.error('Error:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Search Section */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-4">Correction History Search</h1>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-2">Select Date Range</div>
            <DatePickerWithRange 
              date={date} 
              onDateChange={handleDateChange}
            />
          </div>
          <Button 
            size="lg"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search Corrections"}
          </Button>
        </div>
        {error && (
          <div className="mt-4 text-red-600">{error}</div>
        )}
      </div>

      {/* Results Section */}
      {corrections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {corrections.map((correction) => (
            <Card key={correction.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Link 
                      href={`/browse/${correction.nodes.level_type}=${correction.nodes.number}`}
                      className="text-lg font-medium text-blue-600 hover:underline"
                    >
                      {correction.nodes.node_name}
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Error Occurred</div>
                      <div>{new Date(correction.error_occurred).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Error Corrected</div>
                      <div>{new Date(correction.error_corrected).toLocaleDateString()}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-500">Duration</div>
                      <div>{correction.correction_duration} days</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {isLoading ? "Searching for corrections..." : "Select a date range and click Search to find corrections"}
        </div>
      )}
    </div>
  );
} 