"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error: string } | null;

export async function createProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const rawUsername = (formData.get("username") as string ?? "").trim().toLowerCase();
  const location = (formData.get("location") as string ?? "").trim() || null;

  if (!/^[a-z0-9_]{2,30}$/.test(rawUsername)) {
    return {
      error: "Username must be 2–30 characters: lowercase letters, numbers, and underscores only.",
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username: rawUsername,
    display_name: (user.user_metadata?.full_name as string) ?? null,
    avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
    location,
  });

  if (error?.code === "23505") {
    return { error: "That username is taken. Try another one." };
  }
  if (error) {
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/profile");
}

export type SettingsState = { error?: string; success?: boolean } | null;

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const mileageUnit = (formData.get("mileage_unit") as string) === "mi" ? "mi" : "km";
  const preferredCurrency = (formData.get("preferred_currency") as string)?.trim() || "EUR";

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name:       (formData.get("display_name") as string)?.trim() || null,
      first_name:         (formData.get("first_name")   as string)?.trim() || null,
      last_name:          (formData.get("last_name")     as string)?.trim() || null,
      location:           (formData.get("location")      as string)?.trim() || null,
      country:            (formData.get("country")       as string)?.trim() || null,
      bio:                (formData.get("bio")           as string)?.trim() || null,
      gender:             (formData.get("gender")        as string) || null,
      birthday:           (formData.get("birthday")      as string) || null,
      mileage_unit:       mileageUnit,
      preferred_currency: preferredCurrency,
    })
    .eq("id", user.id);

  if (error) return { error: "Failed to save. Please try again." };

  revalidatePath("/settings");
  revalidatePath("/u", "layout");
  return { success: true };
}

export async function updateAvatarUrl(avatarUrl: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Not authenticated";
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);
  if (error) {
    console.error("[updateAvatarUrl] Supabase error:", error.code, error.message);
    return "Failed to save avatar";
  }
  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/u", "layout");
  return null;
}

export async function updateCoverPhotoPath(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Not authenticated";
  const { error } = await supabase
    .from("profiles")
    .update({ cover_photo_path: path })
    .eq("id", user.id);
  if (error) {
    console.error("[updateCoverPhotoPath] Supabase error:", error.code, error.message);
    return "Failed to save cover";
  }
  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/u", "layout");
  return null;
}

export type PasswordState = { error?: string; success?: boolean } | null;

export async function changePassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const newPassword = (formData.get("new_password") as string) ?? "";
  const confirm    = (formData.get("confirm_password") as string) ?? "";

  if (newPassword.length < 8) return { error: "Password must be at least 8 characters." };
  if (newPassword !== confirm) return { error: "Passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}

export type UsernameState = SettingsState;

export async function updateUsername(
  _prev: UsernameState,
  formData: FormData
): Promise<UsernameState> {
  const newUsername = (formData.get("username") as string ?? "").trim().toLowerCase();

  if (!/^[a-z0-9_]{2,30}$/.test(newUsername)) {
    return { error: "Username must be 2–30 characters: lowercase letters, numbers, and underscores only." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("profiles")
    .update({ username: newUsername })
    .eq("id", user.id);

  if (error?.code === "23505") {
    return { error: "That username is already taken." };
  }
  if (error) {
    return { error: "Failed to update username. Please try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/u", "layout");
  return { success: true };
}

export type DeleteState = { error: string } | { success: true } | null;

export async function deleteAccount(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  const expected = formData.get("expected_username") as string;
  const typed    = (formData.get("confirm_text") as string)?.trim();

  if (typed !== expected) return { error: "Username doesn't match. Try again." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // 1. Collect car photo storage paths before deleting
  const { data: userCars } = await supabase
    .from("cars")
    .select("id")
    .eq("current_owner_id", user.id);

  const carIds = (userCars ?? []).map((c) => c.id);
  if (carIds.length > 0) {
    const { data: photoRows } = await supabase
      .from("photos")
      .select("storage_path")
      .in("car_id", carIds);
    const paths = (photoRows ?? []).map((p) => p.storage_path);
    if (paths.length > 0) {
      await supabase.storage.from("car-photos").remove(paths);
    }
  }

  // 2. Delete avatar + cover from storage (best effort)
  await supabase.storage
    .from("avatars")
    .remove([`${user.id}/avatar.webp`, `${user.id}/cover.webp`]);

  // 3. Call SECURITY DEFINER function — deletes cars (cascade) then auth user (profile cascades)
  const { error } = await supabase.rpc("delete_current_user");
  if (error) return { error: "Failed to delete account. Please try again." };

  return { success: true };
}
