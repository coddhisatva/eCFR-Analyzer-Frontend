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

    return NextResponse.json({
      agency,
      children: children || []
    });
  } catch (error) {
    console.error('Error in agency route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 