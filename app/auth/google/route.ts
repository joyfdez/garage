import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getOrigin } from "@/lib/utils/getOrigin";

export async function GET(request: Request) {
  const origin = getOrigin(request);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (!error && data.url) {
    return NextResponse.redirect(data.url);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Google+sign-in+failed`);
}
