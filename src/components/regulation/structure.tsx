import React from 'react';
import Link from 'next/link';
import { RegulationNode } from '@/types/regulation';

interface RegulationStructureProps {
  nodeInfo: RegulationNode;
  childNodes: RegulationNode[];
}

export default function RegulationStructure({ nodeInfo, childNodes }: RegulationStructureProps) {
  // Group child nodes by their level type for organized display
  const groupedNodes: Record<string, RegulationNode[]> = {};
  
  childNodes.forEach(node => {
    if (!groupedNodes[node.level_type]) {
      groupedNodes[node.level_type] = [];
    }
    groupedNodes[node.level_type].push(node);
  });

  return (
    <div className="mt-4">
      {/* Header for this level */}
      <div className="mb-6">
        <h2 className="text-xl font-bold">{nodeInfo.citation}</h2>
        <h3 className="text-lg mb-4">{nodeInfo.node_name}</h3>
      </div>
      
      {/* Child nodes organized by type */}
      {Object.entries(groupedNodes).map(([levelType, nodes]) => (
        <div key={levelType} className="mb-8">
          <h3 className="text-lg font-semibold mb-3">
            {levelType.charAt(0).toUpperCase() + levelType.slice(1) + 's'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nodes.map(node => (
              <Link 
                key={node.id}
                href={`/browse${node.link}`}
                className="p-3 border rounded-md hover:bg-gray-50 transition-colors block"
              >
                <div className="font-medium">{node.citation}</div>
                <div className="text-sm text-gray-600 truncate">{node.node_name}</div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Show message if no child nodes found */}
      {childNodes.length === 0 && (
        <div className="p-4 border rounded-md bg-gray-50 text-center">
          No child elements found at this level.
        </div>
      )}
    </div>
  );
} 