import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SupabaseCorrection {
  error_occurred: string;
  error_corrected: string;
  nodes: {
    title: string;
    agencies: {
      name: string;
      abbreviation: string;
    }[];
  }[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const agency = searchParams.get("agency");
    const title = searchParams.get("title");

    // Base query for corrections
    let query = supabase
      .from("corrections")
      .select(`
        *,
        nodes (
          title,
          agency_id,
          agencies (
            name,
            abbreviation
          )
        )
      `);

    // Apply filters if provided
    if (startDate) {
      query = query.gte("error_occurred", startDate);
    }
    if (endDate) {
      query = query.lte("error_occurred", endDate);
    }
    if (agency) {
      query = query.eq("nodes.agencies.abbreviation", agency);
    }
    if (title) {
      query = query.eq("nodes.title", title);
    }

    // Get corrections with pagination
    const { data: corrections, error: correctionsError } = await query
      .order("error_occurred", { ascending: false })
      .limit(50);

    if (correctionsError) {
      console.error("Error fetching corrections:", correctionsError);
      return NextResponse.json(
        { error: "Failed to fetch corrections" },
        { status: 500 }
      );
    }

    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from("corrections")
      .select(`
        error_occurred,
        error_corrected,
        nodes (
          title,
          agencies (
            name,
            abbreviation
          )
        )
      `);

    if (analyticsError) {
      console.error("Error fetching analytics:", analyticsError);
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }

    // Get total count separately
    const { count: totalCount } = await supabase
      .from("corrections")
      .select("*", { count: "exact", head: true });

    const totalCorrections = totalCount || 0;

    // Calculate analytics
    const averageDuration =
      analytics?.reduce((acc, curr: SupabaseCorrection) => {
        const duration = new Date(curr.error_corrected).getTime() - new Date(curr.error_occurred).getTime();
        return acc + duration;
      }, 0) / totalCorrections / (1000 * 60 * 60 * 24); // Convert to days

    // Get corrections by month
    const correctionsByMonth = analytics?.reduce((acc: Record<string, number>, curr: SupabaseCorrection) => {
      const month = new Date(curr.error_occurred).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // Get longest correction
    const longestCorrection = analytics?.reduce((longest, curr: SupabaseCorrection) => {
      const duration = new Date(curr.error_corrected).getTime() - new Date(curr.error_occurred).getTime();
      const title = curr.nodes[0]?.title || "";
      const agency = curr.nodes[0]?.agencies[0]?.name || "";
      return duration > longest.duration
        ? { duration, title, agency }
        : longest;
    }, { duration: 0, title: "", agency: "" });

    // Get most active month
    const mostActiveMonth = Object.entries(correctionsByMonth || {}).reduce(
      (most: { month: string; count: number }, [month, count]: [string, number]) =>
        count > most.count ? { month, count } : most,
      { month: "", count: 0 }
    );

    return NextResponse.json({
      corrections,
      analytics: {
        totalCorrections,
        averageDuration: Math.round(averageDuration),
        mostActiveMonth,
        longestCorrection: {
          duration: Math.round(longestCorrection.duration / (1000 * 60 * 60 * 24 * 365) * 10) / 10, // Convert to years with 1 decimal
          title: longestCorrection.title,
          agency: longestCorrection.agency,
        },
        correctionsByMonth,
      },
    });
  } catch (error) {
    console.error("Error in corrections API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 