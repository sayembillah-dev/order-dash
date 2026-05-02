"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

/**
 * Place inside a `<form>` (descendant is OK). Shows a success toast when a
 * submission finishes (pending → idle). Best-effort: cannot distinguish server errors.
 */
export function FormSubmitToast({ message }: { message: string }) {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      toast.success(message);
    }
    wasPending.current = pending;
  }, [pending, message]);

  return null;
}
