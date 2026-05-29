"use client";

/**
 * Offline fallback. Precached by the service worker and served when a
 * navigation fails with no cached copy of the requested page. Intentionally
 * dependency-free so it renders even with nothing on the network.
 */
export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center bg-[var(--bg)] text-[var(--text)]">
      <span className="inline-block w-4 h-4 rotate-45 bg-[var(--accent-sky)]" />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-semibold">You&rsquo;re offline</h1>
        <p className="max-w-sm text-sm text-[var(--text-muted)]">
          Groundwork can&rsquo;t reach the network right now. Pages you&rsquo;ve already
          opened still work — reconnect to load new ones.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="min-h-[40px] px-4 rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-ink)] font-mono text-sm hover:bg-[color-mix(in_oklab,var(--accent)_28%,transparent)] transition-colors"
      >
        Try again
      </button>
    </main>
  );
}
