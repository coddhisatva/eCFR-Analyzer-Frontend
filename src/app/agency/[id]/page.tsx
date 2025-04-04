import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AgencyAnalyticsSidebar } from "@/components/layout/agency-analytics-sidebar";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    // Fetch the agency details
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', id)
      .single();

    if (agencyError) throw agencyError;
    if (!agency) throw new Error('Agency not found');

    // Fetch child agencies
    const { data: children, error: childrenError } = await supabase
      .from('agencies')
      .select('*')
      .eq('parent_id', id)
      .order('name', { ascending: true });

    if (childrenError) throw childrenError;

    // Get all nodes mapped to this agency using the agency index
    const { data: nodes, error: nodesError } = await supabase
      .from('agency_node_mappings')
      .select(`
        nodes (*)
      `)
      .eq('agency_id', id);

    if (nodesError) throw nodesError;

    // Convert nodes into references format to maintain compatibility
    const references = (nodes || []).map((record: any) => ({
      id: `${id}_${record.nodes.id}`,
      node: record.nodes
    }));

    return {
      agency,
      children: children || [],
      references
    };
  } catch (error) {
    console.error('Error fetching agency data:', error);
    throw error;
  }
}

// Recursively fetch parent agencies to build breadcrumb
async function fetchParentAgencies(parentId: string | null): Promise<Agency[]> {
  if (!parentId) return [];
  
  try {
    const { data: agency, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', parentId)
      .single();

    if (error) throw error;
    if (!agency) return [];

    const parents = await fetchParentAgencies(agency.parent_id);
    return [...parents, agency];
  } catch (error) {
    console.error('Error fetching parent agency:', error);
    return [];
  }
}

export default async function AgencyPage({ params }: { params: { id: string } }) {
  try {
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
  } catch (error) {
    console.error('Error in AgencyPage:', error);
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Error Loading Agency</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">There was an error loading the agency data.</p>
          <p className="text-red-600 text-sm mt-2">Error details: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
} 