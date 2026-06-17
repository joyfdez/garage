"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export interface HeroPhoto {
  id: string;
  url: string;
}

interface CarHeroProps {
  photos: HeroPhoto[];
  alt: string;
  placeholderYear?: number;
  /** Glass bar + gradient rendered on top of photos */
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 40; // px — minimum horizontal drag to commit a swipe
const TAP_SLOP = 8;         // px — max movement to still count as a tap

/**
 * Hero photo carousel with swipe gestures, dot indicators, and a fullscreen
 * lightbox (also swipeable). Passes glass bar content as children so server-
 * rendered title/specs can layer on top without becoming client components.
 *
 * Transitions are disabled when the user prefers reduced motion.
 */
export function CarHero({ photos, alt, placeholderYear, children }: CarHeroProps) {
  const [idx, setIdx] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);
  const [lbDrag, setLbDrag] = useState(0);
  const [lbDragging, setLbDragging] = useState(false);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setLbIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setLbIdx((i) => Math.min(photos.length - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, photos.length]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  const DURATION = "0.32s";
  const transition = reducedMotion ? "none" : `transform ${DURATION} ${EASE}`;

  // ── Hero swipe state ──────────────────────────────────────────────────────

  const heroAnchor = useRef<{ x: number; y: number } | null>(null);
  const heroAxis   = useRef<"h" | "v" | null>(null);

  function heroDown(e: React.PointerEvent) {
    heroAnchor.current = { x: e.clientX, y: e.clientY };
    heroAxis.current   = null;
    setDragOffset(0);
    setDragging(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function heroMove(e: React.PointerEvent) {
    if (!heroAnchor.current) return;
    const dx = e.clientX - heroAnchor.current.x;
    const dy = e.clientY - heroAnchor.current.y;

    if (!heroAxis.current) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) heroAxis.current = "h";
      else if (Math.abs(dy) > 4) heroAxis.current = "v";
      else return;
    }
    if (heroAxis.current === "h") {
      setDragOffset(dx);
      setDragging(true);
    }
  }

  function heroUp(e: React.PointerEvent) {
    if (!heroAnchor.current) return;
    const dx = e.clientX - heroAnchor.current.x;
    const dy = e.clientY - heroAnchor.current.y;
    const wasDragging = dragging;
    heroAnchor.current = null;
    heroAxis.current = null;
    setDragOffset(0);
    setDragging(false);

    const isSwipe = Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy);
    const isTap   = !wasDragging && Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP;

    if (isSwipe && photos.length > 1) {
      setIdx((i) => Math.max(0, Math.min(photos.length - 1, i + (dx < 0 ? 1 : -1))));
    } else if (isTap) {
      setLbIdx(idx);
      setLightboxOpen(true);
    }
  }

  // ── Lightbox swipe state ──────────────────────────────────────────────────

  const lbAnchor = useRef<{ x: number } | null>(null);

  function lbDown(e: React.PointerEvent) {
    lbAnchor.current = { x: e.clientX };
    setLbDrag(0);
    setLbDragging(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function lbMove(e: React.PointerEvent) {
    if (!lbAnchor.current) return;
    const dx = e.clientX - lbAnchor.current.x;
    setLbDrag(dx);
    if (Math.abs(dx) > 4) setLbDragging(true);
  }

  function lbUp(e: React.PointerEvent) {
    if (!lbAnchor.current) return;
    const dx = e.clientX - lbAnchor.current.x;
    lbAnchor.current = null;
    setLbDrag(0);
    setLbDragging(false);
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      setLbIdx((i) => Math.max(0, Math.min(photos.length - 1, i + (dx < 0 ? 1 : -1))));
    }
  }

  // ── Dots ─────────────────────────────────────────────────────────────────

  function Dots({ current, count, className }: { current: number; count: number; className?: string }) {
    return (
      <div className={`flex items-center justify-center gap-1.5 ${className ?? ""}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: i === current ? "18px" : "6px",
              height: "6px",
              backgroundColor:
                i === current ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.40)",
              transition: reducedMotion ? "none" : `width 0.22s ${EASE}, background-color 0.22s`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* ── Hero area ──────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ height: "70svh", minHeight: "340px" }}
      >
        {/* Photo strip — touch-action: pan-y lets page scroll vertically while we
            capture horizontal drags for the carousel. */}
        <div
          className="absolute inset-0 select-none"
          style={{ touchAction: "pan-y", cursor: photos.length > 0 ? "pointer" : "default" }}
          onPointerDown={heroDown}
          onPointerMove={heroMove}
          onPointerUp={heroUp}
        >
          {photos.length > 0 ? (
            photos.map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={alt}
                draggable={false}
                fetchPriority={i === 0 ? "high" : "low"}
                className="absolute inset-0 w-full h-full object-cover will-change-transform"
                style={{
                  transform: `translateX(calc(${(i - idx) * 100}% + ${dragOffset}px))`,
                  transition: dragging ? "none" : transition,
                }}
              />
            ))
          ) : (
            <div className="absolute inset-0 bg-racing-green flex items-end pb-6 px-5">
              <span className="font-display font-extrabold text-white/8 text-[12vw] leading-none select-none pointer-events-none">
                {placeholderYear}
              </span>
            </div>
          )}
        </div>

        {/* Dot indicators — z-[5] floats above photos; below glass bar (glass
            bar renders last in DOM and has its own stacking context via backdrop-filter) */}
        {photos.length > 1 && (
          <div
            className="absolute inset-x-0 pointer-events-none z-[5]"
            style={{ bottom: "4.75rem" }}
          >
            <Dots current={idx} count={photos.length} />
          </div>
        )}

        {/* Server-rendered children: gradient scrim + glass bar */}
        {children}
      </div>

      {/* ── Fullscreen lightbox ────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          className="fixed inset-0 z-[90] bg-black flex flex-col"
          style={{ touchAction: "none" }}
          onPointerDown={lbDown}
          onPointerMove={lbMove}
          onPointerUp={lbUp}
        >
          {/* Top bar */}
          <div
            className="relative z-10 flex items-center justify-between px-4 pt-2 pb-3 shrink-0"
            style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top, 0px))" }}
          >
            <span className="text-white/50 text-sm tabular-nums font-medium select-none">
              {lbIdx + 1} / {photos.length}
            </span>
            <button
              type="button"
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:bg-white/30 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
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
                alt={alt}
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  transform: `translateX(calc(${(i - lbIdx) * 100}% + ${lbDrag}px))`,
                  transition: lbDragging ? "none" : transition,
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
              <Dots current={lbIdx} count={photos.length} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
