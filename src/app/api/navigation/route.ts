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
  
  nodes.forEach(node => {
    // Skip invalid nodes
    if (!node.id || !nodeMap.has(node.id)) return;
    
    const navNode = nodeMap.get(node.id);
    
    // Check if this node has a parent that exists in our map
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
    // Consider this a root node if:
    // 1. It has no parent or the parent doesn't exist in our dataset, AND
    // 2. Its level_type contains "title" (case-insensitive)
    else if (node.level_type && node.level_type.toLowerCase().includes('title')) {
      rootNodes.push(navNode);
    }
  });
  
  // If we didn't find any titles, check if we need to be more flexible
  if (rootNodes.length === 0) {
    console.log('No title nodes found using strict criteria, checking for top-level nodes...');
    
    // Identify nodes that don't have parents (or their parents don't exist in our data)
    // These might be top-level nodes we can treat as roots
    nodes.forEach(node => {
      if (!node.id || !nodeMap.has(node.id)) return;
      
      const navNode = nodeMap.get(node.id);
      const hasValidParent = node.parent && nodeMap.has(node.parent);
      
      if (!hasValidParent && !rootNodes.includes(navNode)) {
        console.log(`Adding top-level node as root: ${node.level_type} ${node.number} (${node.id})`);
        rootNodes.push(navNode);
      }
    });
  }
  
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
    // Fetch all nodes from the nodes table
    const { data, error } = await supabase
      .from('nodes')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} nodes from Supabase`);
    
    // Debug: identify what level types are actually in the database
    const levelTypes = new Set<string>();
    data?.forEach(node => {
      if (node.level_type) {
        levelTypes.add(node.level_type.toLowerCase());
      }
    });
    
    console.log('Available level types in database:', Array.from(levelTypes).join(', '));
    
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