import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );

    // Get total count of agencies
    const { count: totalAgencies } = await supabase
      .from('agencies')
      .select('*', { count: 'exact', head: true });

    // Get sum of metrics
    const { data: sums, error: sumsError } = await supabase
      .from('agencies')
      .select('sum_sections:sum(num_sections), sum_words:sum(num_words), sum_corrections:sum(num_corrections)')
      .single();

    if (sumsError) {
      console.error('Error fetching total metrics:', sumsError);
      return NextResponse.json(
        { error: 'Failed to fetch total metrics' },
        { status: 500 }
      );
    }

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
      totalMetrics: {
        totalAgencies,
        totalSections: sums?.sum_sections || 0,
        totalWords: sums?.sum_words || 0,
        totalCorrections: sums?.sum_corrections || 0
      },
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