"use client";

import { useEffect, useRef } from "react";

interface ParallaxHeroProps {
  src: string;
  alt: string;
}

/**
 * Full-bleed hero image with a subtle scroll parallax (image scrolls at ~30%
 * of the page scroll speed). The parent must be `position: relative; overflow: hidden`.
 * Disabled automatically when the user prefers reduced motion.
 */
export function ParallaxHero({ src, alt }: ParallaxHeroProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onScroll() {
      if (!imgRef.current) return;
      // Image moves down at 28% of page scroll speed, creating a "slower" parallax.
      imgRef.current.style.transform = `translate3d(0, ${window.scrollY * 0.28}px, 0)`;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      // Oversized so the image still covers the container as it translates down.
      // top: -15% gives headroom; height: 130% covers a 70svh container + parallax travel.
      className="absolute left-0 w-full object-cover will-change-transform"
      style={{ top: "-15%", height: "130%" }}
      fetchPriority="high"
    />
  );
}
