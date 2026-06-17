"use client";

import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  updateProfile, updateAvatarUrl, updateCoverPhotoPath,
  changePassword, deleteAccount, updateUsername,
  SettingsState, PasswordState, DeleteState, UsernameState,
} from "@/lib/actions/profile";
import { signOut } from "@/lib/actions/auth";
import { Camera, LogOut, Eye, EyeOff, Lock, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CropModal } from "@/components/CropModal";
import { CountrySelect } from "@/components/CountrySelect";
import { CURRENCIES } from "@/lib/car-options";
import { toast } from "sonner";

export interface ProfileForSettings {
  username: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  country: string | null;
  bio: string | null;
  gender: string | null;
  birthday: string | null;
  avatar_url: string | null;
  cover_photo_path: string | null;
  mileage_unit: "km" | "mi";
  preferred_currency: string;
}

const GENDERS = ["", "Male", "Female", "Non-binary", "Other", "Prefer not to say"];

export function SettingsForm({
  profile,
  userId,
  supabaseUrl,
}: {
  profile: ProfileForSettings;
  userId: string;
  supabaseUrl: string;
}) {
  // ── Form states ──────────────────────────────────────────────────────────────
  const [profileState, profileAction, profilePending] =
    useActionState<SettingsState, FormData>(updateProfile, null);
  const [pwState, pwAction, pwPending] =
    useActionState<PasswordState, FormData>(changePassword, null);
  const [deleteState, deleteAction, deletePending] =
    useActionState<DeleteState, FormData>(deleteAccount, null);
  const [usernameState, usernameAction, usernamePending] =
    useActionState<UsernameState, FormData>(updateUsername, null);

  const router = useRouter();

  // ── Username tracking ────────────────────────────────────────────────────────
  const [currentUsername, setCurrentUsername] = useState(profile.username);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // ── Photo state ──────────────────────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [coverPath, setCoverPath] = useState(profile.cover_photo_path);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"avatar" | "cover" | null>(null);
  const [photoWorking, setPhotoWorking] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);

  // ── Delete confirm state ─────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Toasts ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profileState) return;
    if (profileState.success) {
      toast.success("Profile saved", { style: { borderLeft: "3px solid #1A3A2E" } });
    } else if (profileState.error) {
      toast.error(profileState.error, { style: { borderLeft: "3px solid #ef4444" } });
    }
  }, [profileState]);

  useEffect(() => {
    if (!pwState) return;
    if (pwState.success) {
      toast.success("Password updated", { style: { borderLeft: "3px solid #1A3A2E" } });
    } else if (pwState.error) {
      toast.error(pwState.error, { style: { borderLeft: "3px solid #ef4444" } });
    }
  }, [pwState]);

  useEffect(() => {
    if (deleteState && "success" in deleteState) {
      router.push("/");
    }
  }, [deleteState, router]);

  useEffect(() => {
    if (!usernameState) return;
    if (usernameState.success) {
      const newUsername = usernameInputRef.current?.value ?? currentUsername;
      setCurrentUsername(newUsername);
      toast.success("Username updated", { style: { borderLeft: "3px solid #1A3A2E" } });
    } else if (usernameState.error) {
      toast.error(usernameState.error, { style: { borderLeft: "3px solid #ef4444" } });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameState]);

  function openCrop(file: File, target: "avatar" | "cover") {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropSrc(e.target?.result as string);
      setCropTarget(target);
    };
    reader.readAsDataURL(file);
  }

  const handleAvatarSave = useCallback(async (blob: Blob) => {
    setPhotoWorking(true);
    setPhotoError(null);
    try {
      const supabase = createClient();
      const file = new File([blob], "avatar.webp", { type: "image/webp" });
      const path = `${userId}/avatar.webp`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) {
        console.error("[avatar upload] storage error:", upErr.message);
        setPhotoError("Upload failed: " + upErr.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      const saveErr = await updateAvatarUrl(urlWithBust);
      if (saveErr) {
        setPhotoError(saveErr);
        toast.error("Couldn't save avatar", { style: { borderLeft: "3px solid #ef4444" } });
        return;
      }
      setAvatarUrl(urlWithBust);
      setCropSrc(null);
      setCropTarget(null);
      toast.success("Photo updated", { style: { borderLeft: "3px solid #1A3A2E" } });
    } catch (err) {
      console.error("[handleAvatarSave] unexpected error:", err);
      setPhotoError("Unexpected error — check console.");
    } finally {
      setPhotoWorking(false);
    }
  }, [userId]);

  const handleCoverSave = useCallback(async (blob: Blob) => {
    setPhotoWorking(true);
    setPhotoError(null);
    try {
      const supabase = createClient();
      const file = new File([blob], "cover.webp", { type: "image/webp" });
      const path = `${userId}/cover.webp`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) {
        console.error("[cover upload] storage error:", upErr.message);
        setPhotoError("Upload failed: " + upErr.message);
        return;
      }

      // Get versioned public URL (same pattern as avatar) so the browser always
      // fetches the new image instead of serving the cached previous one.
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithBust = `${publicUrl}?v=${Date.now()}`;

      const saveErr = await updateCoverPhotoPath(urlWithBust);
      if (saveErr) {
        setPhotoError(saveErr);
        toast.error("Couldn't save cover", { style: { borderLeft: "3px solid #ef4444" } });
        return;
      }
      setCoverPath(urlWithBust);
      setCropSrc(null);
      setCropTarget(null);
      toast.success("Cover updated", { style: { borderLeft: "3px solid #1A3A2E" } });
    } catch (err) {
      console.error("[handleCoverSave] unexpected error:", err);
      setPhotoError("Unexpected error — check console.");
    } finally {
      setPhotoWorking(false);
    }
  }, [userId]);

  // cover_photo_path may be a full versioned URL (new uploads) or a bare storage
  // path (legacy data). Detect by prefix so both display correctly.
  const coverUrl = coverPath
    ? coverPath.startsWith("http")
      ? coverPath
      : `${supabaseUrl}/storage/v1/object/public/avatars/${coverPath}`
    : null;

  return (
    <>
      {/* Crop modal — rendered outside the form flow */}
      {cropSrc && cropTarget && (
        <CropModal
          imageSrc={cropSrc}
          aspect={cropTarget === "avatar" ? 1 : 3}
          onSave={cropTarget === "avatar" ? handleAvatarSave : handleCoverSave}
          onClose={() => { setCropSrc(null); setCropTarget(null); }}
        />
      )}

      <div className="space-y-10 pb-24">

        {/* ── Profile ────────────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <h2 className="font-display font-bold text-lg">Profile</h2>

          {/* Cover photo */}
          <div>
            <label className="text-xs text-ink/50 mb-1.5 block">Cover photo</label>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={photoWorking}
              className="relative w-full aspect-[3/1] rounded-2xl overflow-hidden bg-card group"
            >
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink/20">
                  <Camera size={28} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-disabled:opacity-100 transition-opacity rounded-2xl">
                {photoWorking && cropTarget === "cover" ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera size={20} className="text-white" />
                )}
              </div>
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f, "cover"); }} />
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={photoWorking}
              className="relative group shrink-0"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center font-display font-bold text-2xl text-ink/30">
                  {currentUsername[0].toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-disabled:opacity-100 transition-opacity">
                {photoWorking && cropTarget === "avatar" ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera size={14} className="text-white" />
                )}
              </div>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) openCrop(f, "avatar"); }} />
            <div>
              <p className="font-medium text-sm">@{currentUsername}</p>
              <p className="text-xs text-ink/30 mt-0.5">Tap to change avatar or cover.</p>
              {photoError && <p className="text-xs text-red-500 mt-0.5">{photoError}</p>}
            </div>
          </div>

          {/* Username */}
          <form action={usernameAction} className="space-y-3 pb-4 border-b border-card">
            <div>
              <label htmlFor="username-input" className="text-xs text-ink/50 mb-1 block">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 text-sm select-none">@</span>
                <input
                  ref={usernameInputRef}
                  id="username-input"
                  name="username"
                  defaultValue={currentUsername}
                  placeholder="garage_builder"
                  minLength={2}
                  maxLength={30}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="input-field w-full pl-7"
                />
              </div>
              <p className="text-xs text-ink/30 mt-1">Lowercase letters, numbers, underscores. 2–30 chars.</p>
            </div>
            {usernameState?.error && (
              <p className="text-sm text-red-500">{usernameState.error}</p>
            )}
            <button
              type="submit"
              disabled={usernamePending}
              className="px-4 py-2.5 bg-card rounded-xl text-sm font-medium hover:bg-ink/10 transition-colors disabled:opacity-50"
            >
              {usernamePending ? "Saving…" : "Change username"}
            </button>
          </form>

          {/* Profile form */}
          <form action={profileAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">First name</label>
                <input name="first_name" defaultValue={profile.first_name ?? ""}
                  placeholder="Rodrigo" className="input-field w-full" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Last name</label>
                <input name="last_name" defaultValue={profile.last_name ?? ""}
                  placeholder="García" className="input-field w-full" />
              </div>
            </div>

            <div>
              <label className="text-xs text-ink/50 mb-1 block">Display name</label>
              <input name="display_name" defaultValue={profile.display_name ?? ""}
                placeholder="Rodrigo" className="input-field w-full" />
            </div>

            <div>
              <label className="text-xs text-ink/50 mb-1 block">Bio</label>
              <textarea name="bio" defaultValue={profile.bio ?? ""} rows={3}
                placeholder="What do you build?" className="input-field w-full resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Location</label>
                <input name="location" defaultValue={profile.location ?? ""}
                  placeholder="Barcelona" className="input-field w-full" />
              </div>
              <div>
                <label htmlFor="country-select-input" className="text-xs text-ink/50 mb-1 block">Country</label>
                <CountrySelect defaultValue={profile.country} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Gender</label>
                <select name="gender" defaultValue={profile.gender ?? ""}
                  className="input-field w-full">
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g || "Prefer not to say"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Birthday</label>
                <input name="birthday" type="date" defaultValue={profile.birthday ?? ""}
                  className="input-field w-full" />
              </div>
            </div>

            <div>
              <label className="text-xs text-ink/50 mb-2 block">Mileage units</label>
              <div className="flex gap-2">
                {(["km", "mi"] as const).map((u) => (
                  <label key={u} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="mileage_unit" value={u}
                      defaultChecked={profile.mileage_unit === u}
                      className="sr-only peer" />
                    <span className="px-4 py-2 rounded-xl text-sm font-medium border border-card bg-card text-ink/50 peer-checked:bg-ink peer-checked:text-paper peer-checked:border-ink transition-colors">
                      {u === "km" ? "km — kilometres" : "mi — miles"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-ink/50 mb-2 block">Default currency</label>
              <div className="flex flex-wrap gap-2">
                {CURRENCIES.map((c) => (
                  <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="preferred_currency" value={c.value}
                      defaultChecked={profile.preferred_currency === c.value}
                      className="sr-only peer" />
                    <span className="px-3 py-2 rounded-xl text-sm font-medium border border-card bg-card text-ink/50 peer-checked:bg-ink peer-checked:text-paper peer-checked:border-ink transition-colors">
                      {c.symbol} {c.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={profilePending}
              className="w-full bg-ink text-paper font-display font-bold py-3 rounded-2xl hover:bg-ink/85 transition-colors disabled:opacity-50">
              {profilePending ? "Saving…" : "Save profile"}
            </button>
          </form>
        </section>

        {/* ── Security ───────────────────────────────────────────────────────── */}
        <section className="space-y-4 border-t border-card pt-8">
          <h2 className="font-display font-bold text-lg">Security</h2>

          <form action={pwAction} className="space-y-3">
            <div>
              <label className="text-xs text-ink/50 mb-1 block">New password</label>
              <div className="relative">
                <input name="new_password" type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters" className="input-field w-full pr-10" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Confirm new password</label>
              <input name="confirm_password" type={showPassword ? "text" : "password"}
                placeholder="Same as above" className="input-field w-full" />
            </div>

            <button type="submit" disabled={pwPending}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-card rounded-xl text-sm font-medium hover:bg-ink/10 transition-colors disabled:opacity-50">
              <Lock size={13} />
              {pwPending ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>

        {/* ── Sign out ───────────────────────────────────────────────────────── */}
        <section className="border-t border-card pt-6">
          <form action={signOut}>
            <button type="submit"
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors">
              <LogOut size={14} />Sign out
            </button>
          </form>
        </section>

        {/* ── Danger zone ────────────────────────────────────────────────────── */}
        <section className="border-t border-card pt-6">
          {!showDeleteConfirm ? (
            <button type="button" onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={14} />Delete account…
            </button>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 space-y-4">
              <div>
                <p className="font-display font-bold text-sm text-red-700 mb-1">
                  Delete your account?
                </p>
                <p className="text-xs text-red-600/70 leading-relaxed">
                  This permanently deletes your profile, all your cars, events, and photos.
                  This cannot be undone.
                </p>
              </div>

              <form action={deleteAction} className="space-y-3">
                <input type="hidden" name="expected_username" value={profile.username} />
                <div>
                  <label className="text-xs text-red-600/70 mb-1 block">
                    Type <strong>@{profile.username}</strong> to confirm
                  </label>
                  <input name="confirm_text" autoComplete="off" spellCheck={false}
                    placeholder={profile.username}
                    className="input-field w-full border border-red-200 focus:ring-red-300/40" />
                </div>
                {deleteState && "error" in deleteState && (
                  <p className="text-xs text-red-600">{deleteState.error}</p>
                )}
                <div className="flex gap-2">
                  <button type="submit" disabled={deletePending}
                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-display font-bold text-sm py-2.5 rounded-xl transition-colors">
                    {deletePending ? "Deleting…" : "Delete my account"}
                  </button>
                  <button type="button" onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-card text-ink/60 font-medium text-sm py-2.5 rounded-xl hover:bg-ink/10 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

      </div>
    </>
  );
}
