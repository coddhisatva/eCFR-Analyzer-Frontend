import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
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

    // First get the CFR references
    const { data: references, error: referencesError } = await supabase
      .from('cfr_references')
      .select('*')
      .eq('agency_id', params.id)
      .order('ordinal', { ascending: true });

    if (referencesError) {
      console.error('Error fetching CFR references:', referencesError);
      return NextResponse.json(
        { error: 'Failed to fetch CFR references' },
        { status: 500 }
      );
    }

    // Then fetch the corresponding nodes
    const nodeIds = references?.map(ref => ref.node_id) || [];
    const { data: nodes, error: nodesError } = await supabase
      .from('nodes')
      .select('*')
      .in('id', nodeIds);

    if (nodesError) {
      console.error('Error fetching nodes:', nodesError);
      return NextResponse.json(
        { error: 'Failed to fetch nodes' },
        { status: 500 }
      );
    }

    // Create a map of node data
    const nodeMap = new Map(nodes?.map(node => [node.id, node]) || []);

    // Combine the reference data with node data
    const referencesWithNodes = references?.map(ref => ({
      ...ref,
      node: nodeMap.get(ref.node_id)
    })) || [];

    return NextResponse.json({
      agency,
      children: children || [],
      references: referencesWithNodes
    });
  } catch (error) {
    console.error('Error in agency route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 