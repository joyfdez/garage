"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, PlusCircle, User } from "lucide-react";

const nav = [
  { href: "/garage", label: "Garage", icon: Car },
  { href: "/garage/new", label: "Add", icon: PlusCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background border-t border-card">
      <ul className="flex h-16 items-stretch">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center h-full gap-0.5 text-2xs font-medium transition-colors ${
                  active ? "text-orange" : "text-ink/40"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2 : 1.5}
                  className={active ? "text-orange" : ""}
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
