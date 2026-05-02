"use client";

import { useCallback, useEffect, useState } from "react";
import { createOrder } from "@/app/actions/orders";
import { IntakeForm } from "@/components/intake-form";
import {
  clearIntakeDraftStorage,
  emptyIntakeDraft,
  loadIntakeDraft,
  persistIntakeDraft,
  type IntakeDraft,
} from "@/lib/intake-draft";

const DEBOUNCE_MS = 450;

export default function IntakeClient() {
  /** Empty on server + first client paint — avoids hydration mismatch; restored in useEffect. */
  const [draft, setDraft] = useState<IntakeDraft>(emptyIntakeDraft);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    // Async microtask avoids synchronous setState-in-effect lint; load runs once after paint.
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

  const handleContinue = useCallback(() => {
    clearIntakeDraftStorage();
    setDraft(emptyIntakeDraft());
    setFormKey((k) => k + 1);
  }, []);

  return (
    <IntakeForm
      key={formKey}
      action={createOrder}
      draft={draft}
      setDraft={setDraft}
      onContinue={handleContinue}
    />
  );
}
