"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, AlertCircle, Mail } from "lucide-react";
import { authAction } from "@/lib/actions/auth";

type Mode = "signin" | "signup";

export function AuthForm({ errorParam }: { errorParam?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(authAction, null);

  const switchMode = (next: Mode) => {
    setMode(next);
  };

  // Email-confirmation pending state
  if (state && "success" in state && mode === "signup") {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="mx-auto w-10 h-10 rounded-full bg-racing-green/10 flex items-center justify-center">
          <Mail size={20} className="text-racing-green" />
        </div>
        <div>
          <p className="font-display font-semibold text-ink">Check your email</p>
          <p className="text-ink/50 text-sm mt-1">
            Click the link we sent to activate your account.
          </p>
        </div>
      </div>
    );
  }

  const errorMessage =
    (state && "error" in state ? state.error : null) ?? errorParam ?? null;

  return (
    <div className="space-y-4">
      {/* Google */}
      <a
        href="/auth/google"
        className="flex items-center justify-center gap-2.5 w-full rounded-xl border border-card bg-white px-4 py-2.5 text-sm font-medium hover:bg-card transition-colors"
      >
        <GoogleIcon />
        Continue with Google
      </a>

      <div className="flex items-center gap-3 text-ink/30">
        <div className="flex-1 h-px bg-card" />
        <span className="text-xs">or</span>
        <div className="flex-1 h-px bg-card" />
      </div>

      {/* Mode tabs */}
      <div className="flex rounded-xl bg-card p-1 text-sm font-medium">
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`flex-1 rounded-lg py-1.5 transition-colors ${
              mode === m
                ? "bg-white text-ink shadow-sm"
                : "text-ink/40 hover:text-ink/60"
            }`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="mode" value={mode} />

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-ink/50 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-card bg-white px-3.5 py-2.5 text-sm outline-none focus:border-racing-green/40 focus:ring-2 focus:ring-racing-green/10 transition"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-ink/50 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder={mode === "signup" ? "8+ characters" : "••••••••"}
              className="w-full rounded-xl border border-card bg-white px-3.5 py-2.5 text-sm outline-none focus:border-racing-green/40 focus:ring-2 focus:ring-racing-green/10 transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-ink px-4 py-2.5 font-semibold text-sm text-paper hover:bg-ink/85 transition-colors disabled:opacity-60"
        >
          {isPending
            ? mode === "signin"
              ? "Signing in…"
              : "Creating account…"
            : mode === "signin"
            ? "Sign in"
            : "Create account"}
        </button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2045c0-.638-.057-1.252-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
