"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function PageRefreshButton({ label = "Refresh" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-9 shrink-0 touch-manipulation gap-1.5"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      aria-busy={pending}
    >
      <RefreshCw
        className={cn("size-4 shrink-0", pending && "animate-spin")}
        aria-hidden
      />
      {label}
    </Button>
  );
}
