import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );

    // Fetch root agencies (where parent_id is null)
    const { data: agencies, error } = await supabase
      .from('agencies')
      .select('*')
      .is('parent_id', null)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching agencies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agencies' },
        { status: 500 }
      );
    }

    return NextResponse.json(agencies);
  } catch (error) {
    console.error('Error in agencies route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 