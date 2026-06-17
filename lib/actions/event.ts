"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EventState = { error: string } | { carSlug: string; eventId: string } | null;
export type DeleteEventState = { error: string } | { carSlug: string } | null;

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

  const mileageValueRaw = parseInt(formData.get("mileage_value") as string, 10);
  const mileageValue = isNaN(mileageValueRaw) || mileageValueRaw <= 0 ? null : mileageValueRaw;
  const mileageUnit = (formData.get("mileage_unit") as string)?.trim() || "km";
  const amountRaw = parseFloat(formData.get("amount") as string);
  const amount = isNaN(amountRaw) || amountRaw <= 0 ? null : amountRaw;

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
      mileage_value: mileageValue,
      mileage_unit: mileageValue ? mileageUnit : null,
      amount,
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

export async function updateEvent(
  _prev: EventState,
  formData: FormData
): Promise<EventState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const eventId = formData.get("event_id") as string;
  const carSlug = formData.get("car_slug") as string;
  const type = formData.get("type") as "build" | "fix";
  const title = (formData.get("title") as string)?.trim();
  const description = type !== "fix" ? ((formData.get("description") as string)?.trim() || null) : null;
  const eventDate = (formData.get("event_date") as string) || new Date().toISOString().split("T")[0];

  const problem = (formData.get("problem") as string)?.trim() || null;
  const diagnosis = (formData.get("diagnosis") as string)?.trim() || null;
  const solution = (formData.get("solution") as string)?.trim() || null;

  if (!title) return { error: "Title is required." };
  if (type !== "build" && type !== "fix") return { error: "Invalid event type." };

  const { data: event } = await supabase
    .from("car_events")
    .select("id, car_id, cars!inner(slug, current_owner_id)")
    .eq("id", eventId)
    .single();

  if (!event) return { error: "Event not found." };

  const car = event.cars as unknown as { slug: string; current_owner_id: string };
  if (car.current_owner_id !== user.id) return { error: "Not authorized." };
  if (car.slug !== carSlug) return { error: "Not authorized." };

  const details = type === "fix" ? { problem, diagnosis, solution } : null;
  const mileageValueRaw = parseInt(formData.get("mileage_value") as string, 10);
  const mileageValue = isNaN(mileageValueRaw) || mileageValueRaw <= 0 ? null : mileageValueRaw;
  const mileageUnit = (formData.get("mileage_unit") as string)?.trim() || "km";
  const amountRaw = parseFloat(formData.get("amount") as string);
  const amount = isNaN(amountRaw) || amountRaw <= 0 ? null : amountRaw;

  const { error: updateError } = await supabase
    .from("car_events")
    .update({
      type,
      title,
      description,
      details,
      event_date: eventDate,
      mileage_value: mileageValue,
      mileage_unit: mileageValue ? mileageUnit : null,
      amount,
    })
    .eq("id", eventId);

  if (updateError) return { error: "Something went wrong. Please try again." };

  // Delete removed photos
  const deletedIds = ((formData.get("deleted_photo_ids") as string) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (deletedIds.length > 0) {
    const { data: toDelete } = await supabase
      .from("photos")
      .select("id, storage_path")
      .in("id", deletedIds)
      .eq("event_id", eventId);

    if (toDelete && toDelete.length > 0) {
      await supabase.storage.from("car-photos").remove(toDelete.map((p) => p.storage_path));
      await supabase.from("photos").delete().in("id", deletedIds);
    }
  }

  // Insert new photos
  const newPaths: string[] = [];
  for (let i = 1; ; i++) {
    const p = formData.get(`photo_path_${i}`) as string | null;
    if (!p) break;
    newPaths.push(p);
  }
  if (newPaths.length > 0) {
    const { data: lastPhoto } = await supabase
      .from("photos")
      .select("position")
      .eq("event_id", eventId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const startPos = (lastPhoto?.position ?? -1) + 1;
    await supabase.from("photos").insert(
      newPaths.map((storage_path, i) => ({
        car_id: event.car_id,
        event_id: eventId,
        storage_path,
        position: startPos + i,
      }))
    );
  }

  revalidatePath(`/car/${carSlug}`);
  revalidatePath(`/car/${carSlug}/events/${eventId}`);
  return { carSlug, eventId };
}

export async function deleteEvent(eventId: string): Promise<DeleteEventState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: event } = await supabase
    .from("car_events")
    .select("id, car_id, cars!inner(slug, current_owner_id)")
    .eq("id", eventId)
    .single();

  if (!event) return { error: "Event not found." };

  const car = event.cars as unknown as { slug: string; current_owner_id: string };
  if (car.current_owner_id !== user.id) return { error: "Not authorized." };

  // Fetch photos to delete from storage
  const { data: photos } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("event_id", eventId);

  // Delete from storage (best effort)
  const paths = (photos ?? []).map((p) => p.storage_path);
  if (paths.length > 0) {
    await supabase.storage.from("car-photos").remove(paths);
  }

  // Delete event (cascades photos rows)
  const { error } = await supabase.from("car_events").delete().eq("id", eventId);
  if (error) return { error: "Failed to delete event. Please try again." };

  revalidatePath(`/car/${car.slug}`);
  return { carSlug: car.slug };
}
