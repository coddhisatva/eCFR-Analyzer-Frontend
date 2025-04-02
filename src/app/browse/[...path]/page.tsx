import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { RegulationNode } from "@/types/regulation";

type PageProps = {
  params: {
    path: string[];
  };
};

async function fetchNodeData(pathArray: string[]) {
  const pathString = pathArray.join('/');
  
  try {
    // For server-side API calls, we need the full URL
    const params = new URLSearchParams();
    params.append('path', pathString);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/regulation?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      // Get the error details from the response
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received node data:', data);  // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching node data:', error);
    throw error;
  }
}

export default async function NodePage({ params }: PageProps) {
  const { path } = params;
  const pathString = path.join("/");
  console.log("Viewing node at path:", pathString);

  // Fetch the node data
  const nodeData = await fetchNodeData(path);
  const { nodeInfo, content, childNodes } = nodeData;

  // Build breadcrumbs from path segments
  const breadcrumbs = path.map((segment, index) => {
    const breadcrumbPath = path.slice(0, index + 1).join('/');
    const [type, number] = segment.split('=');
    const label = type === 'title' ? `Title ${number}` :
                 type === 'subtitle' ? `Subtitle ${number}` :
                 type === 'chapter' ? `Chapter ${number}` :
                 type === 'subchapter' ? `Subchapter ${number}` :
                 type === 'part' ? `Part ${number}` :
                 type === 'section' ? `Section ${number}` :
                 `${type} ${number}`;
    return { label, path: `/browse/${breadcrumbPath}` };
  });
  
  // Add home breadcrumb at the beginning
  breadcrumbs.unshift({ label: 'Browse', path: '/browse' });

  // Calculate word count
  const wordCount = content?.reduce((acc: number, chunk: string) => 
    acc + chunk.split(/\s+/).length, 0
  ) || 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{nodeInfo.citation}</h1>
        <p className="text-xl text-gray-600">{nodeInfo.node_name}</p>
      </div>

      {/* Main content area */}
      <div className="space-y-8">
        {/* Metrics row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500">Word Count</div>
            <div className="text-2xl font-bold">{wordCount}</div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500">Historical Changes</div>
            <div className="text-2xl font-bold">{nodeInfo.metadata?.num_corrections || 0}</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="text-sm text-gray-500">Original Source</div>
            <a 
              href={nodeInfo.metadata?.original_url || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate block"
            >
              View Source
            </a>
          </div>
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
              {childNodes.map((child: RegulationNode) => (
                <Link
                  key={child.id}
                  href={`/browse/${child.link.replace(/^\//, '')}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{child.citation}</div>
                  <div className="text-sm text-gray-600 truncate">{child.node_name}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}