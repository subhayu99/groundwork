"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ChromeProps {
  breadcrumb?: BreadcrumbItem[];
  difficulty?: "foundation" | "easy" | "medium" | "hard";
  stepCount?: number;
  currentStep?: number;
  /** Show a "Progress" link in the right-side actions. Defaults to true on most pages. */
  showProgressLink?: boolean;
}

export function Chrome({ breadcrumb, difficulty, stepCount, currentStep, showProgressLink }: ChromeProps) {
  // Default: show the progress link only on pages that don't already have a breadcrumb leading there
  const shouldShowProgressLink = showProgressLink ?? !breadcrumb;
  const pathname = usePathname();
  const navLinks: { href: string; label: string }[] = [
    { href: "/learn", label: "learn" },
    { href: "/progress", label: "progress" },
    { href: "/settings", label: "settings" },
  ];
  return (
    <header className="relative z-10 flex items-center justify-between gap-3 px-4 md:px-8 py-4 border-b border-[var(--line-faint)] backdrop-blur-md bg-[color-mix(in_oklab,var(--bg)_80%,transparent)]">
      {/* Skip link — first focusable element, lets keyboard/SR users jump past the
          header straight to the page content (WCAG 2.4.1). */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:border focus:border-[var(--accent-line)] focus:bg-[var(--bg-card)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--accent-ink)]">
        Skip to content
      </a>
      <Link href="/" className="flex items-center gap-2.5 font-mono text-xs tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] leading-tight">
        <span className="inline-block w-2 h-2 rotate-45 bg-[var(--accent-sky)]" />
        <span className="flex flex-col">
          <span>ground</span>
          <span>work</span>
        </span>
      </Link>

      {breadcrumb && (
        <nav className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)] whitespace-nowrap overflow-hidden min-w-0">
          {breadcrumb.map((item, i) => {
            const isLeaf = i === breadcrumb.length - 1;
            return (
              <span key={i} className={`flex items-center gap-2 ${isLeaf ? "min-w-0" : "shrink-0"}`}>
                {i > 0 && <span className="text-[var(--text-faint)]">/</span>}
                {item.href ? (
                  <Link href={item.href} className="hover:text-[var(--text)]">
                    {item.label}
                  </Link>
                ) : (
                  <span className={`${isLeaf ? "text-[var(--text)] truncate max-w-[44vw] md:max-w-none" : ""}`}>
                    {item.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex items-center gap-4">
        {shouldShowProgressLink &&
          navLinks.map(({ href, label }) => {
            const current = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? "page" : undefined}
                className={`font-mono text-[11px] uppercase tracking-wider hover:text-[var(--text)] ${current ? "text-[var(--accent-ink)]" : "text-[var(--text-muted)]"}`}
              >
                {label}
              </Link>
            );
          })}
        {difficulty && (
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border"
            style={{
              color: difficultyColor(difficulty),
              borderColor: `color-mix(in oklab, ${difficultyColor(difficulty)} 50%, transparent)`,
              background: `color-mix(in oklab, ${difficultyColor(difficulty)} 12%, transparent)`,
            }}
          >
            {difficulty === "foundation" ? "Basics" : difficulty}
          </span>
        )}

        {stepCount && currentStep !== undefined && (
          <div
            className="flex items-center gap-1.5"
            role="progressbar"
            aria-label="Lesson progress"
            aria-valuenow={currentStep}
            aria-valuemin={0}
            aria-valuemax={stepCount}
          >
            {Array.from({ length: stepCount }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`block h-0.5 transition-all duration-300 ${
                  i + 1 <= currentStep
                    ? "w-6 bg-[var(--accent)]"
                    : "w-4 bg-[var(--line)]"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

function difficultyColor(d: string): string {
  if (d === "easy") return "var(--diff-easy)";
  if (d === "medium") return "var(--diff-med)";
  if (d === "hard") return "var(--diff-hard)";
  if (d === "foundation") return "var(--accent-sky)";
  return "var(--text-muted)";
}
