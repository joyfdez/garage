import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const make  = req.nextUrl.searchParams.get("make")?.trim()  ?? "";
  const model = req.nextUrl.searchParams.get("model")?.trim() ?? "";
  if (!make || !model) return NextResponse.json([]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("car_models")
    .select("id, make, model, generation, chassis_code, year_start, year_end, engines, slug")
    .eq("make", make)
    .eq("model", model)
    .order("year_start");

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json(data ?? []);
}
