"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Tracks whether a title element has scrolled out of the viewport, so a
 * compact pinned header can take over. Shared by StickyPageHeader and any
 * screen with a non-standard large-title layout (e.g. ProfileShell).
 */
export function useTitleCollapse<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setCompact(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, compact };
}

interface CompactTitleBarProps {
  title: string;
  compact: boolean;
  back?: { href: string };
}

/** Fixed compact bar pinned below the notch gradient — slides in once the large title leaves the viewport. */
export function CompactTitleBar({ title, compact, back }: CompactTitleBarProps) {
  return (
    <div
      aria-hidden={!compact}
      className={[
        "fixed inset-x-0 z-[60]",
        "motion-safe:transition-[opacity,transform] motion-safe:duration-200",
        compact
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-1 pointer-events-none",
      ].join(" ")}
      style={{
        top: "env(safe-area-inset-top, 0px)",
        background: "rgba(251,250,247,0.92)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        borderBottom: "1px solid rgba(17,17,17,0.06)",
      }}
    >
      <div className="flex items-center gap-3 px-5 h-12">
        {back && (
          <Link
            href={back.href}
            className="text-ink/40 hover:text-ink transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
        <span className="font-display font-bold text-base text-ink truncate">
          {title}
        </span>
      </div>
    </div>
  );
}

interface Props {
  title: string;
  back?: { href: string; label?: string };
  children?: React.ReactNode;
}

/**
 * Large-title header with iOS-style collapse.
 *
 * Renders:
 * 1. The large h1 in the natural document flow (parent provides padding).
 * 2. A fixed compact bar that slides in once the h1 scrolls off-screen.
 *
 * Place inside the page's padded header zone; the compact bar is position:fixed
 * so it doesn't affect layout.
 */
export function StickyPageHeader({ title, back, children }: Props) {
  const { ref, compact } = useTitleCollapse<HTMLHeadingElement>();

  return (
    <>
      {/* Back link — large-title zone */}
      {back && (
        <Link
          href={back.href}
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors mb-5"
        >
          <ArrowLeft size={13} />
          {back.label ?? "Back"}
        </Link>
      )}

      {/* Large title */}
      <h1
        ref={ref}
        className="font-display font-extrabold text-[2rem] leading-tight text-ink tracking-tight"
      >
        {title}
      </h1>

      {/* Subtitle / extra content */}
      {children}

      {/* Compact fixed bar — appears once h1 leaves viewport */}
      <CompactTitleBar
        title={title}
        compact={compact}
        back={back ? { href: back.href } : undefined}
      />
    </>
  );
}
