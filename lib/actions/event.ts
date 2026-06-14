"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EventState = { error: string } | { carSlug: string; eventId: string } | null;

export async function createEvent(
  _prev: EventState,
  formData: FormData
): Promise<EventState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const carSlug = formData.get("car_slug") as string;
  const type = formData.get("type") as "build" | "fix";
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const eventDate =
    (formData.get("event_date") as string) ||
    new Date().toISOString().split("T")[0];

  const problem = (formData.get("problem") as string)?.trim() || null;
  const diagnosis = (formData.get("diagnosis") as string)?.trim() || null;
  const solution = (formData.get("solution") as string)?.trim() || null;

  if (!title) return { error: "Title is required." };
  if (type !== "build" && type !== "fix") return { error: "Invalid event type." };

  const { data: car } = await supabase
    .from("cars")
    .select("id, slug")
    .eq("slug", carSlug)
    .eq("current_owner_id", user.id)
    .single();

  if (!car) return { error: "Car not found." };

  // If the user's most recent ownership has ended, validate event_date falls within it
  const { data: ownership } = await supabase
    .from("ownerships")
    .select("start_date, end_date")
    .eq("car_id", car.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ownership?.end_date) {
    const start = ownership.start_date;
    const end = ownership.end_date;
    if ((start && eventDate < start) || eventDate > end) {
      const range = `${start ?? "—"} to ${end}`;
      return { error: `Event date must fall within your ownership period (${range}).` };
    }
  }

  const details = type === "fix" ? { problem, diagnosis, solution } : null;

  const { data: event, error: eventError } = await supabase
    .from("car_events")
    .insert({
      car_id: car.id,
      author_id: user.id,
      type,
      title,
      description,
      details,
      event_date: eventDate,
    })
    .select("id")
    .single();

  if (eventError) return { error: "Something went wrong. Please try again." };

  const coverPhotoPath = (formData.get("cover_photo_path") as string) || null;
  const extraPaths: string[] = [];
  for (let i = 1; ; i++) {
    const p = formData.get(`photo_path_${i}`) as string | null;
    if (!p) break;
    extraPaths.push(p);
  }
  const allPaths = [coverPhotoPath, ...extraPaths].filter(Boolean) as string[];
  if (allPaths.length > 0) {
    await supabase.from("photos").insert(
      allPaths.map((storage_path, position) => ({
        car_id: car.id,
        event_id: event.id,
        storage_path,
        position,
      }))
    );
  }

  revalidatePath(`/car/${car.slug}`);
  return { carSlug: car.slug, eventId: event.id };
}
