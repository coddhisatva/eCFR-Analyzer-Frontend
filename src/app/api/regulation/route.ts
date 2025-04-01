import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder for the actual API endpoint
// In a real implementation, this would connect to your database
export async function GET(request: NextRequest) {
  try {
    // Extract path from query string
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    
    // Log the raw path for debugging
    console.log('Received raw path:', path);
    
    // Parse path segments to determine what to return
    const pathSegments = path.split('/');
    console.log('Processing request for path segments:', pathSegments);
    
    // Sample data structure based on the user's database model
    // In a real implementation, fetch this from a database based on the path
    
    // Mock data - simulating database response
    const mockNode = {
      id: "section-123",
      citation: "4 CFR § 21.1-3",
      link: "/title=4/chapter=I/part=21/section=1-3",
      node_type: pathSegments.length >= 4 ? "content" : "structure", // Assume deeper than 4 levels is content
      level_type: pathSegments[pathSegments.length - 1]?.split('=')[0] || "title",
      number: pathSegments[pathSegments.length - 1]?.split('=')[1] || "",
      node_name: getNodeName(pathSegments),
      parent: "part-21",
      metadata: { effective_date: "2022-03-15" }
    };
    
    // Mock content chunks (only for content nodes)
    const mockContent = mockNode.node_type === "content" 
      ? [
          `<h2 class="text-xl font-semibold mb-2">§ 21.1 Purpose.</h2>
          <p class="mb-4">This part sets forth the administrative procedures of the Government Accountability Office for the issuance, amendment, and revocation of regulations and for the formulation and publication of rules.</p>`,
          
          `<h2 class="text-xl font-semibold mt-6 mb-2">§ 21.2 Definitions.</h2>
          <p class="mb-4">For purposes of this part:</p>
          <p class="mb-4">(a) Rule means the whole or a part of a statement of policy or interpretation or prescription of general application, designed to have general effect...</p>`,
          
          `<h2 class="text-xl font-semibold mt-6 mb-2">§ 21.3 Authority.</h2>
          <p class="mb-4">The Comptroller General is authorized to make rules and regulations affecting the Government Accountability Office as required for the performance of his duty as established by law.</p>`
        ]
      : [];
    
    // Mock child nodes (only for structure nodes)
    const mockChildNodes = mockNode.node_type !== "content" 
      ? [
          {
            id: "subchapter-A",
            citation: "Subchapter A",
            link: `${mockNode.link}/subchapter=A`,
            node_type: "structure",
            level_type: "subchapter",
            number: "A",
            node_name: "General Provisions"
          },
          {
            id: "subchapter-B",
            citation: "Subchapter B",
            link: `${mockNode.link}/subchapter=B`,
            node_type: "structure",
            level_type: "subchapter",
            number: "B",
            node_name: "Federal Claims"
          },
          {
            id: "part-21",
            citation: "Part 21",
            link: `${mockNode.link}/part=21`,
            node_type: "structure",
            level_type: "part",
            number: "21",
            node_name: "Bid Protest Regulations"
          }
        ]
      : [];
    
    return NextResponse.json({
      nodeInfo: mockNode,
      content: mockContent,
      childNodes: mockChildNodes
    });
    
  } catch (error) {
    console.error('Error fetching regulation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regulation data' },
      { status: 500 }
    );
  }
}

// Helper function to generate a node name based on path segments
function getNodeName(pathSegments: string[]): string {
  if (pathSegments.length === 0) return "Code of Federal Regulations";
  
  const lastSegment = pathSegments[pathSegments.length - 1];
  const [type, number] = lastSegment.split('=');
  
  switch (type) {
    case 'title':
      return `Title ${number} - Accounts`;
    case 'chapter':
      return `Chapter ${number} - Government Accountability Office`;
    case 'subchapter':
      return `Subchapter ${number} - General Provisions`;
    case 'part':
      return `Part ${number} - Bid Protest Regulations`;
    case 'section':
      return `Sections ${number} - Purpose and Definitions`;
    default:
      return `${type.charAt(0).toUpperCase() + type.slice(1)} ${number}`;
  }
} 