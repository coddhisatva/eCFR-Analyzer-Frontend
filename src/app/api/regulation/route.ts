import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RegulationNode } from '@/types/regulation';

export const runtime = 'nodejs';

// Interface for content chunks from the database
interface ContentChunk {
  id: string;
  section_id: string;
  content: string;
  chunk_number: number;
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch regulation data from Supabase
export async function GET(request: NextRequest) {
  try {
    // Extract path from query string and ensure it's properly decoded
    const url = new URL(request.url);
    const encodedPath = url.searchParams.get('path');
    
    if (!encodedPath) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }
    
    // Ensure path is properly decoded
    const path = decodeURIComponent(encodedPath);
    
    // Convert the path to a node ID format
    const nodeId = path.startsWith('us/federal/ecfr/') ? path : `us/federal/ecfr/${path}`;

    // First, try to get the node directly by ID
    let { data: nodeData, error: nodeError } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', nodeId);
    
    if (nodeError) {
      return NextResponse.json(
        { error: `Database error: ${nodeError.message}` },
        { status: 500 }
      );
    }
    
    // If node not found directly, try to parse the path
    if (!nodeData || nodeData.length === 0) {
      // Parse path segments to identify the node
      const pathSegments = path.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1] || '';
      const [levelType, number] = lastSegment.split('=');
      
      if (!levelType || !number) {
        return NextResponse.json(
          { error: 'Invalid path format. Expected format: level_type=number' },
          { status: 400 }
        );
      }

      // Try to find the node by level type and number
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('nodes')
        .select('*')
        .eq('level_type', levelType)
        .eq('number', number);
      
      if (fallbackError) {
        return NextResponse.json(
          { error: `Database error: ${fallbackError.message}` },
          { status: 500 }
        );
      }
      
      if (!fallbackData || fallbackData.length === 0) {
        return NextResponse.json(
          { error: `No node found for path: ${path}` },
          { status: 404 }
        );
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
        return NextResponse.json(
          { error: `Error fetching content: ${contentError.message}` },
          { status: 500 }
        );
      }
      
      // Extract content from chunks
      content = contentChunks?.map((chunk: ContentChunk) => chunk.content) || [];
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
        return NextResponse.json(
          { error: `Error fetching child nodes: ${childrenError.message}` },
          { status: 500 }
        );
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
      return NextResponse.json(
        { error: `Error fetching related agencies: ${agenciesError.message}` },
        { status: 500 }
      );
    }
    
    // Return the complete regulation data
    return NextResponse.json({
      nodeInfo,
      content,
      childNodes,
      agencies: agencies?.map(record => record.agencies) || []
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch regulation data', details: (error as Error).message },
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

// Helper function to generate a citation based on path segments
function getCitation(pathSegments: string[]): string {
  if (pathSegments.length === 0) return "CFR";
  
  const lastSegment = pathSegments[pathSegments.length - 1];
  const [type, number] = lastSegment.split('=');
  
  switch (type) {
    case 'title':
      return `Title ${number}`;
    case 'chapter':
      return `Chapter ${number}`;
    case 'subchapter':
      return `Subchapter ${number}`;
    case 'part':
      return `Part ${number}`;
    case 'section':
      return `${pathSegments[0].split('=')[1]} CFR § ${number}`;
    default:
      return `${type.charAt(0).toUpperCase() + type.slice(1)} ${number}`;
  }
}

// Helper function to generate mock child nodes based on the current path
function generateMockChildNodes(parentPath: string): any[] {
  const segments = parentPath.split('/');
  const level = segments.length;
  
  // Generate different types of child nodes based on the current level
  switch (level) {
    case 1: // Title level - generate chapters
      return [
        {
          id: `chapter-I-${parentPath}`,
          citation: "Chapter I",
          link: `/${parentPath}/chapter=I`,
          node_type: "structure",
          level_type: "chapter",
          number: "I",
          node_name: "Government Accountability Office"
        },
        {
          id: `chapter-II-${parentPath}`,
          citation: "Chapter II",
          link: `/${parentPath}/chapter=II`,
          node_type: "structure",
          level_type: "chapter",
          number: "II",
          node_name: "Federal Claims"
        }
      ];
    
    case 2: // Chapter level - generate subchapters
      return [
        {
          id: `subchapter-A-${parentPath}`,
          citation: "Subchapter A",
          link: `/${parentPath}/subchapter=A`,
          node_type: "structure",
          level_type: "subchapter",
          number: "A",
          node_name: "General Provisions"
        },
        {
          id: `subchapter-B-${parentPath}`,
          citation: "Subchapter B",
          link: `/${parentPath}/subchapter=B`,
          node_type: "structure",
          level_type: "subchapter",
          number: "B",
          node_name: "Federal Claims"
        }
      ];
      
    case 3: // Subchapter level - generate parts
      return [
        {
          id: `part-21-${parentPath}`,
          citation: "Part 21",
          link: `/${parentPath}/part=21`,
          node_type: "structure",
          level_type: "part",
          number: "21",
          node_name: "Bid Protest Regulations"
        },
        {
          id: `part-22-${parentPath}`,
          citation: "Part 22",
          link: `/${parentPath}/part=22`,
          node_type: "structure",
          level_type: "part",
          number: "22",
          node_name: "Contract Dispute Resolution"
        }
      ];
      
    case 4: // Part level - generate sections
      return [
        {
          id: `section-1-3-${parentPath}`,
          citation: "Section 1-3",
          link: `/${parentPath}/section=1-3`,
          node_type: "content",
          level_type: "section",
          number: "1-3",
          node_name: "Purpose and Definitions"
        },
        {
          id: `section-4-6-${parentPath}`,
          citation: "Section 4-6",
          link: `/${parentPath}/section=4-6`,
          node_type: "content",
          level_type: "section",
          number: "4-6",
          node_name: "Filing Requirements"
        }
      ];
      
    default:
      return [];
  }
} 