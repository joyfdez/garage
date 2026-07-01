import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  // Split into tokens so "Honda c" matches make="Honda" AND model="Civic".
  // Strip characters that would break the PostgREST OR filter syntax.
  const tokens = q
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[(),%]/g, ""));

  const supabase = await createClient();

  // Each chained call is AND'd by PostgREST — every token must match at least
  // one of: make, model, generation, chassis_code.
  let query = supabase
    .from("car_models")
    .select("id, make, model, generation, chassis_code, year_start, year_end, engines, slug");

  for (const token of tokens) {
    query = query.or(
      [
        `make.ilike.%${token}%`,
        `model.ilike.%${token}%`,
        `generation.ilike.%${token}%`,
        `chassis_code.ilike.%${token}%`,
      ].join(",")
    );
  }

  const { data, error } = await query.order("make").order("year_start").limit(8);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data);
}
