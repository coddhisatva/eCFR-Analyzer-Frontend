import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );

    // Fetch total metrics
    const { data: totalMetrics, error: metricsError } = await supabase
      .from('agencies')
      .select(`
        count,
        num_sections,
        num_words,
        num_corrections
      `);

    if (metricsError) {
      console.error('Error fetching total metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch total metrics' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totals = totalMetrics.reduce((acc, agency) => ({
      totalAgencies: acc.totalAgencies + 1,
      totalSections: acc.totalSections + (agency.num_sections || 0),
      totalWords: acc.totalWords + (agency.num_words || 0),
      totalCorrections: acc.totalCorrections + (agency.num_corrections || 0)
    }), {
      totalAgencies: 0,
      totalSections: 0,
      totalWords: 0,
      totalCorrections: 0
    });

    // Fetch top agencies by corrections
    const { data: topByCorrections, error: correctionsError } = await supabase
      .from('agencies')
      .select('name, num_corrections')
      .order('num_corrections', { ascending: false })
      .limit(5);

    if (correctionsError) {
      console.error('Error fetching top agencies by corrections:', correctionsError);
      return NextResponse.json(
        { error: 'Failed to fetch top agencies by corrections' },
        { status: 500 }
      );
    }

    // Fetch top agencies by sections
    const { data: topBySections, error: sectionsError } = await supabase
      .from('agencies')
      .select('name, num_sections')
      .order('num_sections', { ascending: false })
      .limit(5);

    if (sectionsError) {
      console.error('Error fetching top agencies by sections:', sectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch top agencies by sections' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      totalMetrics: totals,
      topAgenciesByCorrections: topByCorrections.map(agency => ({
        name: agency.name,
        count: agency.num_corrections
      })),
      topAgenciesBySections: topBySections.map(agency => ({
        name: agency.name,
        count: agency.num_sections
      }))
    });
  } catch (error) {
    console.error('Error in agencies analytics route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 