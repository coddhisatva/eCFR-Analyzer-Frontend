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

// Simplified tree-building function
function buildNavigationTree(nodes: RegulationNode[]): NavNode[] {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  // Create a map for quick lookup of nodes by their ID
  const nodeMap = new Map<string, NavNode>();
  
  // First pass: Create NavNode objects for each regulation node
  nodes.forEach(node => {
    if (!node.id) return;

    // Create the browsing path
    const browsePath = node.id.includes('us/federal/ecfr/') 
      ? '/' + node.id.split('us/federal/ecfr/')[1]
      : node.id;

    // Create the NavNode
    const navNode: NavNode = {
      id: node.id,
      type: node.level_type || '',
      number: node.number || '',
      name: node.node_name || '',
      path: `/browse${browsePath}`,
      expanded: false,
      children: []
    };
    
    nodeMap.set(node.id, navNode);
  });
  
  // Get only the title nodes as our root nodes
  const rootNodes: NavNode[] = [];
  nodes.forEach(node => {
    if (node.level_type === 'title' && nodeMap.has(node.id)) {
      rootNodes.push(nodeMap.get(node.id)!);
    }
  });
  
  // Build the child relationships - this is key for hierarchy
  nodes.forEach(node => {
    // Skip if it's a title (already in rootNodes) or doesn't have a parent
    if (node.level_type === 'title' || !node.parent || !nodeMap.has(node.id)) return;
    
    // Get the current node and check if the parent exists
    const navNode = nodeMap.get(node.id)!;
    if (nodeMap.has(node.parent)) {
      // Add this node as a child of its parent
      const parentNavNode = nodeMap.get(node.parent)!;
      parentNavNode.children.push(navNode);
    }
  });
  
  // Helper function to sort nodes at each level
  const sortLevel = (nodes: NavNode[]): NavNode[] => {
    return nodes.sort((a, b) => {
      // Define order by level_type first
      const typeOrder = {
        'title': 0,
        'chapter': 1,
        'subchapter': 2,
        'part': 3,
        'subpart': 4,
        'section': 5
      };
      
      // If types are different, sort by type order
      if (a.type !== b.type) {
        return (typeOrder[a.type as keyof typeof typeOrder] || 999) - 
               (typeOrder[b.type as keyof typeof typeOrder] || 999);
      }
      
      // If types are the same, sort by number
      // Extract numeric part for proper numeric sorting
      const aNum = parseInt(a.number.replace(/\D/g, ''));
      const bNum = parseInt(b.number.replace(/\D/g, ''));
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      
      // Fallback to string comparison with numeric sorting
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  };
  
  // Recursively sort the entire tree
  const sortTreeRecursively = (nodes: NavNode[]): NavNode[] => {
    // Sort current level
    const sortedNodes = sortLevel(nodes);
    
    // Sort each node's children recursively
    sortedNodes.forEach(node => {
      if (node.children.length > 0) {
        node.children = sortTreeRecursively(node.children);
      }
    });
    
    return sortedNodes;
  };
  
  // Return the sorted tree
  return sortTreeRecursively(rootNodes);
}

// Fetch regulation nodes directly from Supabase
async function fetchRegulationNodes(): Promise<RegulationNode[]> {
  try {
    // First, query specifically for title nodes by ID pattern
    const { data: titleData, error: titleError } = await supabase
      .from('nodes')
      .select('*')
      .ilike('id', '%/title=%')
      .not('id', 'ilike', '%/chapter=%')
      .not('id', 'ilike', '%/part=%')
      .not('id', 'ilike', '%/section=%')
      .not('id', 'ilike', '%/subpart=%')
      .not('id', 'ilike', '%/subchap=%');
    
    if (titleError) {
      throw titleError;
    }
    
    // Then query for the rest of the nodes
    const { data: otherData, error: otherError } = await supabase
      .from('nodes')
      .select('*')
      .limit(100000);
    
    if (otherError) {
      throw otherError;
    }
    
    // Combine the datasets, with titles taking precedence
    const titleIds = new Set(titleData?.map(node => node.id) || []);
    const otherFilteredData = (otherData || []).filter(node => !titleIds.has(node.id));
    const data = [...(titleData || []), ...(otherFilteredData || [])];
    
    console.log(`Fetched ${titleData?.length || 0} title nodes and ${otherFilteredData.length} other nodes (total: ${data.length})`);
    
    // Debug: identify what level types are actually in the database
    const levelTypes = new Set<string>();
    data?.forEach(node => {
      if (node.level_type) {
        levelTypes.add(node.level_type.toLowerCase());
      }
    });
    
    console.log('Available level types in database:', Array.from(levelTypes).join(', '));
    console.log('Title nodes:', titleData?.map(n => `${n.number} - ${n.node_name}`).join(', ') || 'None');
    
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