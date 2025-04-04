"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface DateSelection {
  month: number;
  year: number;
}

export default function HistoryPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize to current month and previous month
  const currentDate = new Date();
  const [startDate, setStartDate] = useState<DateSelection>({
    month: currentDate.getMonth(),
    year: currentDate.getFullYear()
  });
  const [endDate, setEndDate] = useState<DateSelection>({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear()
  });

  // Generate arrays for dropdowns
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const startDateStr = `${startDate.year}-${String(startDate.month + 1).padStart(2, '0')}-01`;
      const endDateStr = `${endDate.year}-${String(endDate.month + 1).padStart(2, '0')}-01`;

      const params = new URLSearchParams({
        start_date: startDateStr,
        end_date: endDateStr
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
        <div className="flex gap-6 items-end">
          {/* Start Date */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">Start Date</div>
            <div className="flex gap-2">
              <Select
                value={String(startDate.month)}
                onValueChange={(value) => setStartDate({ ...startDate, month: parseInt(value) })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue>{months[startDate.month]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, i) => (
                    <SelectItem key={i} value={String(i)}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(startDate.year)}
                onValueChange={(value) => setStartDate({ ...startDate, year: parseInt(value) })}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue>{startDate.year}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <div className="text-sm text-gray-500">End Date</div>
            <div className="flex gap-2">
              <Select
                value={String(endDate.month)}
                onValueChange={(value) => setEndDate({ ...endDate, month: parseInt(value) })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue>{months[endDate.month]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, i) => (
                    <SelectItem key={i} value={String(i)}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(endDate.year)}
                onValueChange={(value) => setEndDate({ ...endDate, year: parseInt(value) })}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue>{endDate.year}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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