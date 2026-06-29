"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isFormDirty } from "@/lib/hooks/useFormGuard";
import { PlusCircle, Compass, User } from "lucide-react";

const nav = [
  { href: "/add",     label: "Add",     icon: PlusCircle },
  { href: "/explore", label: "Explore", icon: Compass    },
  { href: "/profile", label: "Profile", icon: User       },
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
  // Add: hub and its sub-routes (/add/car-update, /add/driven, /add/wishlist)
  if (href === "/add") return pathname === "/add" || pathname.startsWith("/add/");
  // Profile: covers /profile, /u/*, /settings
  if (href === "/profile") return isProfileActive(pathname);
  // Others: exact or sub-path
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

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
                onClick={(e) => {
                  if (!active && isFormDirty()) {
                    e.preventDefault();
                    if (confirm("Discard unsaved changes? Your changes will be lost.")) {
                      router.push(href);
                    }
                  }
                }}
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
