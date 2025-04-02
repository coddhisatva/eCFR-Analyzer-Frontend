import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AgencyAnalyticsSidebar } from "@/components/layout/agency-analytics-sidebar";

async function fetchAgencies() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agencies`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching agencies:', error);
    throw error;
  }
}

export default async function AgencyPage() {
  const agencies = await fetchAgencies();

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Federal Agencies</h1>
        
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
                      <div className="text-gray-500">Sections</div>
                      <div className="font-semibold">{agency.num_sections}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Words</div>
                      <div className="font-semibold">{agency.num_words}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Corrections</div>
                      <div className="font-semibold">{agency.num_corrections}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Subagencies</div>
                      <div className="font-semibold">{agency.num_children}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="w-72 border-l overflow-y-auto bg-gray-50 p-4">
        <AgencyAnalyticsSidebar />
      </div>
    </div>
  );
} 