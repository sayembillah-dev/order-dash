"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function ArchiveSearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search by name or last 4 digits"
      aria-label="Search orders"
    />
  );
}
