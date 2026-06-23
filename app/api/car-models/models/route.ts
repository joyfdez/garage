import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const make = req.nextUrl.searchParams.get("make")?.trim() ?? "";
  if (!make) return NextResponse.json([]);

  const supabase = await createClient();

  const { data: makeRow } = await supabase
    .from("makes")
    .select("id")
    .eq("name", make)
    .single();

  if (!makeRow) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("models")
    .select("name")
    .eq("make_id", makeRow.id)
    .order("name");

  if (error) return NextResponse.json([], { status: 500 });
  return NextResponse.json((data ?? []).map((r) => r.name));
}
