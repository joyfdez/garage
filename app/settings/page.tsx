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
    .select("username, display_name, first_name, last_name, location, country, bio, gender, birthday, avatar_url, cover_photo_path, mileage_unit")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return (
    <div className="px-4 py-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/u/${profile.username}`} className="text-ink/40 hover:text-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-display font-bold text-xl">Settings</h1>
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
          mileage_unit:      (profile.mileage_unit === "mi" ? "mi" : "km") as "km" | "mi",
        }}
        userId={user.id}
        supabaseUrl={supabaseUrl}
      />
    </div>
  );
}
