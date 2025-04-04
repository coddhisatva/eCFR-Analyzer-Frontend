import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_KEY || ''
    );

    // Fetch the agency details
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', params.id)
      .single();

    if (agencyError) {
      console.error('Error fetching agency:', agencyError);
      return NextResponse.json(
        { error: 'Failed to fetch agency' },
        { status: 500 }
      );
    }

    if (!agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    // Fetch child agencies
    const { data: children, error: childrenError } = await supabase
      .from('agencies')
      .select('*')
      .eq('parent_id', params.id)
      .order('name', { ascending: true });

    if (childrenError) {
      console.error('Error fetching child agencies:', childrenError);
      return NextResponse.json(
        { error: 'Failed to fetch child agencies' },
        { status: 500 }
      );
    }

    // Get all nodes mapped to this agency using the agency index
    const { data: nodes, error: nodesError } = await supabase
      .from('agency_node_mappings')
      .select(`
        nodes (*)
      `)
      .eq('agency_id', params.id);

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError);
      return NextResponse.json(
        { error: 'Failed to fetch nodes' },
        { status: 500 }
      );
    }

    // Store the ID to avoid using params.id in the map function
    const agencyId = params.id;

    // Convert nodes into references format to maintain compatibility
    const references = (nodes || []).map((record: any, index) => ({
      id: `${agencyId}_${record.nodes.id}`,  // Generate a unique reference ID
      agency_id: agencyId,
      node_id: record.nodes.id,
      ordinal: index,
      node: record.nodes
    }));

    return NextResponse.json({
      agency,
      children: children || [],
      references
    });
  } catch (error) {
    console.error('Error in agency route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 