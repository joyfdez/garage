import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, first_name, last_name, location, country, bio, gender, birthday, avatar_url, cover_photo_path, mileage_unit, preferred_currency")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return (
    <div className="px-4 pb-6 pt-safe-page max-w-lg">
      {/* Sticky compact header — settings already has a small title, no collapse needed */}
      <div
        className="sticky z-[58] -mx-4 px-4 py-3 flex items-center gap-3 mb-6"
        style={{
          top: "env(safe-area-inset-top, 0px)",
          background: "rgba(251,250,247,0.92)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderBottom: "1px solid rgba(17,17,17,0.06)",
        }}
      >
        <Link href={`/u/${profile.username}`} className="text-ink/40 hover:text-ink transition-colors shrink-0">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-base">Settings</h1>
      </div>

      <SettingsForm
        profile={{
          username:          profile.username,
          display_name:      profile.display_name,
          first_name:        profile.first_name  ?? null,
          last_name:         profile.last_name   ?? null,
          location:          profile.location    ?? null,
          country:           profile.country     ?? null,
          bio:               profile.bio         ?? null,
          gender:            profile.gender      ?? null,
          birthday:          profile.birthday    ?? null,
          avatar_url:        profile.avatar_url  ?? null,
          cover_photo_path:  profile.cover_photo_path ?? null,
          mileage_unit:       (profile.mileage_unit === "mi" ? "mi" : "km") as "km" | "mi",
          preferred_currency: profile.preferred_currency ?? "EUR",
        }}
        userId={user.id}
        supabaseUrl={supabaseUrl}
      />
    </div>
  );
}
