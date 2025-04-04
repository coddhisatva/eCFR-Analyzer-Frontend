import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
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
    const titles = url.searchParams.getAll('titles[]').map(t => parseInt(t));
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // First try exact section number match
    let exactQuery = supabase
      .from('nodes')
      .select(`
        id,
        level_type,
        number,
        node_name,
        citation,
        parent,
        content_chunks!inner (
          id,
          content,
          chunk_number
        )
      `)
      .eq('number', query)
      .eq('node_type', 'content')
      .limit(5);

    // Apply title filter if titles are selected
    if (titles.length > 0) {
      exactQuery = exactQuery.in('top_level_title', titles);
    }

    const { data: exactMatches, error: exactError } = await exactQuery;

    if (exactError) {
      console.error('Exact match search error:', exactError);
    }

    // Then do content search with optimized filtering
    let contentQuery = supabase
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
      .textSearch('content_tsvector', query.split(/\s+/).join(' & '))
      .eq('nodes.node_type', 'content');

    // Apply title filter directly using the index
    if (titles.length > 0) {
      contentQuery = contentQuery.in('nodes.top_level_title', titles);
    }

    const { data: contentMatches, error: contentError } = await contentQuery
      .limit(5);

    if (contentError) {
      console.error('Content search error:', contentError);
      return NextResponse.json(
        { error: 'Failed to perform search', details: contentError.message },
        { status: 500 }
      );
    }

    // Combine results
    const allChunks = [
      ...(exactMatches?.flatMap(node => node.content_chunks) || []),
      ...(contentMatches || [])
    ];

    // Remove duplicates
    const uniqueChunks = Array.from(
      new Map(allChunks.map(chunk => [chunk.id, chunk])).values()
    );

    // Transform results
    const results: SearchResult[] = uniqueChunks.map(chunk => {
      const typedChunk = chunk as unknown as SearchChunk;
      return {
        id: typedChunk.id,
        content: typedChunk.content,
        chunkNumber: typedChunk.chunk_number,
        rank: exactMatches?.some(node => 
          node.content_chunks.some(c => c.id === typedChunk.id)
        ) ? 1 : 0,
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

    // Sort by rank (exact matches first)
    results.sort((a, b) => b.rank - a.rank);

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