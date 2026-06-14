import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/OnboardingForm";

export const metadata = { title: "Set up your garage" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Skip onboarding if profile already exists (e.g. back-button after setup)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (profile) redirect("/profile");

  // Suggest a username from their Google display name, if available
  const fullName = user.user_metadata?.full_name as string | undefined;
  const hint = fullName
    ? fullName.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30)
    : undefined;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-12 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Set up your garage</h1>
          <p className="text-ink/50 text-sm mt-1">
            One step before you start documenting.
          </p>
        </div>

        <div className="rounded-2xl border border-card bg-white/70 p-6 shadow-sm">
          <OnboardingForm hint={hint} />
        </div>
      </div>
    </div>
  );
}
