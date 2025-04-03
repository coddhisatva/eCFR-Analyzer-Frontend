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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600">
                {children.length} Subagencies
              </div>
              <div className="text-sm text-gray-600">
                {agency.num_cfr} Total CFR References (including subagencies)
              </div>
              <div className="text-sm text-gray-600">
                {references.length} Direct CFR References
              </div>
              <div className="text-sm text-gray-600">
                {agency.num_sections.toLocaleString()} Total Sections
              </div>
              <div className="text-sm text-gray-600">
                {agency.num_words.toLocaleString()} Total Words
              </div>
              <div className="text-sm text-gray-600">
                {agency.num_corrections.toLocaleString()} Total Corrections
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Subagencies Column */}
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">Subagencies</h2>
                {children.length > 0 ? (
                  <div className="grid gap-4">
                    {children.map((child: Agency) => (
                      <Link
                        key={child.id}
                        href={`/agency/${child.id}`}
                        className="block p-4 rounded-lg border hover:border-blue-500 transition-colors"
                      >
                        <div className="font-medium mb-2">{child.name}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-gray-500">CFR References</div>
                            <div className="font-semibold">{child.num_cfr}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Subagencies</div>
                            <div className="font-semibold">{child.num_children}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Sections</div>
                            <div className="font-semibold">{child.num_sections.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Words</div>
                            <div className="font-semibold">{child.num_words.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Corrections</div>
                            <div className="font-semibold">{child.num_corrections.toLocaleString()}</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-600">No subagencies found</div>
                )}
              </div>

              {/* CFR References Column */}
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">Direct CFR References</h2>
                {references.length > 0 ? (
                  <div className="grid gap-4">
                    {references.map((ref: { id: string; node: { id: string; citation: string; node_name: string } }) => (
                      <Link
                        key={ref.id}
                        href={`/browse/${ref.node.id}`}
                        className="block p-4 rounded-lg border hover:border-blue-500 transition-colors"
                      >
                        <div className="font-medium">{ref.node.citation}</div>
                        <div className="text-sm text-gray-600">
                          {ref.node.node_name}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-600">No direct CFR references found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-96 border-l overflow-y-auto bg-gray-50 p-4">
        <AgencyAnalyticsSidebar />
      </div>
    </div>
  );
} 