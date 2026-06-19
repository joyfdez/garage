"use client";

import { useEffect, useRef, useState } from "react";
import { FullscreenPhotoViewer } from "@/components/FullscreenPhotoViewer";

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

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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

      {/* ── Fullscreen lightbox (shared viewer) ───────────────────────────── */}
      {lightboxOpen && (
        <FullscreenPhotoViewer
          photos={photos}
          initialIndex={lbIdx}
          onClose={() => setLightboxOpen(false)}
          alt={alt}
        />
      )}
    </>
  );
}
