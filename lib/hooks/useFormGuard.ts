"use client";
import { useEffect } from "react";

const DIRTY_FLAG = "__garageFormDirty";
type W = Record<string, unknown>;

const CONFIRM_MSG = "Discard unsaved changes? Your changes will be lost.";

/**
 * Warns the user before leaving a dirty form.
 * - Blocks browser back / close / refresh via `beforeunload`
 * - Sets a window flag so BottomNav can intercept client-side tab switches
 */
export function useFormGuard(isDirty: boolean): void {
  // Sync the global flag (read by BottomNav and GuardedLink)
  useEffect(() => {
    (window as unknown as W)[DIRTY_FLAG] = isDirty;
    return () => {
      delete (window as unknown as W)[DIRTY_FLAG];
    };
  }, [isDirty]);

  // Block browser back, tab close, PWA close
  useEffect(() => {
    if (!isDirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}

/** Returns true if the user confirms discarding, or the form is clean. */
export function confirmDiscard(isDirty: boolean): boolean {
  if (!isDirty) return true;
  return confirm(CONFIRM_MSG);
}

/** Read the global dirty flag (for use outside React components). */
export function isFormDirty(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as W)[DIRTY_FLAG];
}
