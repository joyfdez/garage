import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Plus, Wrench, Gauge, Bookmark, ChevronRight } from "lucide-react";
import { StickyPageHeader } from "@/components/StickyPageHeader";

export const metadata: Metadata = { title: "Add — Garage" };

const ACTIONS = [
  {
    href: "/garage/new",
    icon: Plus,
    label: "Add car to garage",
    sub: "Register a build, daily, or project car",
  },
  {
    href: "/add/car-update",
    icon: Wrench,
    label: "Add car update",
    sub: "Log a fix, mod, photo or sale",
  },
  {
    href: "/add/driven",
    icon: Gauge,
    label: "Add driven car",
    sub: "Mark a model you've driven or owned",
  },
  {
    href: "/add/wishlist",
    icon: Bookmark,
    label: "Add to wishlist",
    sub: "Save a car you want to drive or own",
  },
] as const;

export default async function AddHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      <div className="px-5 pt-safe-page-8 pb-8">
        <StickyPageHeader title="Add">
          <p className="text-[0.6rem] uppercase tracking-[0.2em] font-bold text-hint mt-1.5">
            What are you adding today?
          </p>
        </StickyPageHeader>
      </div>

      <div className="px-5 space-y-3">
        {ACTIONS.map(({ href, icon: Icon, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between px-5 py-5 bg-white border border-ink/8 rounded-card group hover:border-racing-green/25 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-racing-green/8 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-racing-green" />
              </div>
              <div>
                <p className="font-display font-bold text-[1.05rem] text-ink leading-tight">
                  {label}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">{sub}</p>
              </div>
            </div>
            <ChevronRight
              size={15}
              className="text-hint group-hover:text-ink-muted transition-colors shrink-0 ml-3"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
