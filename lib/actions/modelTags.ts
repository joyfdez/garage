"use server";

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

  if (existing) {
    const { error } = await supabase
      .from("user_model_tags")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);
    return { tagged: false, error: error?.message };
  } else {
    const { error } = await supabase
      .from("user_model_tags")
      .insert({ user_id: user.id, model_id: modelId, tag_type: tagType });
    return { tagged: true, error: error?.message };
  }
}
