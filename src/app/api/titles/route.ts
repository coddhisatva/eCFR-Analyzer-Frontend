import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

export async function GET() {
  try {
    const { data: titles, error } = await supabase
      .from('nodes')
      .select('number, node_name')
      .eq('depth', 0)
      .order('number');

    if (error) {
      console.error('Error fetching titles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch titles' },
        { status: 500 }
      );
    }

    return NextResponse.json(titles);
  } catch (error) {
    console.error('Error in titles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 