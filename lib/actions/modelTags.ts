"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TagType = "driven" | "wishlist";

export async function toggleModelTag(
  modelId: string,
  tagType: TagType
): Promise<{ tagged: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { tagged: false, error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("user_model_tags")
    .select("id")
    .eq("user_id", user.id)
    .eq("model_id", modelId)
    .eq("tag_type", tagType)
    .maybeSingle();

  let dbError: string | undefined;
  let tagged: boolean;

  if (existing) {
    const { error } = await supabase
      .from("user_model_tags")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) console.error("[toggleModelTag] delete error:", error.code, error.message, error.details);
    dbError = error?.message;
    tagged  = false;
  } else {
    const { error } = await supabase
      .from("user_model_tags")
      .insert({ user_id: user.id, model_id: modelId, tag_type: tagType });
    if (error) console.error("[toggleModelTag] insert error:", error.code, error.message, error.details);
    dbError = error?.message;
    tagged  = true;
  }

  if (!dbError) {
    // Revalidate so the router refresh picks up fresh DB data instead of
    // stale cached initialTags — prevents the optimistic update from being
    // wiped by the automatic post-action route refresh in Next.js 15.
    revalidatePath("/explore");
    revalidatePath("/profile");
  }

  return { tagged, error: dbError };
}
