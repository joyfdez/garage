"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";
import { createProfile } from "@/lib/actions/profile";

export function OnboardingForm({ hint }: { hint?: string }) {
  const [state, formAction, isPending] = useActionState(createProfile, null);

  return (
    <form action={formAction} className="space-y-4">
      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-xs font-medium text-ink/50 mb-1">
          Username <span className="text-orange">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/30 text-sm select-none pointer-events-none">
            @
          </span>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            pattern="[a-z0-9_]{2,30}"
            defaultValue={hint}
            placeholder="yourname"
            className="w-full rounded-xl border border-card bg-white pl-8 pr-3.5 py-2.5 text-sm outline-none focus:border-orange focus:ring-2 focus:ring-orange/10 transition"
          />
        </div>
        <p className="text-2xs text-ink/30 mt-1">
          Lowercase letters, numbers, underscores. 2–30 characters.
        </p>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-xs font-medium text-ink/50 mb-1">
          Location{" "}
          <span className="font-normal text-ink/30">(optional)</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          autoComplete="off"
          placeholder="Madrid, Spain"
          className="w-full rounded-xl border border-card bg-white px-3.5 py-2.5 text-sm outline-none focus:border-orange focus:ring-2 focus:ring-orange/10 transition"
        />
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-orange px-4 py-2.5 font-semibold text-sm text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
      >
        {isPending ? "Setting up your garage…" : "Start my garage →"}
      </button>
    </form>
  );
}
