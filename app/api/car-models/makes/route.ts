import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("car_models")
    .select("make")
    .order("make");

  if (error) return NextResponse.json([], { status: 500 });
  const makes = [...new Set((data ?? []).map((r) => r.make))];
  return NextResponse.json(makes);
}
