import { NextRequest, NextResponse } from 'next/server';
import { RegulationNode } from '@/types/regulation';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Type for the navigation tree node structure
interface NavNode {
  id: string;
  type: string;
  number: string;
  name: string;
  children?: NavNode[];
  path: string;
  expanded?: boolean;
}

// Function to build a tree from flat database nodes
function buildNavigationTree(nodes: RegulationNode[]): NavNode[] {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  // Create a map for quick lookup of nodes by their ID
  const nodeMap = new Map();
  
  // First pass: Create NavNode objects for each regulation node
  nodes.forEach(node => {
    // Create a simplified version for the tree
    const navNode: NavNode = {
      id: node.id,
      type: node.level_type,
      number: node.number,
      name: node.node_name,
      path: `/browse${node.link}`,
      expanded: false, // Default to collapsed
      children: []
    };
    
    nodeMap.set(node.id, navNode);
  });
  
  // Second pass: Build the tree structure
  const rootNodes: NavNode[] = [];
  
  nodes.forEach(node => {
    const navNode = nodeMap.get(node.id);
    
    if (node.parent && nodeMap.has(node.parent)) {
      // This node has a parent, add it as a child
      const parentNavNode = nodeMap.get(node.parent);
      if (!parentNavNode.children) {
        parentNavNode.children = [];
      }
      parentNavNode.children.push(navNode);
    } else {
      // This is a root node (no parent or parent not in our dataset)
      rootNodes.push(navNode);
    }
  });
  
  // Sort children by their level type and number
  const sortNavNodes = (nodes: NavNode[]) => {
    if (!nodes) return [];
    
    return nodes.sort((a, b) => {
      // First sort by type if different
      if (a.type !== b.type) {
        // Define a type order for sorting
        const typeOrder: Record<string, number> = {
          'title': 1,
          'chapter': 2,
          'subchapter': 3,
          'part': 4,
          'section': 5
        };
        return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      }
      
      // Then sort by number if type is the same
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  };
  
  // Sort the children recursively
  const processSorting = (nodes: NavNode[]) => {
    if (!nodes) return [];
    
    const sortedNodes = sortNavNodes(nodes);
    
    sortedNodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        node.children = processSorting(node.children);
      }
    });
    
    return sortedNodes;
  };
  
  return processSorting(rootNodes);
}

// Fetch regulation nodes directly from Supabase
async function fetchRegulationNodes(): Promise<RegulationNode[]> {
  try {
    // Fetch all nodes from the nodes table
    const { data, error } = await supabase
      .from('nodes')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Fetched ${data.length} nodes from Supabase`);
    return data as RegulationNode[];
  } catch (error) {
    console.error('Error fetching regulation nodes from Supabase:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Fetch nodes from Supabase
    const nodes = await fetchRegulationNodes();
    
    // Build the navigation tree
    const navTree = buildNavigationTree(nodes);
    
    // Set initial expanded state for better UX
    // Expand the first title by default
    if (navTree.length > 0) {
      navTree[0].expanded = true;
    }
    
    return NextResponse.json(navTree);
  } catch (error) {
    console.error('Error building navigation tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch navigation data' },
      { status: 500 }
    );
  }
} 