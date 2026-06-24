import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const q = raw.startsWith("@") ? raw.slice(1) : raw;

  if (q.length < 2) return NextResponse.json([]);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(20);

  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}
