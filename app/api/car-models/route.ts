import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("car_models")
    .select("id, make, model, generation, chassis_code, year_start, year_end, engines, slug")
    .or(
      [
        `make.ilike.%${q}%`,
        `model.ilike.%${q}%`,
        `generation.ilike.%${q}%`,
        `chassis_code.ilike.%${q}%`,
      ].join(",")
    )
    .order("make")
    .order("year_start")
    .limit(8);

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data);
}
