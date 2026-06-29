"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CarState = { error: string } | { slug: string; warnings?: string[] } | null;

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function createCar(
  _prev: CarState,
  formData: FormData
): Promise<CarState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const modelId = (formData.get("model_id") as string) || null;
  const customMake = (formData.get("custom_make") as string)?.trim() || null;
  const customModel = (formData.get("custom_model") as string)?.trim() || null;
  const customGeneration = (formData.get("custom_generation") as string)?.trim() || null;
  const displayMake = (formData.get("display_make") as string)?.trim() ?? "";
  const displayModel = (formData.get("display_model") as string)?.trim() ?? "";

  const rawYear = parseInt(formData.get("year") as string, 10);
  if (isNaN(rawYear) || rawYear < 1885 || rawYear > new Date().getFullYear() + 2) {
    return { error: "Enter a valid year." };
  }

  const engine = (formData.get("engine") as string)?.trim() || null;
  const transmission = (formData.get("transmission") as string)?.trim() || null;
  const color = (formData.get("color") as string)?.trim() || null;
  const nickname = (formData.get("nickname") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const visibility = (formData.get("visibility") as string) === "private" ? "private" : "public";
  const vin = (formData.get("vin") as string)?.trim() || null;

  const fuel = (formData.get("fuel") as string)?.trim() || null;
  const drivetrain = (formData.get("drivetrain") as string)?.trim() || null;
  const horsepowerRaw = parseInt(formData.get("horsepower") as string, 10);
  const horsepower = isNaN(horsepowerRaw) || horsepowerRaw <= 0 ? null : horsepowerRaw;
  const bodyType = (formData.get("body_type") as string)?.trim() || null;
  const acquisitionCondition = (formData.get("acquisition_condition") as string)?.trim() || null;

  if (!modelId && (!customMake || !customModel)) {
    return { error: "Select a car model or fill in make and model." };
  }

  const slugBase = toSlug(`${rawYear} ${displayMake} ${displayModel}`);
  const slug = `${slugBase}-${randomSuffix()}`;

  // Collect photo paths from hidden form inputs
  const coverPhotoPath = (formData.get("cover_photo_path") as string) || null;
  const extraPhotoPaths: string[] = [];
  for (let i = 1; ; i++) {
    const p = formData.get(`photo_path_${i}`) as string | null;
    if (!p) break;
    extraPhotoPaths.push(p);
  }

  const purchaseDate = (formData.get("purchase_date") as string)?.trim() || null;
  const purchasePriceRaw = (formData.get("purchase_price") as string)?.trim();
  const purchasePrice = purchasePriceRaw ? parseFloat(purchasePriceRaw) : null;
  const purchasePricePublic = formData.get("purchase_price_public") === "true";
  const currency = (formData.get("currency") as string)?.trim() || "EUR";
  const colorBase = (formData.get("color_base") as string)?.trim() || null;

  // Atomic: car + ownership are created in one transaction via a Postgres function.
  // If either insert fails, neither is committed — no orphan cars possible.
  const { data: rpcData, error: carError } = await supabase.rpc(
    "create_car_with_ownership",
    {
      p_slug:                  slug,
      p_model_id:              modelId,
      p_custom_make:           customMake,
      p_custom_model:          customModel,
      p_custom_generation:     customGeneration,
      p_year:                  rawYear,
      p_engine:                engine,
      p_transmission:          transmission,
      p_color:                 color,
      p_nickname:              nickname,
      p_location:              location,
      p_visibility:            visibility,
      p_cover_photo_path:      coverPhotoPath,
      p_start_date:            purchaseDate,
      p_purchase_price:        purchasePrice,
      p_purchase_price_public: purchasePricePublic,
      p_currency:              currency,
      p_fuel:                  fuel,
      p_drivetrain:            drivetrain,
      p_horsepower:            horsepower,
      p_body_type:             bodyType,
      p_acquisition_condition: acquisitionCondition,
    }
  );

  if (carError) {
    if (carError.code === "23505") {
      return { error: "Couldn't generate a unique URL — please try again." };
    }
    return { error: "Something went wrong saving your car. Please try again." };
  }

  const car = rpcData as { id: string; slug: string };
  const warnings: string[] = [];

  if (vin) {
    const { error: vinError } = await supabase.from("car_vins").insert({ car_id: car.id, vin });
    if (vinError) {
      console.error("[createCar] VIN insert failed:", vinError.code, vinError.message);
      warnings.push("VIN couldn't be saved — add it later from the car settings.");
    }
  }

  // Insert photo rows ([cover, ...extras])
  const allPaths = [coverPhotoPath, ...extraPhotoPaths].filter(Boolean) as string[];
  if (allPaths.length > 0) {
    const { error: photoError } = await supabase.from("photos").insert(
      allPaths.map((storage_path, position) => ({
        car_id: car.id,
        storage_path,
        position,
      }))
    );
    if (photoError) {
      console.error("[createCar] photos insert failed:", photoError.code, photoError.message);
      warnings.push("Photos couldn't be saved — add them from the car page.");
    }
  }

  // Store color_base (not in RPC params — update the freshly created car row)
  if (colorBase) {
    await supabase.from("cars").update({ color_base: colorBase }).eq("id", car.id);
  }

  // Store purchase mileage on the ownership the RPC already created
  const purchaseMileageRaw = parseInt(formData.get("purchase_mileage_value") as string, 10);
  const purchaseMileageValue = isNaN(purchaseMileageRaw) || purchaseMileageRaw <= 0 ? null : purchaseMileageRaw;
  const purchaseMileageUnit = (formData.get("purchase_mileage_unit") as string)?.trim() || "km";
  if (purchaseMileageValue) {
    await supabase
      .from("ownerships")
      .update({
        purchase_mileage_value: purchaseMileageValue,
        purchase_mileage_unit: purchaseMileageUnit,
      })
      .eq("car_id", car.id)
      .eq("user_id", user.id);
  }

  revalidatePath("/garage");
  revalidatePath("/profile");
  return warnings.length > 0 ? { slug: car.slug, warnings } : { slug: car.slug };
}

export async function updateCar(
  _prev: CarState,
  formData: FormData
): Promise<CarState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const carId = formData.get("car_id") as string;
  const { data: existing } = await supabase
    .from("cars")
    .select("slug, model_id")
    .eq("id", carId)
    .eq("current_owner_id", user.id)
    .single();

  if (!existing) return { error: "Car not found." };

  const rawYear = parseInt(formData.get("year") as string, 10);
  if (isNaN(rawYear) || rawYear < 1885 || rawYear > new Date().getFullYear() + 2) {
    return { error: "Enter a valid year." };
  }

  const hpRaw = parseInt(formData.get("horsepower") as string, 10);
  const updates: Record<string, unknown> = {
    year: rawYear,
    engine: (formData.get("engine") as string)?.trim() || null,
    transmission: (formData.get("transmission") as string)?.trim() || null,
    color: (formData.get("color") as string)?.trim() || null,
    nickname: (formData.get("nickname") as string)?.trim() || null,
    location: (formData.get("location") as string)?.trim() || null,
    visibility: (formData.get("visibility") as string) === "private" ? "private" : "public",
    fuel: (formData.get("fuel") as string)?.trim() || null,
    drivetrain: (formData.get("drivetrain") as string)?.trim() || null,
    horsepower: isNaN(hpRaw) || hpRaw <= 0 ? null : hpRaw,
    body_type: (formData.get("body_type") as string)?.trim() || null,
    color_base: (formData.get("color_base") as string)?.trim() || null,
  };

  const newModelId = (formData.get("model_id") as string)?.trim() || null;
  if (newModelId) {
    updates.model_id = newModelId;
    updates.custom_make = null;
    updates.custom_model = null;
    updates.custom_generation = null;
  } else {
    const customMake = (formData.get("custom_make") as string)?.trim() || null;
    const customModel = (formData.get("custom_model") as string)?.trim() || null;
    if (!customMake || !customModel) return { error: "Make and model are required." };
    updates.model_id = null;
    updates.custom_make = customMake;
    updates.custom_model = customModel;
    updates.custom_generation = (formData.get("custom_generation") as string)?.trim() || null;
  }

  const { error } = await supabase.from("cars").update(updates).eq("id", carId);
  if (error) return { error: "Failed to save changes. Please try again." };

  // Revalidate the catalog model page when a new model link is established
  if (newModelId && newModelId !== existing.model_id) {
    const { data: modelData } = await supabase
      .from("car_models")
      .select("slug")
      .eq("id", newModelId)
      .single();
    if (modelData?.slug) {
      revalidatePath(`/model/${modelData.slug}`);
    }
  }

  // Also update ownership purchase fields if an ownership_id was submitted
  const ownershipId = (formData.get("ownership_id") as string)?.trim() || null;
  if (ownershipId) {
    const purchaseDate = (formData.get("purchase_date") as string)?.trim() || null;
    const purchasePriceRaw = (formData.get("purchase_price") as string)?.trim();
    const purchasePrice = purchasePriceRaw ? parseFloat(purchasePriceRaw) : null;
    const purchasePricePublic = formData.get("purchase_price_public") === "true";
    const purchaseMileageRaw = parseInt(formData.get("purchase_mileage_value") as string, 10);
    const purchaseMileageValue = isNaN(purchaseMileageRaw) || purchaseMileageRaw <= 0 ? null : purchaseMileageRaw;
    const purchaseMileageUnit = (formData.get("purchase_mileage_unit") as string)?.trim() || "km";
    const currency = (formData.get("currency") as string)?.trim() || null;

    await supabase
      .from("ownerships")
      .update({
        start_date: purchaseDate,
        purchase_price: purchasePrice,
        purchase_price_public: purchasePricePublic,
        currency,
        purchase_mileage_value: purchaseMileageValue,
        purchase_mileage_unit: purchaseMileageValue ? purchaseMileageUnit : null,
      })
      .eq("id", ownershipId)
      .eq("user_id", user.id);
  }

  revalidatePath(`/car/${existing.slug}`);
  revalidatePath("/garage");
  return { slug: existing.slug };
}

export async function setCarCover(
  carId: string,
  storagePath: string | null
): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Not authenticated";

  const { data: car } = await supabase
    .from("cars")
    .select("slug")
    .eq("id", carId)
    .eq("current_owner_id", user.id)
    .single();

  if (!car) return "Car not found";

  const { error } = await supabase
    .from("cars")
    .update({ cover_photo_path: storagePath })
    .eq("id", carId);

  if (error) return "Failed to update cover";
  revalidatePath(`/car/${car.slug}`);
  revalidatePath("/profile");
  revalidatePath("/garage");
  return null;
}

export async function deleteCarPhoto(
  photoId: string,
  storagePath: string,
  carId: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Not authenticated";

  const { data: car } = await supabase
    .from("cars")
    .select("slug, cover_photo_path")
    .eq("id", carId)
    .eq("current_owner_id", user.id)
    .single();

  if (!car) return "Car not found";

  await supabase.storage.from("car-photos").remove([storagePath]);

  const { error } = await supabase.from("photos").delete().eq("id", photoId);
  if (error) return "Failed to delete photo";

  if (car.cover_photo_path === storagePath) {
    await supabase.from("cars").update({ cover_photo_path: null }).eq("id", carId);
  }

  revalidatePath(`/car/${car.slug}`);
  revalidatePath("/profile");
  revalidatePath("/garage");
  return null;
}

export async function markAsSold(
  _prev: CarState,
  formData: FormData
): Promise<CarState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const carId = formData.get("car_id") as string;

  const { data: car } = await supabase
    .from("cars")
    .select("slug")
    .eq("id", carId)
    .eq("current_owner_id", user.id)
    .single();

  if (!car) return { error: "Car not found." };

  const { data: ownership } = await supabase
    .from("ownerships")
    .select("id")
    .eq("car_id", carId)
    .eq("user_id", user.id)
    .is("end_date", null)
    .maybeSingle();

  if (!ownership) return { error: "No active ownership found." };

  const saleDate = (formData.get("sale_date") as string)?.trim();
  if (!saleDate) return { error: "Sale date is required." };

  const salePriceRaw = (formData.get("sale_price") as string)?.trim();
  const salePrice = salePriceRaw ? parseFloat(salePriceRaw) : null;
  const salePricePublic = formData.get("sale_price_public") === "true";
  const currency = (formData.get("currency") as string)?.trim() || "EUR";

  const saleMileageRaw = parseInt(formData.get("sale_mileage_value") as string, 10);
  const saleMileageValue = isNaN(saleMileageRaw) || saleMileageRaw <= 0 ? null : saleMileageRaw;
  const saleMileageUnit = (formData.get("sale_mileage_unit") as string)?.trim() || "km";

  const salePhotoPath = (formData.get("sale_photo_path") as string)?.trim() || null;
  const saleDescription = (formData.get("sale_description") as string)?.trim() || null;

  const { error } = await supabase
    .from("ownerships")
    .update({
      end_date: saleDate,
      sale_price: salePrice,
      sale_price_public: salePricePublic,
      currency,
      sale_mileage_value: saleMileageValue,
      sale_mileage_unit: saleMileageValue ? saleMileageUnit : null,
    })
    .eq("id", ownership.id);

  if (error) return { error: "Failed to update. Please try again." };

  // Best-effort: save photo and description only if columns exist (post-migration).
  if (salePhotoPath !== null || saleDescription !== null) {
    await supabase
      .from("ownerships")
      .update({ sale_photo_path: salePhotoPath, sale_description: saleDescription })
      .eq("id", ownership.id);
  }

  revalidatePath(`/car/${car.slug}`);
  revalidatePath("/garage");
  return { slug: car.slug };
}

export async function undoSale(carId: string): Promise<{ error: string } | { slug: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: car } = await supabase
    .from("cars")
    .select("slug")
    .eq("id", carId)
    .eq("current_owner_id", user.id)
    .single();

  if (!car) return { error: "Car not found." };

  const { data: ownership } = await supabase
    .from("ownerships")
    .select("id")
    .eq("car_id", carId)
    .eq("user_id", user.id)
    .not("end_date", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ownership) return { error: "No ended ownership found." };

  const { error } = await supabase
    .from("ownerships")
    .update({
      end_date: null,
      sale_price: null,
      sale_price_public: false,
      sale_mileage_value: null,
      sale_mileage_unit: null,
    })
    .eq("id", ownership.id);

  if (error) return { error: "Failed to undo sale. Please try again." };

  // Best-effort: clear photo and description (columns added in post-migration).
  await supabase
    .from("ownerships")
    .update({ sale_photo_path: null, sale_description: null })
    .eq("id", ownership.id);

  revalidatePath(`/car/${car.slug}`);
  revalidatePath("/garage");
  revalidatePath("/profile");
  return { slug: car.slug };
}

export async function updateSaleDetails(
  _prev: CarState,
  formData: FormData
): Promise<CarState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const carId = formData.get("car_id") as string;

  const { data: car } = await supabase
    .from("cars")
    .select("slug")
    .eq("id", carId)
    .eq("current_owner_id", user.id)
    .single();

  if (!car) return { error: "Car not found." };

  const { data: ownership } = await supabase
    .from("ownerships")
    .select("id")
    .eq("car_id", carId)
    .eq("user_id", user.id)
    .not("end_date", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ownership) return { error: "No ended ownership found." };

  const saleDate = (formData.get("sale_date") as string)?.trim();
  if (!saleDate) return { error: "Sale date is required." };

  const salePriceRaw = (formData.get("sale_price") as string)?.trim();
  const salePrice = salePriceRaw ? parseFloat(salePriceRaw) : null;
  const salePricePublic = formData.get("sale_price_public") === "true";
  const currency = (formData.get("currency") as string)?.trim() || "EUR";

  const saleMileageRaw = parseInt(formData.get("sale_mileage_value") as string, 10);
  const saleMileageValue = isNaN(saleMileageRaw) || saleMileageRaw <= 0 ? null : saleMileageRaw;
  const saleMileageUnit = (formData.get("sale_mileage_unit") as string)?.trim() || "km";

  const salePhotoPath = (formData.get("sale_photo_path") as string)?.trim() || null;
  const saleDescription = (formData.get("sale_description") as string)?.trim() || null;

  const { error } = await supabase
    .from("ownerships")
    .update({
      end_date: saleDate,
      sale_price: salePrice,
      sale_price_public: salePricePublic,
      currency,
      sale_mileage_value: saleMileageValue,
      sale_mileage_unit: saleMileageValue ? saleMileageUnit : null,
    })
    .eq("id", ownership.id);

  if (error) return { error: "Failed to save. Please try again." };

  // Best-effort: save photo and description only if columns exist (post-migration).
  if (salePhotoPath !== null || saleDescription !== null) {
    await supabase
      .from("ownerships")
      .update({ sale_photo_path: salePhotoPath, sale_description: saleDescription })
      .eq("id", ownership.id);
  }

  revalidatePath(`/car/${car.slug}`);
  revalidatePath("/garage");
  return { slug: car.slug };
}

export async function deleteCar(carId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Not authenticated";

  const { data: car } = await supabase
    .from("cars")
    .select("slug")
    .eq("id", carId)
    .eq("current_owner_id", user.id)
    .single();

  if (!car) return "Car not found";

  // Collect storage paths before deletion
  const { data: photos } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("car_id", carId);

  // Delete car record — cascades to events, photos rows, ownerships, vins
  const { error } = await supabase.from("cars").delete().eq("id", carId);
  if (error) return "Failed to delete car. Please try again.";

  // Clean up storage files (best effort — don't block on errors)
  const paths = (photos ?? []).map((p) => p.storage_path);
  if (paths.length > 0) {
    await supabase.storage.from("car-photos").remove(paths);
  }

  revalidatePath("/garage");
  revalidatePath("/profile");
  return null;
}

export async function addPhotosToGallery(
  carId: string,
  paths: string[]
): Promise<string | null> {
  if (paths.length === 0) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Not authenticated";

  const { data: car } = await supabase
    .from("cars")
    .select("slug")
    .eq("id", carId)
    .eq("current_owner_id", user.id)
    .single();

  if (!car) return "Car not found";

  const { data: lastPhoto } = await supabase
    .from("photos")
    .select("position")
    .eq("car_id", carId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const startPosition = (lastPhoto?.position ?? -1) + 1;

  const { error } = await supabase.from("photos").insert(
    paths.map((storage_path, i) => ({
      car_id: carId,
      storage_path,
      position: startPosition + i,
    }))
  );

  if (error) return "Failed to save photos";
  revalidatePath(`/car/${car.slug}`);
  revalidatePath("/profile");
  revalidatePath("/garage");
  return null;
}
