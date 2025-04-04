import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { RegulationNode } from "@/types/regulation";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Agency {
  id: string;
  name: string;
}

type PageProps = {
  params: {
    path: string[];
  };
};

async function fetchNodeData(pathArray: string[]) {
  console.log('Original pathArray:', pathArray);
  console.log('Original pathArray types:', pathArray.map(segment => typeof segment));
  
  // Convert path array to a single path string, matching the original API route
  const path = pathArray.join('/');
  console.log('Joined path:', path);
  
  try {
    // Convert the path to a node ID format
    const nodeId = path.startsWith('us/federal/ecfr/') ? path : `us/federal/ecfr/${path}`;
    console.log('Node ID:', nodeId);

    // First, try to get the node directly by ID
    let { data: nodeData, error: nodeError } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', nodeId);
    
    if (nodeError) {
      console.error('Database error:', nodeError);
      throw new Error(`Database error: ${nodeError.message}`);
    }
    
    // If node not found directly, try to parse the path
    if (!nodeData || nodeData.length === 0) {
      console.log('Node not found by ID, trying path parsing');
      // Parse path segments to identify the node
      const pathSegments = path.split('/');
      console.log('Path segments:', pathSegments);
      const lastSegment = pathSegments[pathSegments.length - 1] || '';
      console.log('Last segment:', lastSegment);
      const [levelType, number] = lastSegment.split('=');
      console.log('Split result:', { levelType, number });
      
      if (!levelType || !number) {
        console.error('Invalid path format:', { levelType, number });
        throw new Error('Invalid path format. Expected format: level_type=number');
      }

      // Try to find the node by level type and number
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('nodes')
        .select('*')
        .eq('level_type', levelType)
        .eq('number', number);
      
      if (fallbackError) {
        console.error('Database error:', fallbackError);
        throw new Error(`Database error: ${fallbackError.message}`);
      }
      
      if (!fallbackData || fallbackData.length === 0) {
        console.error('No node found for path:', path);
        throw new Error(`No node found for path: ${path}`);
      }
      
      nodeData = fallbackData;
    }
    
    // Get the first matching node
    const nodeInfo = nodeData[0];
    
    // If this is a content node, fetch the content chunks
    let content: string[] = [];
    if (nodeInfo.node_type === 'content') {
      const { data: contentChunks, error: contentError } = await supabase
        .from('content_chunks')
        .select('*')
        .eq('section_id', nodeInfo.id)
        .order('chunk_number', { ascending: true });
      
      if (contentError) {
        console.error('Error fetching content:', contentError);
        throw new Error(`Error fetching content: ${contentError.message}`);
      }
      
      // Extract content from chunks
      content = contentChunks?.map((chunk: any) => chunk.content) || [];
    }
    
    // Get child nodes if this is a structure node
    let childNodes: RegulationNode[] = [];
    if (nodeInfo.node_type === 'structure') {
      const { data: children, error: childrenError } = await supabase
        .from('nodes')
        .select('*')
        .eq('parent', nodeInfo.id)
        .order('display_order', { ascending: true });
      
      if (childrenError) {
        console.error('Error fetching child nodes:', childrenError);
        throw new Error(`Error fetching child nodes: ${childrenError.message}`);
      }
      
      childNodes = children || [];
    }

    // Get related agencies using the agency_node_mappings index
    const { data: agencies, error: agenciesError } = await supabase
      .from('agency_node_mappings')
      .select(`
        agencies (
          id,
          name
        )
      `)
      .eq('node_id', nodeInfo.id);

    if (agenciesError) {
      console.error('Error fetching related agencies:', agenciesError);
      throw new Error(`Error fetching related agencies: ${agenciesError.message}`);
    }
    
    // Return the complete regulation data
    return {
      nodeInfo,
      content,
      childNodes,
      agencies: agencies?.map(record => record.agencies) || []
    };
    
  } catch (error) {
    console.error('Error fetching node data:', error);
    throw error;
  }
}

export default async function NodePage({ params }: PageProps) {
  try {
    const { path } = params;
    const pathString = path.join("/");

    // Fetch the node data
    const nodeData = await fetchNodeData(path);
    const { nodeInfo, content, childNodes } = nodeData;

    // Build breadcrumbs from path segments
    const breadcrumbs = path.map((segment, index) => {
      const breadcrumbPath = path.slice(0, index + 1).join('/');
      const [type, number] = decodeURIComponent(segment).split('=');
      const label = type === 'title' ? `Title ${number}` :
                   type === 'subtitle' ? `Subtitle ${number}` :
                   type === 'chapter' ? `Chapter ${number}` :
                   type === 'subchapter' ? `Subchapter ${number}` :
                   type === 'part' ? `Part ${number}` :
                   type === 'section' ? `Section ${number}` :
                   `${type} ${number}`;
      return { 
        label, 
        path: `/browse/${breadcrumbPath}`
      };
    });
    
    // Add home breadcrumb at the beginning
    breadcrumbs.unshift({ label: 'Browse', path: '/browse' });

    // Calculate word count
    const wordCount = content?.reduce((acc: number, chunk: string) => 
      acc + chunk.split(/\s+/).length, 0
    ) || 0;

    return (
      <div className="flex">
        <div className="flex-1 max-w-4xl mx-auto p-6">
          {/* Breadcrumb navigation */}
          <nav className="flex items-center space-x-2 text-sm mb-6">
            {breadcrumbs.map((item, i) => (
              <div key={item.path} className="flex items-center">
                {i > 0 && <span className="mx-2 text-gray-500">›</span>}
                <Link href={item.path} className="text-blue-600 hover:underline">
                  {item.label}
                </Link>
              </div>
            ))}
          </nav>

          {/* Node header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{nodeInfo.citation}</h1>
              <p className="text-xl text-gray-600">{nodeInfo.node_name}</p>
            </div>
            {nodeInfo.link && (
              <a 
                href={nodeInfo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                View on eCFR
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>

          {/* Main content area */}
          <div className="space-y-8">
            {/* Metrics row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Word Count</div>
                <div className="text-2xl font-bold">{nodeInfo.num_words.toLocaleString()}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Sections</div>
                <div className="text-2xl font-bold">{nodeInfo.num_sections.toLocaleString()}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Corrections</div>
                <div className="text-2xl font-bold">{nodeInfo.num_corrections.toLocaleString()}</div>
              </div>
              {nodeInfo.metadata?.source_url && (
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-500">Original Source</div>
                  <a 
                    href={nodeInfo.metadata.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate block"
                  >
                    View Source
                  </a>
                </div>
              )}
            </div>

            {/* Content section */}
            {nodeInfo.node_type === 'content' && content && content.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Content</h2>
                <div className="prose prose-blue max-w-none">
                  {content.map((chunk: string, index: number) => (
                    <div 
                      key={index}
                      className="mb-4"
                      dangerouslySetInnerHTML={{ __html: chunk }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Children section */}
            {childNodes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">
                  Child Nodes <span className="text-gray-500 text-lg">({childNodes.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {childNodes.map((child: RegulationNode) => {
                    const pathSegment = `${child.level_type}=${child.number}`;
                    const childPath = path.length > 0 ? `${path.join('/')}/${pathSegment}` : pathSegment;
                    
                    return (
                      <Link
                        key={child.id}
                        href={`/browse/${childPath}`}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium">{child.node_name}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agencies section */}
            {nodeData.agencies?.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">
                  Related Agencies <span className="text-gray-500 text-lg">({nodeData.agencies.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nodeData.agencies.map((agency: Agency) => (
                    <Link
                      key={agency.id}
                      href={`/agency/${agency.id}`}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">{agency.name}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in NodePage:', error);
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Error Loading Content</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-700">There was an error loading the content.</p>
          <p className="text-red-600 text-sm mt-2">Error details: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}