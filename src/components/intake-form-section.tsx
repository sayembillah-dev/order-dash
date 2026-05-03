"use client";

import IntakeClient from "@/components/intake-client";
import type { SerializedOrder } from "@/lib/serialize-order";

/**
 * Client boundary for the intake form. Loaded synchronously with the page bundle
 * so mobile browsers never get stuck on a lazy‑loaded chunk that never resolves.
 */
export function IntakeFormSection({
  workflowOrders,
}: {
  workflowOrders: SerializedOrder[];
}) {
  return <IntakeClient workflowOrders={workflowOrders} />;
}
