import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PeopleSearch } from "@/components/PeopleSearch";

export const metadata: Metadata = {
  title: "Find people — Garage",
};

export default function PeoplePage() {
  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      <div className="px-5 pt-safe-page-8 pb-6">
        <Link
          href="/profile"
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors mb-5"
        >
          <ArrowLeft size={13} />
          Back
        </Link>
        <h1 className="font-display font-extrabold text-2xl text-ink">Find people</h1>
        <p className="text-ink-muted text-sm mt-1">Discover builders on Garage</p>
      </div>
      <div className="px-5">
        <PeopleSearch />
      </div>
    </div>
  );
}
