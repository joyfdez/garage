"use client";

import { useEffect, useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Extra delay on top of the IntersectionObserver trigger, in ms */
  delay?: number;
}

/**
 * Wraps its children in a div that fades-and-rises into view when it first
 * enters the viewport. Uses IntersectionObserver + JS transitions so the
 * initial HTML from SSR renders visibly (no flash of hidden content), and
 * the motion is skipped entirely when prefers-reduced-motion is set.
 */
export function ScrollReveal({ children, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip all motion if the user asked for it
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Set the initial hidden state right before we start observing, so SSR
    // renders content visible and JS hides it only after hydration.
    el.style.opacity = "0";
    el.style.transform = "translateY(18px)";
    el.style.transition = `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return <div ref={ref}>{children}</div>;
}
