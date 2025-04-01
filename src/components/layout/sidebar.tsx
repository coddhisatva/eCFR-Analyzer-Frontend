"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

type NavNode = {
  id: string;
  type: string;
  number: string;
  name: string;
  children?: NavNode[];
  path: string;
  expanded?: boolean;
};

interface SidebarProps {
  initialData?: NavNode[];
}

// Placeholder data - only used if API call fails
const placeholderData: NavNode[] = [];

export function Sidebar({ initialData = placeholderData }: SidebarProps) {
  const [navData, setNavData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch navigation data on component mount
  useEffect(() => {
    async function fetchNavigationData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/navigation');
        
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
    
    fetchNavigationData();
  }, []);

  const toggleNode = (nodeId: string) => {
    const updateNodes = (nodes: NavNode[]): NavNode[] => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateNodes(node.children) };
        }
        return node;
      });
    };

    setNavData(updateNodes(navData));
  };

  const renderNavNode = (node: NavNode, depth = 0) => {
    const hasChildren = !!node.children?.length;
    const paddingLeft = `${(depth + 1) * 0.75}rem`;

    return (
      <div key={node.id} className="w-full">
        <div 
          className={`flex items-center py-2 px-2 hover:bg-gray-100 rounded-md cursor-pointer text-sm`}
          style={{ paddingLeft }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <span className="mr-1">
              {node.expanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </span>
          )}
          <Link 
            href={node.path}
            className="flex-1 truncate"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-semibold">{`${node.type === 'title' ? 'Title' : node.type === 'chapter' ? 'Chapter' : node.type === 'subchapter' ? 'Subchapter' : node.type === 'part' ? 'Part' : 'Section'} ${node.number}`}</span>
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