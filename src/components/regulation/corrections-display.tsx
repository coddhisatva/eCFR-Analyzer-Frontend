"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_KEY || ''
);

type Correction = {
  id: string;
  error_occurred: string;
  error_corrected: string;
  correction_duration: number;
  nodes: {
    node_name: string;
    level_type: string;
    number: string;
  }[];
};

interface CorrectionsDisplayProps {
  nodeId: string;
}

export function CorrectionsDisplay({ nodeId }: CorrectionsDisplayProps) {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCorrections() {
      console.log('DEBUG - Component mounted with nodeId:', nodeId);
      console.log('DEBUG - Type of nodeId:', typeof nodeId);
      try {
        console.log('DEBUG - Starting Supabase query...');
        const query = supabase
          .from('corrections')
          .select(`
            id,
            error_occurred,
            error_corrected,
            correction_duration,
            nodes:node_id (
              node_name,
              level_type,
              number
            )
          `)
          .eq('node_id', nodeId)
          .order('error_occurred', { ascending: false })
          .limit(5);

        console.log('DEBUG - Query built:', query.toSQL()); // This will show the actual SQL being generated
        
        const { data, error: correctionsError } = await query;
        
        console.log('DEBUG - Query complete');
        console.log('DEBUG - Data received:', data);
        console.log('DEBUG - Error if any:', correctionsError);

        if (correctionsError) throw correctionsError;
        setCorrections(data || []);
      } catch (err) {
        console.error('DEBUG - Detailed error:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(err instanceof Error ? err.message : 'Failed to load corrections');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCorrections();
  }, [nodeId]);

  if (isLoading) {
    return (
      <div className="text-gray-500 text-center">Loading corrections...</div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">Failed to load corrections</div>
    );
  }

  if (corrections.length === 0) {
    return (
      <div className="text-gray-500 text-center">No corrections found</div>
    );
  }

  return (
    <div className="space-y-4">
      {corrections.map((correction) => (
        <Card key={correction.id}>
          <CardContent className="py-4">
            <Link 
              href={`/browse/${correction.nodes[0].level_type}=${correction.nodes[0].number}`}
              className="text-blue-600 hover:underline block mb-4"
            >
              {correction.nodes[0].node_name}
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
  );
} 