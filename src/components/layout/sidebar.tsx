"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

type NavNode = {
  id: string;
  type: string;
  number: string;
  name: string;
  children?: NavNode[];
  path: string;
  expanded?: boolean;
  isLoading?: boolean;
};

interface SidebarProps {
  initialData?: NavNode[];
}

// Empty placeholder - will be populated from API
const placeholderData: NavNode[] = [];

export function Sidebar({ initialData = placeholderData }: SidebarProps) {
  const [navData, setNavData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load - just get depth 0 and 1
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/navigation?levels=0,1');
        
        if (!response.ok) {
          throw new Error('Failed to fetch navigation data');
        }
        
        const data = await response.json();
        setNavData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching navigation:', err);
        setError('Failed to load navigation. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchInitialData();
  }, []);

  // Function to load deeper levels when a node is expanded
  const loadDeeperLevels = async (nodeId: string) => {
    try {
      // Set loading state for this node
      setNavData(prevData => {
        const updateNodes = (nodes: NavNode[]): NavNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, isLoading: true };
            }
            if (node.children) {
              return { ...node, children: updateNodes(node.children) };
            }
            return node;
          });
        };
        return updateNodes(prevData);
      });

      const response = await fetch(`/api/navigation?parent=${nodeId}`);
      const newChildren = await response.json();
      
      // Update the navData with the new children
      setNavData(prevData => {
        const updateNodes = (nodes: NavNode[]): NavNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, children: newChildren, isLoading: false };
            }
            if (node.children) {
              return { ...node, children: updateNodes(node.children) };
            }
            return node;
          });
        };
        return updateNodes(prevData);
      });
    } catch (err) {
      console.error('Error loading deeper levels:', err);
      // Reset loading state on error
      setNavData(prevData => {
        const updateNodes = (nodes: NavNode[]): NavNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, isLoading: false };
            }
            if (node.children) {
              return { ...node, children: updateNodes(node.children) };
            }
            return node;
          });
        };
        return updateNodes(prevData);
      });
    }
  };

  const toggleNode = (nodeId: string) => {
    const updateNodes = (nodes: NavNode[]): NavNode[] => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          const newExpanded = !node.expanded;
          if (newExpanded && (!node.children || node.children.length === 0)) {
            // If expanding and no children loaded yet, load them
            loadDeeperLevels(nodeId);
          }
          return { ...node, expanded: newExpanded };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };

    setNavData(updateNodes(navData));
  };

  // Format the node label for display
  const formatNodeLabel = (node: NavNode): string => {
    // Special formatting for different node types
    switch (node.type) {
      case 'title':
        return `Title ${node.number}`;
      case 'chapter':
        return `Chapter ${node.number}`;
      case 'subchapter':
        return `Subchapter ${node.number}`;
      case 'part':
        return `Part ${node.number}`;
      case 'section':
        return `Section ${node.number}`;
      default:
        return `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} ${node.number}`;
    }
  };

  const renderNavNode = (node: NavNode, depth = 0) => {
    const hasChildren = node.children !== undefined;
    const isFetchingChildren = node.isLoading;
    const paddingLeft = `${(depth + 1) * 0.75}rem`;
    const nodeLabel = formatNodeLabel(node);

    return (
      <div key={node.id} className="w-full">
        <div 
          className={`flex items-center py-2 px-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm`}
          style={{ paddingLeft }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <span className="mr-1">
              {isFetchingChildren ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : node.expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          <Link 
            href={node.path}
            className="flex-1 truncate"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-semibold">{nodeLabel}</span>
            {node.name && `: ${node.name}`}
          </Link>
        </div>

        {node.expanded && node.children && (
          <div className="ml-2">
            {node.children.map((child) => renderNavNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50">
      <div className="p-4 font-semibold text-lg border-b">
        Browse Regulations
      </div>
      <div className="p-2">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading navigation...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            {error}
          </div>
        ) : navData.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No regulation data available
          </div>
        ) : (
          navData.map((node) => renderNavNode(node))
        )}
      </div>
    </div>
  );
}