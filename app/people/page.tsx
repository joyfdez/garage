import type { Metadata } from "next";
import { PeopleSearch } from "@/components/PeopleSearch";
import { StickyPageHeader } from "@/components/StickyPageHeader";

export const metadata: Metadata = {
  title: "Find people — Garage",
};

export default function PeoplePage() {
  return (
    <div className="bg-paper min-h-dvh pb-24 page-enter">
      <div className="px-5 pt-safe-page-8 pb-6">
        <StickyPageHeader title="Find people" back={{ href: "/profile", label: "Back" }}>
          <p className="text-ink-muted text-sm mt-1">Discover builders on Garage</p>
        </StickyPageHeader>
      </div>
      <div className="px-5">
        <PeopleSearch />
      </div>
    </div>
  );
}
