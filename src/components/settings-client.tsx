"use client";

import { PageRefreshButton } from "@/components/page-refresh-button";
import { SettingsProductStash } from "@/components/settings-product-stash";
import { useLazyMode } from "@/components/lazy-mode-provider";
import { usePathaoApi } from "@/components/pathao-api-provider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SettingsClient() {
  const { lazyMode, setLazyMode } = useLazyMode();
  const { pathaoApiEnabled, setPathaoApiEnabled } = usePathaoApi();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <PageRefreshButton />
      </div>

      <section className="rounded-xl border border-border/80 bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold tracking-tight">Lazy mode</h2>
            <p className="text-sm text-muted-foreground">
              When on, order intake only asks for order description, note, and
              photos — and queues, archive, and copy use the same simplified
              layout across this device.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:pt-0.5">
            <Label
              htmlFor="lazy-mode-toggle"
              className="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              {lazyMode ? "On" : "Off"}
            </Label>
            <button
              id="lazy-mode-toggle"
              type="button"
              role="switch"
              aria-checked={lazyMode}
              onClick={() => setLazyMode(!lazyMode)}
              className={cn(
                "relative inline-flex h-9 w-[3.25rem] shrink-0 touch-manipulation rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                lazyMode
                  ? "border-primary bg-primary"
                  : "border-input bg-muted",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block size-8 rounded-full bg-background shadow-sm ring-1 ring-border transition-transform",
                  lazyMode ? "translate-x-[1.35rem]" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/80 bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold tracking-tight">
              Enable Pathao API
            </h2>
            <p className="text-sm text-muted-foreground">
              When on, Pathao entry uses the merchant API and the confirm button
              sends the order to Pathao. Configure{" "}
              <span className="font-mono text-xs">PATHAO_*</span> variables in
              your server environment (client id, secret, store id, and merchant
              login for tokens).
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:pt-0.5">
            <Label
              htmlFor="pathao-api-toggle"
              className="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              {pathaoApiEnabled ? "On" : "Off"}
            </Label>
            <button
              id="pathao-api-toggle"
              type="button"
              role="switch"
              aria-checked={pathaoApiEnabled}
              onClick={() => setPathaoApiEnabled(!pathaoApiEnabled)}
              className={cn(
                "relative inline-flex h-9 w-[3.25rem] shrink-0 touch-manipulation rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathaoApiEnabled
                  ? "border-primary bg-primary"
                  : "border-input bg-muted",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block size-8 rounded-full bg-background shadow-sm ring-1 ring-border transition-transform",
                  pathaoApiEnabled
                    ? "translate-x-[1.35rem]"
                    : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        </div>
      </section>

      <SettingsProductStash />
    </div>
  );
}
