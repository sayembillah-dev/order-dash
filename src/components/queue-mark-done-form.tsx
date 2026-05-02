"use client";

import {
  completeParcelCreation,
  completePathaoEntry,
} from "@/app/actions/orders";
import { FormSubmitToast } from "@/components/form-submit-toast";
import { Button } from "@/components/ui/button";

export function QueueMarkDoneForm({
  variant,
  orderId,
  label,
}: {
  variant: "parcel" | "entry";
  orderId: string;
  label: string;
}) {
  const action =
    variant === "parcel" ? completeParcelCreation : completePathaoEntry;
  const toastMessage =
    variant === "parcel"
      ? "Marked parcel step complete"
      : "Marked Pathao entry complete";

  return (
    <form action={action} className="w-full" suppressHydrationWarning>
      <FormSubmitToast message={toastMessage} />
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
