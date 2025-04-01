import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { RegulationNode } from '@/types/regulation';

// Interface for content chunks from the database
interface ContentChunk {
  id: string;
  node_id: string;
  content: string;
  chunk_index: number;
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
    const path = url.searchParams.get('path');
    
    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }
    
    // Ensure path is properly decoded (in case it was encoded in the URL)
    const decodedPath = decodeURIComponent(path);
    
    // Log the request for debugging
    console.log('Received path request:', decodedPath);

    // Parse path segments to identify the node
    const pathSegments = decodedPath.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1] || '';
    const [levelType, number] = lastSegment.split('=');
    
    console.log(`Looking up ${levelType} with number ${number}`);

    // First, get the node info
    const { data: nodeInfo, error: nodeError } = await supabase
      .from('nodes')
      .select('*')
      .eq('level_type', levelType)
      .eq('number', number)
      .single();
    
    if (nodeError) {
      throw new Error(`Error fetching node: ${nodeError.message}`);
    }
    
    // If this is a content node, fetch the content chunks
    let content: string[] = [];
    if (nodeInfo.node_type === 'content') {
      const { data: contentChunks, error: contentError } = await supabase
        .from('content_chunks')
        .select('*')
        .eq('node_id', nodeInfo.id)
        .order('chunk_index', { ascending: true });
      
      if (contentError) {
        throw new Error(`Error fetching content: ${contentError.message}`);
      }
      
      // Extract content from chunks
      content = contentChunks.map((chunk: ContentChunk) => chunk.content);
    }
    
    // Get child nodes if this is a structure node
    let childNodes: RegulationNode[] = [];
    if (nodeInfo.node_type === 'structure') {
      const { data: children, error: childrenError } = await supabase
        .from('nodes')
        .select('*')
        .eq('parent', nodeInfo.id);
      
      if (childrenError) {
        throw new Error(`Error fetching child nodes: ${childrenError.message}`);
      }
      
      childNodes = children as RegulationNode[];
    }
    
    // Return the complete regulation data
    return NextResponse.json({
      nodeInfo,
      content,
      childNodes
    });
    
  } catch (error) {
    console.error('Error fetching regulation data:', error);
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