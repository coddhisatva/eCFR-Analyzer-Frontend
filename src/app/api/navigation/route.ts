import { NextRequest, NextResponse } from 'next/server';
import { RegulationNode } from '@/types/regulation';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    return [];
  }
  return data as RegulationNode[];
}

// Fetch children by parent id
async function fetchChildren(parentId: string): Promise<RegulationNode[]> {
  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .eq('parent', parentId)
    .order('display_order', { ascending: true });

  if (error) {
    console.error(`Error fetching children of ${parentId}:`, error);
    return [];
  }
  return data as RegulationNode[];
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
    children: []
  };
}

// ----------------------
// API Handler
// ----------------------

// Handles initial load: returns root nodes (depth = 0) + optionally preload depth = 1
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const levels = url.searchParams.get('levels') || '0,1'; // Default to 0,1 if not specified
  const parentId = url.searchParams.get('parent');

  try {
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
    console.error('Error building navigation tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch navigation data' },
      { status: 500 }
    );
  }
}
