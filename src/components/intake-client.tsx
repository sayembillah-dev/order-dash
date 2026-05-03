"use client";

import { submitIntakeOrder } from "@/app/actions/orders";
import { IntakeForm } from "@/components/intake-form";
import { Label } from "@/components/ui/label";
import {
  emptyIntakeDraft,
  loadIntakeDraft,
  persistIntakeDraft,
  type IntakeDraft,
} from "@/lib/intake-draft";
import { serializedOrderToIntakeDraft } from "@/lib/order-draft-from-serialized";
import type { SerializedOrder } from "@/lib/serialize-order";
import { useEffect, useState } from "react";

const DEBOUNCE_MS = 450;

function pendingOrderLabel(o: SerializedOrder): string {
  const head =
    o.customerName.trim() ||
    o.orderDetails.trim().slice(0, 48) ||
    "Order";
  let when = "";
  try {
    when = new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(o.createdAt));
  } catch {
    when = "";
  }
  return when ? `${head} · ${when}` : head;
}

export default function IntakeClient({
  workflowOrders,
}: {
  workflowOrders: SerializedOrder[];
}) {
  const [draft, setDraft] = useState<IntakeDraft>(emptyIntakeDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingOrder = editingId
    ? workflowOrders.find((o) => o._id === editingId)
    : undefined;

  useEffect(() => {
    queueMicrotask(() => {
      setDraft(loadIntakeDraft());
    });
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      persistIntakeDraft(draft);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [draft]);

  function onSelectToEdit(value: string) {
    if (value === "") {
      setEditingId(null);
      queueMicrotask(() => setDraft(loadIntakeDraft()));
      return;
    }
    setEditingId(value);
    const o = workflowOrders.find((x) => x._id === value);
    if (o) queueMicrotask(() => setDraft(serializedOrderToIntakeDraft(o)));
  }

  function clearEdit() {
    setEditingId(null);
    queueMicrotask(() => setDraft(loadIntakeDraft()));
  }

  return (
    <div className="space-y-8">
      {workflowOrders.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-border/80 bg-card p-4 shadow-sm sm:p-6">
          <Label htmlFor="intake-edit-order">Edit pending order</Label>
          <select
            id="intake-edit-order"
            className="flex h-11 w-full max-w-xl rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={editingId ?? ""}
            onChange={(e) => onSelectToEdit(e.target.value)}
          >
            <option value="">Create new order only</option>
            {workflowOrders.map((o) => (
              <option key={o._id} value={o._id}>
                {pendingOrderLabel(o)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Choose an order that is not ready to ship yet. Saving updates parcel
            and Pathao queues.
          </p>
        </div>
      ) : null}

      <IntakeForm
        action={submitIntakeOrder}
        draft={draft}
        setDraft={setDraft}
        editingOrderId={editingId}
        editingLazySubmission={Boolean(editingOrder?.lazySubmission)}
        onClearEdit={clearEdit}
      />
    </div>
  );
}
