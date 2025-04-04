import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  try {
    // First get the node ID from the path
    const { data: nodeInfo, error: nodeError } = await supabase
      .rpc('get_node_by_path', { path_param: path });

    if (nodeError || !nodeInfo) {
      console.error('Error fetching node:', nodeError);
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    // Then get the recent corrections for this node
    const { data: corrections, error: correctionsError } = await supabase
      .from('corrections')
      .select(`
        id,
        error_occurred,
        error_corrected,
        correction_duration,
        nodes:node_id (
          node_name,
          level_type,
          number
        )
      `)
      .eq('node_id', nodeInfo.id)
      .order('error_occurred', { ascending: false })
      .limit(5);

    if (correctionsError) {
      console.error('Error fetching corrections:', correctionsError);
      return NextResponse.json({ error: correctionsError.message }, { status: 500 });
    }

    return NextResponse.json({ corrections });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 