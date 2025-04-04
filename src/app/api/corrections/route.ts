import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const start_date = url.searchParams.get('start_date');
  const end_date = url.searchParams.get('end_date');

  console.log('Fetching corrections with dates:', { start_date, end_date });

  if (!start_date || !end_date) {
    return NextResponse.json({ error: 'Missing start_date or end_date' }, { status: 400 });
  }

  try {
    let query = supabase
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
      .gte('error_occurred', start_date)
      .lte('error_occurred', end_date)
      .order('error_occurred', { ascending: false });
    
    const { data: corrections, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Found ${corrections?.length || 0} corrections`);
    
    return NextResponse.json({ corrections });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 