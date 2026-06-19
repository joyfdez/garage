"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export interface ViewerPhoto {
  id: string;
  url: string;
}

interface FullscreenPhotoViewerProps {
  photos: ViewerPhoto[];
  initialIndex: number;
  onClose: () => void;
  alt?: string;
}

const SWIPE_THRESHOLD = 40;
const TAP_SLOP = 8;
const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const DURATION = "0.32s";

function Dots({
  current,
  count,
  reducedMotion,
}: {
  current: number;
  count: number;
  reducedMotion: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: i === current ? "18px" : "6px",
            height: "6px",
            backgroundColor:
              i === current ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.40)",
            transition: reducedMotion
              ? "none"
              : `width 0.22s ${EASE}, background-color 0.22s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Full-screen photo viewer shared by the hero carousel and the gallery tab.
 * - Safe area at top and bottom (env(safe-area-inset-*))
 * - Body scroll locked while open
 * - Escape / ArrowLeft / ArrowRight keyboard support
 * - Horizontal swipe to navigate, tap to close
 * - prefers-reduced-motion respected
 */
export function FullscreenPhotoViewer({
  photos,
  initialIndex,
  onClose,
  alt = "",
}: FullscreenPhotoViewerProps) {
  const [idx, setIdx] = useState(initialIndex);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const anchor = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx((i) => Math.min(photos.length - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  const transition = reducedMotion ? "none" : `transform ${DURATION} ${EASE}`;

  function onDown(e: React.PointerEvent) {
    anchor.current = { x: e.clientX, y: e.clientY };
    setDrag(0);
    setDragging(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onMove(e: React.PointerEvent) {
    if (!anchor.current) return;
    const dx = e.clientX - anchor.current.x;
    setDrag(dx);
    if (Math.abs(dx) > TAP_SLOP) setDragging(true);
  }

  function onUp(e: React.PointerEvent) {
    if (!anchor.current) return;
    const dx = e.clientX - anchor.current.x;
    const dy = e.clientY - anchor.current.y;
    const wasDragging = dragging;
    anchor.current = null;
    setDrag(0);
    setDragging(false);

    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      // Horizontal swipe — advance or retreat
      setIdx((i) => Math.max(0, Math.min(photos.length - 1, i + (dx < 0 ? 1 : -1))));
    } else if (!wasDragging && Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) {
      // Tap on backdrop (or image) — close
      onClose();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[96] bg-black flex flex-col"
      style={{ touchAction: "none" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      {/* Top bar — photo counter + close button */}
      <div
        className="relative z-10 flex items-center justify-between px-4 pt-2 pb-3 shrink-0"
        style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top, 0px))" }}
      >
        <span className="text-white/50 text-sm tabular-nums font-medium select-none">
          {idx + 1} / {photos.length}
        </span>
        <button
          type="button"
          aria-label="Close"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:bg-white/30 transition-colors"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Photo strip */}
      <div className="relative flex-1 overflow-hidden select-none">
        {photos.map((photo, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.url}
            alt={i === idx ? alt : ""}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              transform: `translateX(calc(${(i - idx) * 100}% + ${drag}px))`,
              transition: dragging ? "none" : transition,
            }}
          />
        ))}
      </div>

      {/* Bottom dots */}
      {photos.length > 1 && (
        <div
          className="shrink-0 pt-3"
          style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <Dots current={idx} count={photos.length} reducedMotion={reducedMotion} />
        </div>
      )}
    </div>
  );
}
