"use client";

import { Tier } from "@/shared/derivation/types";

interface AccessGateProps {
  tier: Tier;
  children: React.ReactNode;
}

/**
 * Today: passthrough. Tomorrow: checks user subscription against tier.
 * Wrap any premium content in this so the gating point is consistent.
 */
export function AccessGate({ children }: AccessGateProps) {
  return <>{children}</>;
}
