import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

export async function GET() {
  try {
    // Get top 5 agencies by num_corrections using index
    const { data: topAgencies } = await supabase
      .from('agencies')
      .select('name, num_corrections')
      .order('num_corrections', { ascending: false })
      .limit(5);

    // Get top 5 nodes by num_corrections using index
    const { data: topNodes } = await supabase
      .from('nodes')
      .select('node_name, num_corrections')
      .order('num_corrections', { ascending: false })
      .limit(5);

    // Get top 5 longest corrections using duration index
    const { data: longestCorrections } = await supabase
      .from('corrections')
      .select('correction_duration, title')
      .not('correction_duration', 'is', null)
      .order('correction_duration', { ascending: false })
      .limit(5);

    // Get corrections by month using error_occurred index
    const { data: monthlyData } = await supabase
      .from('corrections')
      .select('error_occurred')
      .order('error_occurred', { ascending: false });

    const correctionsByMonth: Record<string, number> = {};
    monthlyData?.forEach(correction => {
      const date = new Date(correction.error_occurred);
      const monthKey = date.toISOString().substring(0, 7); // Format: YYYY-MM
      correctionsByMonth[monthKey] = (correctionsByMonth[monthKey] || 0) + 1;
    });

    return NextResponse.json({
      topAgencies: topAgencies?.map(agency => ({
        name: agency.name,
        count: agency.num_corrections
      })) || [],
      topNodes: topNodes?.map(node => ({
        name: node.node_name,
        count: node.num_corrections
      })) || [],
      longestCorrections: longestCorrections?.map(correction => ({
        duration: correction.correction_duration,
        title: `Title ${correction.title}`
      })) || [],
      correctionsByMonth
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
} 