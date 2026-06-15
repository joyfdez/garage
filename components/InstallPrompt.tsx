"use client";

import { useEffect, useRef, useState } from "react";
import { Share, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem("pwa-prompt-dismissed")) return;

    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    setIsIos(ios);

    if (ios) {
      timerRef.current = setTimeout(() => setVisible(true), 5000);
      return () => clearTimeout(timerRef.current);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      timerRef.current = setTimeout(() => setVisible(true), 5000);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(timerRef.current);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferred(null);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 inset-x-4 z-50 flex items-start gap-3 rounded-2xl border border-ink/10 bg-paper p-4 shadow-xl page-enter">
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm">Add Garage to your home screen</p>
        {isIos ? (
          <p className="mt-1 text-xs text-ink-muted leading-relaxed">
            Tap <Share size={11} className="inline mx-0.5 relative -top-px" /> in Safari, then{" "}
            <strong className="font-semibold text-ink/70">Add to Home Screen</strong>
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-ink-muted">
            Install for a faster, full-screen experience.
          </p>
        )}
      </div>

      {!isIos && deferred && (
        <button
          onClick={install}
          className="shrink-0 rounded-xl bg-racing-green px-3 py-1.5 text-xs font-bold text-paper"
        >
          Install
        </button>
      )}

      <button
        onClick={dismiss}
        className="shrink-0 text-ink/30 hover:text-ink/60 transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
