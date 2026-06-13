import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddCarForm } from "@/components/AddCarForm";

export default async function AddCarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="px-4 py-6 max-w-lg">
      <h1 className="font-display text-2xl font-bold mb-6">Add a car</h1>
      <AddCarForm userId={user.id} />
    </div>
  );
}
