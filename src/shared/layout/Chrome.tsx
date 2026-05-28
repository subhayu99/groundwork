"use client";

import Link from "next/link";

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
  return (
    <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-[var(--line-faint)] backdrop-blur-md bg-[color-mix(in_oklab,var(--bg)_80%,transparent)]">
      <Link href="/" className="flex items-center gap-2.5 font-mono text-xs tracking-wider text-[var(--text-muted)] hover:text-[var(--text)] leading-tight">
        <span className="inline-block w-2 h-2 rotate-45 bg-[var(--accent-sky)]" />
        <span className="flex flex-col">
          <span>ground</span>
          <span>work</span>
        </span>
      </Link>

      {breadcrumb && (
        <nav className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)] whitespace-nowrap overflow-hidden">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-[var(--text-faint)]">/</span>}
              {item.href ? (
                <Link href={item.href} className="hover:text-[var(--text)]">
                  {item.label}
                </Link>
              ) : (
                <span className={i === breadcrumb.length - 1 ? "text-[var(--text)]" : ""}>
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-4">
        {shouldShowProgressLink && (
          <Link
            href="/progress"
            className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            progress
          </Link>
        )}
        {difficulty && (
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border"
            style={{
              color: difficultyColor(difficulty),
              borderColor: `color-mix(in oklab, ${difficultyColor(difficulty)} 50%, transparent)`,
              background: `color-mix(in oklab, ${difficultyColor(difficulty)} 12%, transparent)`,
            }}
          >
            {difficulty}
          </span>
        )}

        {stepCount && currentStep !== undefined && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: stepCount }, (_, i) => (
              <span
                key={i}
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
  return "var(--text-muted)";
}
