"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, Compass, User } from "lucide-react";

const nav = [
  { href: "/garage/new", label: "Add",     icon: PlusCircle },
  { href: "/explore",    label: "Explore", icon: Compass    },
  { href: "/profile",    label: "Profile", icon: User       },
] as const;

const HIDDEN_PREFIXES = ["/auth", "/onboarding"];

function isProfileActive(pathname: string) {
  return (
    pathname === "/profile" ||
    pathname.startsWith("/u/") ||
    pathname === "/settings"
  );
}

function isNavActive(href: string, pathname: string): boolean {
  // Add: exact match only — avoid lighting up on /car/.../events/new etc.
  if (href === "/garage/new") return pathname === "/garage/new";
  // Profile: covers /profile, /u/*, /settings
  if (href === "/profile") return isProfileActive(pathname);
  // Others: exact or sub-path
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();

  if (
    pathname === "/" ||
    HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-paper border-t border-ink/8"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex h-16 items-stretch">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                prefetch={true}
                className={`flex flex-col items-center justify-center h-full gap-0.5 text-2xs font-medium transition-colors ${
                  active ? "text-green-bright" : "text-ink/35"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2 : 1.5}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
