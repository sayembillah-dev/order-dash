"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group border bg-popover text-popover-foreground shadow-lg group-[.toaster]:border-border",
        },
      }}
    />
  );
}
