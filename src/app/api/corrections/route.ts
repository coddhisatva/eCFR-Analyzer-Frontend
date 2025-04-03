import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const agency = searchParams.get("agency");
    const title = searchParams.get("title");

    // Base query conditions
    const baseQuery = {
      ...(startDate && { error_occurred: { gte: startDate } }),
      ...(endDate && { error_corrected: { lte: endDate } }),
      ...(agency && { agency_id: agency }),
      ...(title && { title: parseInt(title) })
    };

    // Get corrections with pagination using indexes
    const { data: corrections, error: correctionsError } = await supabase
      .from("corrections")
      .select(`
        *,
        nodes!inner (
          title,
          node_name,
          agencies!inner (
            name,
            abbreviation
          )
        )
      `)
      .match(baseQuery)
      .order('error_occurred', { ascending: false })
      .limit(50);

    if (correctionsError) {
      console.error("Error fetching corrections:", correctionsError);
      return NextResponse.json(
        { error: "Failed to fetch corrections" },
        { status: 500 }
      );
    }

    // Get total count using index
    const { count: totalCorrections, error: countError } = await supabase
      .from("corrections")
      .select("*", { count: "exact", head: true })
      .match(baseQuery);

    if (countError) {
      console.error("Error getting count:", countError);
    }

    // Get average duration using correction_duration index
    const { data: avgData, error: avgError } = await supabase
      .from("corrections")
      .select("correction_duration")
      .match(baseQuery)
      .avg("correction_duration");

    if (avgError) {
      console.error("Error getting average:", avgError);
    }

    // Get longest correction using duration index
    const { data: longestData, error: longestError } = await supabase
      .from("corrections")
      .select(`
        correction_duration,
        nodes!inner (
          title,
          agencies!inner (
            name
          )
        )
      `)
      .match(baseQuery)
      .order('correction_duration', { ascending: false })
      .limit(1)
      .single();

    if (longestError) {
      console.error("Error getting longest:", longestError);
    }

    // Get corrections by month using error_occurred index
    const { data: monthlyData, error: monthlyError } = await supabase
      .from("corrections")
      .select("error_occurred")
      .match(baseQuery);

    if (monthlyError) {
      console.error("Error getting monthly data:", monthlyError);
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

    // Get available agencies for filter
    const { data: agencies, error: agenciesError } = await supabase
      .from('agencies')
      .select('id, name, abbreviation')
      .order('name');

    if (agenciesError) {
      console.error("Error fetching agencies:", agenciesError);
    }

    // Get available titles for filter using index
    const { data: titles, error: titlesError } = await supabase
      .from('nodes')
      .select('title, node_name')
      .eq('level_type', 'title')
      .order('title');

    if (titlesError) {
      console.error("Error fetching titles:", titlesError);
    }

    return NextResponse.json({
      corrections,
      analytics: {
        totalCorrections: totalCorrections || 0,
        averageDuration: Math.round(avgData?.[0]?.avg || 0),
        mostActiveMonth,
        longestCorrection: longestData ? {
          duration: Math.round(longestData.correction_duration / 365 * 10) / 10,
          title: longestData.nodes?.title || '',
          agency: longestData.nodes?.agencies?.[0]?.name || ''
        } : null,
        correctionsByMonth
      },
      filters: {
        agencies: agencies?.map(a => ({
          value: a.id,
          label: a.name,
          abbreviation: a.abbreviation
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 