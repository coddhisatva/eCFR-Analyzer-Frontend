import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface SearchChunk {
  id: string;
  section_id: string;
  content: string;
  chunk_number: number;
  rank: number;
  nodes: {
    id: string;
    level_type: string;
    number: string;
    node_name: string;
    citation: string;
    parent: string | null;
  };
}

interface SearchResult {
  id: string;
  content: string;
  chunkNumber: number;
  rank: number;
  section: {
    id: string;
    levelType: string;
    number: string;
    name: string;
    citation: string;
    parent: string | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // First search just the chunks using the GIN index
    const { data: chunks, error: searchError } = await supabase
      .from('content_chunks')
      .select('id, content, chunk_number, section_id')
      .textSearch('content_tsvector', query, {
        type: 'websearch',
        config: 'english'
      })
      .limit(50);

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to perform search', details: searchError.message },
        { status: 500 }
      );
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        results: [],
        total: 0,
        query
      });
    }

    // Get node information for the chunks we found
    const sectionIds = chunks.map(chunk => chunk.section_id);
    const { data: nodes, error: nodesError } = await supabase
      .from('nodes')
      .select('id, level_type, number, node_name, citation, parent')
      .in('id', sectionIds);

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError);
      return NextResponse.json(
        { error: 'Failed to fetch node information', details: nodesError.message },
        { status: 500 }
      );
    }

    // Create a map of section_id to node for quick lookup
    const nodeMap = new Map(nodes?.map(node => [node.id, node]) || []);

    // Transform results
    const results: SearchResult[] = chunks.map(chunk => {
      const node = nodeMap.get(chunk.section_id);
      if (!node) return null;

      return {
        id: chunk.id,
        content: chunk.content,
        chunkNumber: chunk.chunk_number,
        rank: 0,
        section: {
          id: node.id,
          levelType: node.level_type,
          number: node.number,
          name: node.node_name,
          citation: node.citation,
          parent: node.parent
        }
      };
    }).filter((result): result is SearchResult => result !== null);

    return NextResponse.json({
      results,
      total: results.length,
      query
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: (error as Error).message },
      { status: 500 }
    );
  }
} 