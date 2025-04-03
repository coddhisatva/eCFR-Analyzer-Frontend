import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Helper function for consistent logging
function logStep(step: string, data?: any) {
  console.log(`[Corrections API] ${step}`, data ? data : '');
}

function logError(step: string, error: any) {
  console.error(`[Corrections API Error] ${step}:`, error);
}

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const agency = searchParams.get("agency");
    const title = searchParams.get("title");

    logStep('Query params', { startDate, endDate, agency, title });

    // Base query conditions
    const baseQuery = {
      ...(startDate && { error_occurred: { gte: startDate } }),
      ...(endDate && { error_corrected: { lte: endDate } }),
      ...(agency && { agency_id: agency }),
      ...(title && { title: parseInt(title) })
    };

    logStep('Base query', baseQuery);

    // Get corrections with pagination using indexes
    const { data: corrections, error: correctionsError } = await supabase
      .from("corrections")
      .select(`
        *,
        nodes:node_id (
          title,
          node_name,
          agency_id
        )
      `)
      .match(baseQuery)
      .order('error_occurred', { ascending: false })
      .limit(50);

    if (correctionsError) {
      logError('Fetching corrections', correctionsError);
      return NextResponse.json(
        { error: `Failed to fetch corrections: ${correctionsError.message}` },
        { status: 500 }
      );
    }
    logStep('Fetched corrections', { count: corrections?.length });

    // Get total count using index
    const { count: totalCorrections, error: countError } = await supabase
      .from("corrections")
      .select("*", { count: "exact", head: true })
      .match(baseQuery);

    if (countError) {
      console.error("Error getting count:", countError);
      return NextResponse.json(
        { error: `Failed to get count: ${countError.message}` },
        { status: 500 }
      );
    }

    // Get average duration using correction_duration index
    const { data: avgData, error: avgError } = await supabase
      .from("corrections")
      .select('correction_duration')
      .match(baseQuery)
      .select('correction_duration')
      .single();

    if (avgError) {
      console.error("Error getting average:", avgError);
      return NextResponse.json(
        { error: `Failed to get average: ${avgError.message}` },
        { status: 500 }
      );
    }

    const averageDuration = avgData?.correction_duration || 0;

    // Get agency names for the corrections
    const agencyIds = [...new Set(corrections?.map(c => c.nodes?.agency_id).filter(Boolean) || [])];
    logStep('Unique agency IDs', agencyIds);
    const { data: agencies, error: agenciesError } = await supabase
      .from('agencies')
      .select('id, name')
      .in('id', agencyIds);

    if (agenciesError) {
      console.error("Error fetching agencies:", agenciesError);
      return NextResponse.json(
        { error: `Failed to get agencies: ${agenciesError.message}` },
        { status: 500 }
      );
    }

    // Create agency lookup map
    const agencyMap = new Map(agencies?.map(a => [a.id, a.name]) || []);

    // Enrich corrections with agency names
    const enrichedCorrections = corrections?.map(correction => ({
      ...correction,
      nodes: {
        ...correction.nodes,
        agency_name: correction.nodes?.agency_id ? agencyMap.get(correction.nodes.agency_id) : null
      }
    }));

    // Get available titles for filter using index
    const { data: titles, error: titlesError } = await supabase
      .from('nodes')
      .select('title, node_name')
      .eq('level_type', 'title')
      .order('title');

    if (titlesError) {
      console.error("Error fetching titles:", titlesError);
      return NextResponse.json(
        { error: `Failed to get titles: ${titlesError.message}` },
        { status: 500 }
      );
    }

    // Get corrections by month using error_occurred index
    const { data: monthlyData, error: monthlyError } = await supabase
      .from("corrections")
      .select("error_occurred")
      .match(baseQuery);

    if (monthlyError) {
      console.error("Error getting monthly data:", monthlyError);
      return NextResponse.json(
        { error: `Failed to get monthly data: ${monthlyError.message}` },
        { status: 500 }
      );
    }

    // Process monthly data
    const correctionsByMonth: Record<string, number> = {};
    let mostActiveMonth = { month: "", count: 0 };

    monthlyData?.forEach(c => {
      const month = new Date(c.error_occurred).toLocaleString("default", {
        month: "long",
        year: "numeric"
      });
      correctionsByMonth[month] = (correctionsByMonth[month] || 0) + 1;
      
      if (correctionsByMonth[month] > mostActiveMonth.count) {
        mostActiveMonth = { month, count: correctionsByMonth[month] };
      }
    });

    // Get longest correction using duration index
    const { data: longestData, error: longestError } = await supabase
      .from("corrections")
      .select(`
        correction_duration,
        nodes:node_id (
          title,
          node_name,
          agency_id
        )
      `)
      .match(baseQuery)
      .order('correction_duration', { ascending: false })
      .limit(1)
      .single();

    if (longestError) {
      console.error("Error getting longest:", longestError);
      return NextResponse.json(
        { error: `Failed to get longest: ${longestError.message}` },
        { status: 500 }
      );
    }

    // Get agency name for longest correction
    const longestAgencyName = longestData?.nodes?.agency_id ? agencyMap.get(longestData.nodes.agency_id) : null;

    return NextResponse.json({
      corrections: enrichedCorrections,
      analytics: {
        totalCorrections: totalCorrections || 0,
        averageDuration: Math.round(averageDuration),
        mostActiveMonth,
        longestCorrection: longestData ? {
          duration: Math.round(longestData.correction_duration / 365 * 10) / 10,
          title: longestData.nodes?.title || '',
          agency: longestAgencyName || ''
        } : null,
        correctionsByMonth
      },
      filters: {
        agencies: agencies?.map(a => ({
          value: a.id,
          label: a.name
        })) || [],
        titles: titles?.map(t => ({
          value: t.title.toString(),
          label: `Title ${t.title} - ${t.node_name}`
        })) || []
      }
    });
  } catch (error) {
    console.error("Error in corrections API:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 