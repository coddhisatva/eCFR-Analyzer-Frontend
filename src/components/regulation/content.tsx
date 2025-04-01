import React from 'react';
import { RegulationNode } from '@/types/regulation';

interface RegulationContentProps {
  content: string[];
  nodeInfo: RegulationNode;
}

export default function RegulationContent({ content, nodeInfo }: RegulationContentProps) {
  return (
    <div className="mt-4">
      {/* Display section header info */}
      <div className="mb-6">
        <h2 className="text-xl font-bold">{nodeInfo.citation}</h2>
        <h3 className="text-lg">{nodeInfo.node_name}</h3>
      </div>
      
      {/* Display content chunks */}
      <div className="prose prose-blue max-w-none">
        {content.map((chunk, index) => (
          <div 
            key={`content-${nodeInfo.id}-${index}`}
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: chunk }}
          />
        ))}
      </div>
    </div>
  );
} 