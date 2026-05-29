"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (production only — a SW in `next dev` would
 * fight HMR). The SW file and its scope are under the deploy's base path
 * (`/groundwork/` on Pages, `/` locally), read from NEXT_PUBLIC_BASE_PATH.
 *
 * Renders nothing.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const swUrl = `${bp}/sw.js`;
    const scope = `${bp}/`;

    navigator.serviceWorker.register(swUrl, { scope }).catch(() => {
      /* offline support is a progressive enhancement — ignore failures */
    });
  }, []);

  return null;
}
