import { NextRequest, NextResponse } from 'next/server';
import { RegulationNode } from '@/types/regulation';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`Missing Supabase configuration. URL: ${!!supabaseUrl}, Key: ${!!supabaseKey}`);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Specify Node.js runtime
export const runtime = 'nodejs';

// Navigation node type (frontend node)
interface NavNode {
  id: string;
  type: string;
  number: string;
  name: string;
  parent?: string;
  path: string;
  expanded?: boolean;
  children?: NavNode[];
  preview?: string;
}

// ----------------------
// Fetching functions
// ----------------------

// Fetch all depth=0 nodes (titles)
async function fetchRootNodes(): Promise<RegulationNode[]> {
  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .eq('depth', 0)
    .order('top_level_title', { ascending: true });

  if (error) {
    console.error('Error fetching root nodes:', error);
    throw error;
  }
  
  if (!data) {
    console.error('No root nodes found');
    throw new Error('No root nodes found');
  }
  
  return data;
}

// Fetch children by parent id
async function fetchChildren(parentId: string): Promise<RegulationNode[]> {
  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .eq('parent', parentId)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch children of ${parentId}: ${error.message}`);
  }

  // For section nodes, fetch the first content chunk
  const nodes = data as RegulationNode[];
  for (let node of nodes) {
    if (node.level_type === 'section') {
      const { data: contentChunks } = await supabase
        .from('content_chunks')
        .select('content')
        .eq('section_id', node.id)
        .order('chunk_number', { ascending: true })
        .limit(1);
      
      if (contentChunks && contentChunks.length > 0) {
        node.preview = contentChunks[0].content;
      }
    }
  }

  return nodes;
}

// ----------------------
// Tree Building
// ----------------------

function toNavNode(node: RegulationNode): NavNode {
  const browsePath = node.id.includes('us/federal/ecfr/')
    ? '/' + node.id.split('us/federal/ecfr/')[1]
    : node.id;

  return {
    id: node.id,
    type: node.level_type || '',
    number: node.number || '',
    name: node.node_name || '',
    parent: node.parent || undefined,
    path: `/browse${browsePath}`,
    expanded: false,
    children: [],
    preview: node.preview
  };
}

// ----------------------
// API Handler
// ----------------------

export async function GET(request: NextRequest) {
  try {
    // Log environment variables (but not the full key)
    console.log('Environment check:', {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_KEY,
      urlStart: process.env.SUPABASE_URL?.substring(0, 10) + '...',
    });

    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('nodes')
      .select('count')
      .limit(1);

    console.log('Supabase connection test:', {
      success: !testError,
      error: testError?.message,
      hasData: !!testData
    });

    const url = new URL(request.url);
    const levels = url.searchParams.get('levels') || '0,1';
    const parentId = url.searchParams.get('parent');

    // If parentId is specified, fetch children of that parent
    if (parentId) {
      const children = await fetchChildren(parentId);
      return NextResponse.json(children.map(toNavNode));
    }

    // Load all depth=0 nodes (titles)
    const rootNodes = await fetchRootNodes();
    const navNodes = rootNodes.map(toNavNode);

    // Only fetch depth=1 if requested
    if (levels.includes('1')) {
      for (const navNode of navNodes) {
        const children = await fetchChildren(navNode.id);
        navNode.children = children.map(toNavNode);
      }
    }

    return NextResponse.json(navNodes);

  } catch (error) {
    console.error('Navigation API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch navigation data', 
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
