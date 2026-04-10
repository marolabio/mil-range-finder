"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/", label: "Calculator" },
  { href: "/guide", label: "Guide" },
];

export function AppMenu() {
  const pathname = usePathname();

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
      <div className="app-shell">
        <nav className="field-card flex items-center gap-2 rounded-2xl p-2" aria-label="Main menu">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-accent text-[#182015]" : "text-white/74"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
