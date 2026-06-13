import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const make = req.nextUrl.searchParams.get("make")?.trim() ?? "";
  if (!make) return NextResponse.json([]);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("car_models")
    .select("model")
    .eq("make", make)
    .order("model");

  if (error) return NextResponse.json([], { status: 500 });
  const models = [...new Set((data ?? []).map((r) => r.model))];
  return NextResponse.json(models);
}
