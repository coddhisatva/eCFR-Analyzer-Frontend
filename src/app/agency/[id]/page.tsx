import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AgencyAnalyticsSidebar } from "@/components/layout/agency-analytics-sidebar";

interface Agency {
  id: string;
  name: string;
  num_sections: number;
  num_words: number;
  num_corrections: number;
  num_children: number;
  parent_id: string | null;
  num_cfr: number;
}

async function fetchAgencyData(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agencies/${id}`, {
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
    console.error('Error fetching agency data:', error);
    throw error;
  }
}

// Recursively fetch parent agencies to build breadcrumb
async function fetchParentAgencies(parentId: string | null): Promise<Agency[]> {
  if (!parentId) return [];
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agencies/${parentId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { agency } = await response.json();
    const parents = await fetchParentAgencies(agency.parent_id);
    return [...parents, agency];
  } catch (error) {
    console.error('Error fetching parent agency:', error);
    return [];
  }
}

export default async function AgencyPage({ params }: { params: { id: string } }) {
  const { agency, children, references } = await fetchAgencyData(params.id);
  const parentAgencies = await fetchParentAgencies(agency.parent_id);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Breadcrumb navigation */}
        <nav className="flex items-center space-x-2 text-sm mb-6">
          <Link href="/agency" className="text-blue-600 hover:underline">
            Agencies
          </Link>
          {parentAgencies.map((parent, i) => (
            <div key={parent.id} className="flex items-center">
              <span className="mx-2 text-gray-500">›</span>
              <Link href={`/agency/${parent.id}`} className="text-blue-600 hover:underline">
                {parent.name}
              </Link>
            </div>
          ))}
          {parentAgencies.length > 0 && (
            <span className="mx-2 text-gray-500">›</span>
          )}
          <span className="text-gray-800">{agency.name}</span>
        </nav>

        {/* Agency Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{agency.name}</h1>
          {agency.parent_id && parentAgencies.length > 0 && (
            <p className="text-gray-600 mb-4">
              Part of: <Link href={`/agency/${parentAgencies[parentAgencies.length - 1].id}`} className="text-blue-600 hover:underline">
                {parentAgencies[parentAgencies.length - 1].name}
              </Link>
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{agency.num_cfr}</div>
                <div className="text-sm text-gray-500">CFR References</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{agency.num_children}</div>
                <div className="text-sm text-gray-500">Subagencies</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Subagencies Section */}
        {children.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Subagencies <span className="text-gray-500 text-lg">({children.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child: Agency) => (
                <Link
                  key={child.id}
                  href={`/agency/${child.id}`}
                  className="block"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl">{child.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">CFR References</div>
                          <div className="font-semibold">{child.num_cfr}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Subagencies</div>
                          <div className="font-semibold">{child.num_children}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {children.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            This agency has no subagencies.
          </div>
        )}

        {/* CFR References Section */}
        {references && references.length > 0 && (
          <div className="space-y-4 mt-8">
            <h2 className="text-2xl font-semibold">
              CFR References <span className="text-gray-500 text-lg">({references.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {references.map((ref) => (
                <Link
                  key={ref.id}
                  href={`/browse/${ref.node.level_type}=${ref.node.number}`}
                  className="block"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl">{ref.node.citation}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 truncate">
                        {ref.node.node_name}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {(!references || references.length === 0) && (
          <div className="text-center text-gray-500 mt-8">
            This agency has no CFR references.
          </div>
        )}
      </div>
      
      <div className="w-72 border-l overflow-y-auto bg-gray-50 p-4">
        <AgencyAnalyticsSidebar />
      </div>
    </div>
  );
} 