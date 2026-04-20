"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/", label: "MIL Range" },
  { href: "/steps", label: "Step Range" },
  { href: "/slingshot-setup", label: "Slingshot Setup" },
];

export function AppMenu() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="z-40 pt-[max(0.15rem,env(safe-area-inset-top))]">
      <div className="app-shell pb-0">
        <div className="field-card flex items-center justify-between gap-3 px-3 py-2 sm:px-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
              Range Tools
            </p>
            <p className="truncate text-sm font-semibold tracking-[0.02em] text-white/90 sm:text-base">
              Slingshot Range Finder
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.035] text-white/80 transition active:bg-white/[0.06]"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              aria-label="Open navigation menu"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>

            {isMenuOpen ? (
              <nav
                className="absolute right-0 top-[calc(100%+0.5rem)] min-w-[11rem] rounded-2xl border border-white/8 bg-[rgba(28,35,31,0.98)] p-1.5 shadow-[var(--shadow)]"
                aria-label="Main menu"
              >
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
                        isActive ? "bg-accent text-[#182015]" : "text-white/76 active:bg-white/[0.06]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
