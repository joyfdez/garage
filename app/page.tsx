import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ScrollReveal } from "@/components/ScrollReveal";

// ── Value props copy ──────────────────────────────────────────────────────────

const VALUE_PROPS = [
  {
    label: "Document everything",
    copy: "Every build, every fix, every part swap. The full story of your car, in one place.",
  },
  {
    label: "One link",
    copy: "Share your build anywhere — Discord, Reddit, group chats. No app to download, no account to view.",
  },
  {
    label: "It outlives you",
    copy: "Ownership history that stays with the car, not the owner. The car is the thread.",
  },
] as const;

// ── CTA buttons — two variants, same copy ────────────────────────────────────

// Hero variant: paper bg so it reads against any dark photo
function HeroCtaButton() {
  return (
    <Link
      href="/garage/new"
      className="inline-flex items-center gap-2 bg-paper text-ink font-display font-bold px-6 py-3.5 rounded-input text-sm hover:bg-white transition-colors"
    >
      Add your first car
    </Link>
  );
}

// Section variant: ink bg, fine on the light paper background
function SectionCtaButton() {
  return (
    <Link
      href="/garage/new"
      className="inline-flex items-center gap-2 bg-ink text-paper font-display font-bold px-6 py-3.5 rounded-input text-sm hover:bg-ink/85 transition-colors"
    >
      Add your first car
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  // Logged-in users skip the landing page entirely
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/garage");

  return (
    <div className="bg-paper page-enter">

      {/* ── HERO ── full-bleed, full-viewport ──────────────────────────────── */}
      <section
        className="relative flex flex-col justify-end overflow-hidden"
        style={{
          height: "100svh",
          minHeight: "520px",
          // Racing-green is the fallback colour when the photo hasn't loaded or
          // the file isn't present yet. Swap /landing-hero.jpg at any time.
          backgroundColor: "#1A3A2E",
          backgroundImage: "url('/landing-hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
      >
        {/* Dark gradient scrim — keeps photo visible but makes text legible */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(14,13,10,0.08) 0%, rgba(14,13,10,0.28) 45%, rgba(14,13,10,0.74) 100%)",
          }}
        />

        {/* Hero content — bottom-aligned, fades-and-rises on load */}
        <div
          className="relative z-10 px-5 space-y-5 fade-rise"
          style={{ "--rise-delay": "150ms" } as React.CSSProperties}
        >
          {/* Headline — Archivo extrabold, fills width, 2-3 lines */}
          <h1
            className="font-display font-extrabold text-white tracking-tight leading-[0.92]"
            style={{
              fontSize: "clamp(2.8rem, 10.5vw, 5.5rem)",
              textShadow: "0 2px 24px rgba(0,0,0,0.45)",
            }}
          >
            The home for people who build cars.
          </h1>

          {/* Sub-line — magazine-metadata style */}
          <p
            className="text-white/70 text-[0.62rem] uppercase tracking-[0.22em] font-bold"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.55)" }}
          >
            Add your car&nbsp;&middot;&nbsp;Track its life&nbsp;&middot;&nbsp;Share the journey
          </p>

          {/* Primary CTA — paper bg so it pops against any part of the photo */}
          <div className="pt-3 pb-10">
            <HeroCtaButton />
          </div>
        </div>

        {/* Scroll cue — fade in on load (outer), then loop-float (inner) */}
        <div
          aria-hidden="true"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 fade-rise"
          style={{ "--rise-delay": "700ms" } as React.CSSProperties}
        >
          <div className="scroll-cue-inner text-white/35">
            <ChevronDown size={20} strokeWidth={1.5} />
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ── scroll-reveal stagger ───────────────────────────── */}
      <section className="px-5 py-16 md:py-24 max-w-xl mx-auto">

        <div className="divide-y divide-ink/8">
          {VALUE_PROPS.map((vp, i) => (
            <ScrollReveal key={vp.label} delay={i * 110}>
              <div className="py-9">
                <p className="text-[0.6rem] uppercase tracking-[0.22em] font-bold text-hint mb-2.5">
                  {vp.label}
                </p>
                <p className="font-display font-semibold text-[1.25rem] leading-snug text-ink">
                  {vp.copy}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Second CTA */}
        <ScrollReveal delay={380}>
          <div className="mt-12 pb-4">
            <SectionCtaButton />
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
