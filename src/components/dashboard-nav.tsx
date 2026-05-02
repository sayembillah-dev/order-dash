"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

const links = [
  { href: "/intake", label: "Order intake" },
  { href: "/parcel", label: "Parcel creation" },
  { href: "/entry", label: "Pathao entry" },
  { href: "/archive", label: "Archive" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 pt-safe-t backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-safe-x sm:gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "min-h-11 min-w-11 shrink-0 touch-manipulation md:hidden"
            )}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" aria-hidden />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-[min(100vw-1rem,20rem)] flex-col gap-0 p-0 pb-safe-b pt-safe-t sm:max-w-sm"
          >
            <SheetHeader className="border-b px-4 py-4 text-left">
              <SheetTitle className="text-left">Go to</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Primary">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    buttonVariants({
                      variant: pathname === href ? "default" : "ghost",
                      size: "lg",
                    }),
                    "min-h-11 w-full touch-manipulation justify-start text-base"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <SheetFooter className="border-t bg-muted/30">
              <form
                action={logoutAction}
                className="w-full"
                suppressHydrationWarning
              >
                <Button
                  type="submit"
                  variant="outline"
                  className="min-h-11 w-full touch-manipulation"
                >
                  Log out
                </Button>
              </form>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Link
          href="/intake"
          className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight sm:text-sm md:flex-none"
        >
          Order Dash
        </Link>

        <nav
          className="hidden flex-1 flex-wrap items-center justify-center gap-1 md:flex lg:gap-2"
          aria-label="Primary"
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                buttonVariants({
                  variant: pathname === href ? "default" : "ghost",
                  size: "sm",
                }),
                "h-8 touch-manipulation"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <form
          action={logoutAction}
          className="hidden shrink-0 md:block"
          suppressHydrationWarning
        >
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-9 touch-manipulation"
          >
            Log out
          </Button>
        </form>
      </div>
    </header>
  );
}
