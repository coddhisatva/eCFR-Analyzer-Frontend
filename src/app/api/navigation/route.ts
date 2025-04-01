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
    // Skip nodes with invalid data
    if (!node.id || !node.level_type) return;

    // Create a path for browsing based on the id (which has the correct format)
    // The id follows the pattern us/federal/ecfr/title=4 which we can use for navigation
    const browsePath = node.id.includes('us/federal/ecfr/') 
      ? '/' + node.id.split('us/federal/ecfr/')[1]  // Extract the path part after the prefix
      : node.id;  // Fallback to the id itself if it doesn't match the pattern

    // Create a simplified version for the tree
    const navNode: NavNode = {
      id: node.id,
      type: node.level_type,
      number: node.number || '',
      name: node.node_name || '',
      path: `/browse${browsePath}`,
      expanded: false, // Default to collapsed
      children: []
    };
    
    nodeMap.set(node.id, navNode);
  });
  
  // Second pass: Build the tree structure based on parent-child relationships
  const rootNodes: NavNode[] = [];
  
  // First, identify nodes that represent titles by their level_type
  nodes.forEach(node => {
    if (!node.id || !nodeMap.has(node.id)) return;
    
    // Only add nodes with level_type 'title' as root nodes
    if (node.level_type === 'title') {
      rootNodes.push(nodeMap.get(node.id));
      console.log(`Added title as root: ${node.number} - ${node.node_name} (${node.id})`);
    }
  });
  
  console.log(`Found ${rootNodes.length} title nodes to use as roots`);
  
  // Now build child relationships for all non-root nodes
  nodes.forEach(node => {
    if (!node.id || !nodeMap.has(node.id)) return;
    
    // Skip nodes that are already root nodes
    if (rootNodes.includes(nodeMap.get(node.id))) return;
    
    const navNode = nodeMap.get(node.id);
    const hasValidParent = node.parent && nodeMap.has(node.parent);
    
    // If this node has a parent and the parent exists in our map
    if (hasValidParent) {
      // Add this node as a child of its parent
      const parentNavNode = nodeMap.get(node.parent);
      if (!parentNavNode.children) {
        parentNavNode.children = [];
      }
      parentNavNode.children.push(navNode);
    }
  });
  
  // Debug: what are we using as root nodes?
  rootNodes.forEach(node => {
    console.log(`Root node: ${node.type} ${node.number} (${node.id})`);
  });
  
  // Sort all nodes by their number (converting to number if possible for correct sorting)
  const sortNodes = (nodes: NavNode[]): NavNode[] => {
    if (!nodes || nodes.length === 0) return [];
    
    return nodes.sort((a, b) => {
      // Try to parse numbers for numeric sorting
      const aNum = parseInt(a.number.replace(/\D/g, ''));
      const bNum = parseInt(b.number.replace(/\D/g, ''));
      
      // If both are valid numbers, sort numerically
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      
      // Otherwise, sort alphanumerically
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  };
  
  // Process the entire tree recursively to sort each level
  const processTree = (nodes: NavNode[]): NavNode[] => {
    // Sort current level
    const sortedNodes = sortNodes(nodes);
    
    // Process children recursively
    sortedNodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        node.children = processTree(node.children);
      }
    });
    
    return sortedNodes;
  };
  
  // Get the final sorted tree
  const sortedTree = processTree(rootNodes);
  
  // Log some stats for debugging
  console.log(`Built navigation tree with ${sortedTree.length} root nodes (titles)`);
  
  return sortedTree;
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