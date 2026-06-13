import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getOrigin } from "@/lib/utils/getOrigin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getOrigin(request);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/garage";
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorParam)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();
        if (!profile) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=Could+not+verify+link`
  );
}
