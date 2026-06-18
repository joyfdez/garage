import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SellCarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: car } = await supabase
    .from("cars")
    .select("id, slug, current_owner_id")
    .eq("slug", slug)
    .single();

  if (!car || car.current_owner_id !== user.id) notFound();

  redirect(`/car/${slug}/events/new?type=sold`);
}
