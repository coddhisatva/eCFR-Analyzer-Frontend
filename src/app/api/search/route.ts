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

    // First, get content nodes that match the search query
    const { data: chunks, error: searchError } = await supabase
      .from('content_chunks')
      .select(`
        id,
        section_id,
        content,
        chunk_number,
        nodes!content_chunks_section_id_fkey (
          id,
          level_type,
          number,
          node_name,
          citation,
          parent
        )
      `)
      .textSearch('content_tsvector', query)
      .order('section_id')
      .order('chunk_number')
      .limit(50);

    if (searchError) {
      return NextResponse.json(
        { error: 'Failed to perform search' },
        { status: 500 }
      );
    }

    // Transform the results to include highlighted matches
    const results: SearchResult[] = (chunks as SearchChunk[] || []).map(chunk => ({
      id: chunk.id,
      content: chunk.content,
      chunkNumber: chunk.chunk_number,
      section: {
        id: chunk.nodes.id,
        levelType: chunk.nodes.level_type,
        number: chunk.nodes.number,
        name: chunk.nodes.node_name,
        citation: chunk.nodes.citation,
        parent: chunk.nodes.parent
      }
    }));

    return NextResponse.json({
      results,
      total: results.length,
      query
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed', details: (error as Error).message },
      { status: 500 }
    );
  }
} 