"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string } | { success: true } | null;

// Single action handles both sign-in and sign-up via a hidden `mode` field.
export async function authAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const mode = formData.get("mode") as string;
  const email = (formData.get("email") as string).trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  if (mode === "signup") {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        return { error: "An account with this email already exists. Sign in instead." };
      }
      return { error: error.message };
    }

    // Email confirmation disabled → session exists immediately
    if (data.session) redirect("/garage");

    // Email confirmation required
    return { success: true };
  }

  // mode === "signin"
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (
      error.message.toLowerCase().includes("invalid login") ||
      error.message.toLowerCase().includes("invalid credentials")
    ) {
      return { error: "Wrong email or password." };
    }
    return { error: error.message };
  }

  redirect("/garage");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
