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

    // Use the GIN index on content_tsvector for primary search
    const { data: chunks, error: searchError } = await supabase
      .from('content_chunks')
      .select(`
        id,
        content,
        chunk_number,
        section_id,
        nodes!inner (
          id,
          level_type,
          number,
          node_name,
          citation,
          parent
        )
      `)
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

    // Transform results
    const results: SearchResult[] = (chunks || []).map(chunk => {
      const typedChunk = chunk as unknown as SearchChunk;
      return {
        id: typedChunk.id,
        content: typedChunk.content,
        chunkNumber: typedChunk.chunk_number,
        rank: 0, // All results are ranked equally for now
        section: {
          id: typedChunk.nodes.id,
          levelType: typedChunk.nodes.level_type,
          number: typedChunk.nodes.number,
          name: typedChunk.nodes.node_name,
          citation: typedChunk.nodes.citation,
          parent: typedChunk.nodes.parent
        }
      };
    });

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