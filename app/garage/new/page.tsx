import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddCarForm } from "@/components/AddCarForm";
import { StickyPageHeader } from "@/components/StickyPageHeader";

export default async function AddCarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("mileage_unit, preferred_currency")
    .eq("id", user.id)
    .single();

  const preferredUnit = (profile?.mileage_unit === "mi" ? "mi" : "km") as "km" | "mi";
  const preferredCurrency = profile?.preferred_currency ?? "EUR";

  return (
    <div className="px-4 pb-6 pt-safe-page max-w-lg">
      <div className="mb-6">
        <StickyPageHeader title="Add a car" />
      </div>
      <AddCarForm userId={user.id} preferredUnit={preferredUnit} preferredCurrency={preferredCurrency} />
    </div>
  );
}
