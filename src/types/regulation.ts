// Types for regulation data based on the database schema

export interface RegulationNode {
  id: string;
  citation: string;
  link: string;
  node_type: 'structure' | 'content';
  level_type: string;
  number: string;
  node_name: string;
  parent?: string;
  metadata?: Record<string, any>;
}

export interface ContentChunk {
  id: string;
  section_id: string;
  content: string;
  chunk_number: number;
  content_tsvector?: any;  // Adding this as it's in the DB but we might not use it directly
  metadata?: Record<string, any>;
}

export interface RegulationData {
  nodeInfo: RegulationNode;
  content: string[];
  childNodes: RegulationNode[];
}

// Form of path parameters in the URL
export interface RegulationPathParams {
  path: string[];
}

// For Next.js 15 compatibility 
export type NextJsPageParams = Promise<RegulationPathParams>; 