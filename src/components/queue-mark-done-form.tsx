"use client";

import {
  completeParcelCreation,
} from "@/app/actions/orders";
import {
  submitPathaoQueueCompletion,
  type PathaoQueueState,
} from "@/app/actions/pathao";
import { FormSubmitToast } from "@/components/form-submit-toast";
import { usePathaoApi } from "@/components/pathao-api-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export function QueueMarkDoneForm({
  variant,
  orderId,
  label,
}: {
  variant: "parcel" | "entry";
  orderId: string;
  label: string;
}) {
  const { pathaoApiEnabled } = usePathaoApi();

  const [entryState, entryAction, entryPending] = useActionState(
    submitPathaoQueueCompletion,
    {} as PathaoQueueState,
  );

  useEffect(() => {
    if (variant !== "entry") return;
    if (entryState?.error) toast.error(entryState.error);
  }, [variant, entryState?.error]);

  useEffect(() => {
    if (variant !== "entry") return;
    if (entryState?.submittedAt == null) return;

    if (entryState.mode === "manual") {
      toast.success("Marked Pathao entry complete");
      return;
    }

    if (entryState.mode === "api") {
      const parts: string[] = ["Sent to Pathao"];
      if (entryState.consignmentId) {
        parts.push(`Consignment ${entryState.consignmentId}`);
      }
      if (entryState.deliveryFee != null) {
        parts.push(`Delivery fee ${entryState.deliveryFee}`);
      }
      toast.success(parts.join(" · "));
    }
  }, [
    variant,
    entryState?.submittedAt,
    entryState?.mode,
    entryState?.consignmentId,
    entryState?.deliveryFee,
  ]);

  if (variant === "parcel") {
    return (
      <form action={completeParcelCreation} className="w-full" suppressHydrationWarning>
        <FormSubmitToast message="Marked parcel step complete" />
        <input type="hidden" name="orderId" value={orderId} />
        <Button
          type="submit"
          className="min-h-11 w-full touch-manipulation sm:w-auto"
          size="lg"
        >
          {label}
        </Button>
      </form>
    );
  }

  return (
    <form action={entryAction} className="w-full" suppressHydrationWarning>
      <input type="hidden" name="orderId" value={orderId} />
      <input
        type="hidden"
        name="usePathaoApi"
        value={pathaoApiEnabled ? "1" : "0"}
      />
      <Button
        type="submit"
        disabled={entryPending}
        className={cn(
          "min-h-11 w-full touch-manipulation gap-2 sm:w-auto",
          pathaoApiEnabled &&
            "border-transparent bg-destructive text-white hover:bg-destructive/90 focus-visible:border-destructive focus-visible:ring-destructive/30 dark:bg-destructive dark:text-white dark:hover:bg-destructive/90",
        )}
        size="lg"
      >
        {entryPending ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : null}
        {label}
      </Button>
    </form>
  );
}
