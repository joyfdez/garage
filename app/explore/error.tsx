"use client";

import { useEffect, useState } from "react";
import { WifiOff, RotateCcw } from "lucide-react";

export default function ExploreError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const handler = () => setOffline(!navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  return (
    <div className="bg-paper min-h-dvh flex flex-col items-center justify-center px-8 pb-24 text-center">
      {offline ? (
        <>
          <WifiOff size={28} className="text-hint mb-4" />
          <p className="font-display font-bold text-lg text-ink mb-1.5">You&apos;re offline</p>
          <p className="text-ink-muted text-sm mb-6">Check your connection and try again.</p>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-ink text-paper text-sm font-medium rounded-input"
          >
            <RotateCcw size={13} />
            Try again
          </button>
        </>
      ) : (
        <>
          <p className="font-display font-bold text-lg text-ink mb-1.5">Something went wrong</p>
          <p className="text-ink-muted text-sm mb-6">Couldn&apos;t load Explore.</p>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-ink text-paper text-sm font-medium rounded-input"
          >
            <RotateCcw size={13} />
            Try again
          </button>
        </>
      )}
    </div>
  );
}
