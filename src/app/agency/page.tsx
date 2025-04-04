import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AgencyAnalyticsSidebar } from "@/components/layout/agency-analytics-sidebar";
import { SortControls } from "@/components/agency/sort-controls";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AgencyPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  try {
    const sortBy = typeof searchParams.sortBy === 'string' ? searchParams.sortBy : 'name';
    const sortOrder = typeof searchParams.sortOrder === 'string' ? searchParams.sortOrder : 'asc';

    // Fetch directly from Supabase instead of through API route
    const { data: agencies, error } = await supabase
      .from('agencies')
      .select('*')
      .is('parent_id', null)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    if (error) {
      throw error;
    }

    return (
      <div className="flex h-full">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Federal Agencies</h1>
            <SortControls />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map((agency: any) => (
              <Link 
                key={agency.id}
                href={`/agency/${agency.id}`}
                className="block"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{agency.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">CFR References</div>
                        <div className="font-semibold">{agency.num_cfr}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Subagencies</div>
                        <div className="font-semibold">{agency.num_children}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Sections</div>
                        <div className="font-semibold">{agency.num_sections.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Words</div>
                        <div className="font-semibold">{agency.num_words.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Corrections</div>
                        <div className="font-semibold">{agency.num_corrections.toLocaleString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="w-96 border-l overflow-y-auto bg-gray-50 p-4">
          <AgencyAnalyticsSidebar />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in AgencyPage:', error);
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Error Loading Agencies</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">There was an error loading the agencies data.</p>
          <p className="text-red-600 text-sm mt-2">Error details: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
} 