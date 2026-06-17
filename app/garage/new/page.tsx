import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddCarForm } from "@/components/AddCarForm";

export default async function AddCarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("mileage_unit")
    .eq("id", user.id)
    .single();

  const preferredUnit = profile?.mileage_unit === "mi" ? "mi" : "km";

  return (
    <div className="px-4 pb-6 pt-safe-page max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-6">Add a car</h1>
      <AddCarForm userId={user.id} preferredUnit={preferredUnit as "km" | "mi"} />
    </div>
  );
}
