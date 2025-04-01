import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import RegulationContent from "@/components/regulation/content";
import RegulationStructure from "@/components/regulation/structure";
import { RegulationPathParams } from "@/types/regulation";

type PageProps = {
  params: Promise<RegulationPathParams>;
};

async function fetchRegulationData(pathArray: string[]) {
  // Convert path array into a path string in the format expected by the API
  // e.g., ['title=4', 'chapter=I'] => 'title=4/chapter=I'
  const pathString = pathArray.join('/');
  
  try {
    // For server-to-server API calls within the same app, we can use a relative URL
    // with properly encoded parameters
    const params = new URLSearchParams();
    params.append('path', pathString);
    
    const apiUrl = `/api/regulation?${params.toString()}`;
    console.log('Fetching regulation data from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      // Handle HTTP errors
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      } catch {
        errorMessage = `HTTP error! status: ${response.status}, text: ${errorText.slice(0, 100)}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching regulation data:', error);
    throw error;
  }
}

export default async function Page({ params }: PageProps) {
  const { path } = await params;
  const pathString = path.join("/");
  console.log("Path:", pathString);

  // Fetch the regulation data
  const regulationData = await fetchRegulationData(path);
  const { nodeInfo, content, childNodes } = regulationData;

  // Build breadcrumbs from path segments
  const breadcrumbs = path.map((segment, index) => {
    const breadcrumbPath = '/' + path.slice(0, index + 1).join('/');
    const [type, number] = segment.split('=');
    const label = `${type.charAt(0).toUpperCase() + type.slice(1)} ${number}`;
    return { label, path: `/browse${breadcrumbPath}` };
  });
  
  // Add a home breadcrumb at the beginning
  breadcrumbs.unshift({ label: 'Browse', path: '/browse' });

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb navigation */}
      <div className="flex flex-wrap items-center mb-2 text-sm">
        {breadcrumbs.map((item, i) => (
          <div key={item.path} className="flex items-center">
            {i > 0 && <span className="mx-2">›</span>}
            <Link href={item.path} className="text-blue-600 hover:underline">
              {item.label}
            </Link>
          </div>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-1">
        {nodeInfo.node_name}
      </h1>
      <p className="text-gray-600 mb-6">{nodeInfo.citation}</p>

      {/* Content tabs - content and history */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          {nodeInfo.node_type === 'content' ? (
            // Display content node (section)
            <RegulationContent 
              content={content} 
              nodeInfo={nodeInfo}
            />
          ) : (
            // Display structure node with its children
            <RegulationStructure 
              nodeInfo={nodeInfo}
              childNodes={childNodes} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <div className="py-4">
            <p className="text-gray-600">
              Historical versions and amendments will be displayed here.
            </p>
            <div className="mt-4">
              <h3 className="font-medium mb-2">Version History</h3>
              <div className="border rounded-md">
                <div className="grid grid-cols-3 p-3 border-b bg-gray-50 font-medium">
                  <div>Date</div>
                  <div>Change Type</div>
                  <div>Description</div>
                </div>
                <div className="grid grid-cols-3 p-3 border-b">
                  <div>Mar 12, 2023</div>
                  <div>Amendment</div>
                  <div>Updated definition in § 21.2(a)</div>
                </div>
                <div className="grid grid-cols-3 p-3 border-b">
                  <div>Jan 5, 2022</div>
                  <div>Revision</div>
                  <div>Added clarity to purpose statement</div>
                </div>
                <div className="grid grid-cols-3 p-3">
                  <div>Nov 20, 2020</div>
                  <div>Initial</div>
                  <div>Original publication</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}