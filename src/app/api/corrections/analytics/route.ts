import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

export async function GET() {
  try {
    // Get total count of corrections
    const { count: totalCorrections } = await supabase
      .from('corrections')
      .select('*', { count: 'exact', head: true });

    // Get average duration
    const { data: avgData } = await supabase
      .from('corrections')
      .select('correction_duration')
      .not('correction_duration', 'is', null)
      .gt('correction_duration', 0);
    
    const averageDuration = avgData && avgData.length > 0 
      ? Math.round(avgData.reduce((acc, curr) => acc + (curr.correction_duration || 0), 0) / avgData.length)
      : 0;

    // Get corrections by month, ordered by date
    const { data: monthlyData } = await supabase
      .from('corrections')
      .select('error_occurred')
      .not('error_occurred', 'is', null)
      .order('error_occurred', { ascending: false });

    const correctionsByMonth: Record<string, number> = {};
    let mostActiveMonth = { month: '', count: 0 };

    monthlyData?.forEach(correction => {
      const month = new Date(correction.error_occurred).toLocaleString('default', {
        month: 'long',
        year: 'numeric'
      });
      correctionsByMonth[month] = (correctionsByMonth[month] || 0) + 1;
      
      if (correctionsByMonth[month] > mostActiveMonth.count) {
        mostActiveMonth = { month, count: correctionsByMonth[month] };
      }
    });

    // Get longest correction
    const { data: longestData } = await supabase
      .from('corrections')
      .select(`
        correction_duration,
        title,
        agency_id,
        agencies!corrections_agency_id_fkey (
          name
        )
      `)
      .gt('correction_duration', 0)
      .order('correction_duration', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      totalMetrics: {
        totalCorrections: totalCorrections || 0,
        averageDuration,
        mostActiveMonth,
        longestCorrection: longestData ? {
          duration: longestData.correction_duration,
          title: `Title ${longestData.title}`,
          agency: longestData.agencies?.name || ''
        } : null
      },
      correctionsByMonth
    });
  } catch (error) {
    console.error('Error in corrections analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 