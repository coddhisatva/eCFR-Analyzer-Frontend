"use client";

import { useState } from "react";
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

// Placeholder data structure - will be replaced with real data
const placeholderData: NavNode[] = [
  {
    id: "us/federal/ecfr/title=4",
    type: "title",
    number: "4",
    name: "Accounts",
    path: "/browse/title=4",
    expanded: true,
    children: [
      {
        id: "us/federal/ecfr/title=4/chapter=I",
        type: "chapter",
        number: "I",
        name: "Gov Accountability",
        path: "/browse/title=4/chapter=I",
        expanded: true,
        children: [
          {
            id: "us/federal/ecfr/title=4/chapter=I/subchapter=A",
            type: "subchapter",
            number: "A",
            name: "Personnel",
            path: "/browse/title=4/chapter=I/subchapter=A",
            expanded: false,
          },
          {
            id: "us/federal/ecfr/title=4/chapter=I/subchapter=B",
            type: "subchapter",
            number: "B",
            name: "General",
            path: "/browse/title=4/chapter=I/subchapter=B",
            expanded: true,
            children: [
              {
                id: "us/federal/ecfr/title=4/chapter=I/subchapter=B/section=21-29",
                type: "section",
                number: "21-29",
                name: "Section 21-29",
                path: "/browse/title=4/chapter=I/subchapter=B/section=21-29",
              },
            ],
          },
        ],
      },
      {
        id: "us/federal/ecfr/title=3",
        type: "title",
        number: "3",
        name: "The President",
        path: "/browse/title=3",
        expanded: false,
      },
    ],
  },
];

export function Sidebar({ initialData = placeholderData }: SidebarProps) {
  const [navData, setNavData] = useState(initialData);

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
            <span className="font-semibold">{`${node.type === 'title' ? 'Title' : node.type === 'chapter' ? 'Chapter' : node.type === 'subchapter' ? 'Subchapter' : 'Section'} ${node.number}`}</span>
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
        {navData.map((node) => renderNavNode(node))}
      </div>
    </div>
  );
}