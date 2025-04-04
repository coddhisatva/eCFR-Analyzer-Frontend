"use client";

import { useState, useEffect } from "react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface Correction {
  id: number;
  error_occurred: string;
  error_corrected: string;
  correction_duration: number;
  node: {
    id: string;
    citation: string;
    node_name: string;
  };
  agency: {
    id: string;
    name: string;
  };
}

export default function HistoryPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  useEffect(() => {
    fetchCorrections();
  }, [date]);

  const fetchCorrections = async () => {
    if (!date.from || !date.to) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: date.from.toISOString().split('T')[0],
        end_date: date.to.toISOString().split('T')[0]
      });

      const response = await fetch(`/api/corrections?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch corrections');
      
      const data = await response.json();
      setCorrections(data.corrections);
    } catch (error) {
      console.error('Error fetching corrections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Correction History</h1>
        <DatePickerWithRange date={date} onDateChange={setDate} />
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading corrections...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {corrections.map((correction) => (
            <Card key={correction.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Link 
                      href={`/browse/${correction.node.id}`}
                      className="text-lg font-medium text-blue-600 hover:underline"
                    >
                      {correction.node.citation}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{correction.node.node_name}</p>
                    <Link
                      href={`/agencies/${correction.agency.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {correction.agency.name}
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
      )}
    </div>
  );
} 