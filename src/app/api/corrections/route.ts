import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');

    if (!start_date || !end_date) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    // Use the corrections_occurred_idx index for efficient date range filtering
    const { data: corrections, error } = await supabase
      .from('corrections')
      .select(`
        id,
        error_occurred,
        error_corrected,
        correction_duration,
        nodes!inner (
          id,
          citation,
          node_name
        ),
        agencies!inner (
          id,
          name
        )
      `)
      .gte('error_occurred', start_date)
      .lte('error_occurred', end_date)
      .order('error_occurred', { ascending: false });

    if (error) {
      console.error('Error fetching corrections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch corrections' },
        { status: 500 }
      );
    }

    return NextResponse.json({ corrections });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 