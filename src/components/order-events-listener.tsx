"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OrderEventsListener() {
  const router = useRouter();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1_000;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      eventSource = new EventSource("/api/orders/events");

      eventSource.onopen = () => {
        reconnectDelay = 1_000;
      };

      eventSource.onmessage = (event) => {
        if (event.data === "refresh") {
          router.refresh();
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        if (!unmounted) {
          reconnectTimeout = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
            connect();
          }, reconnectDelay);
        }
      };
    }

    connect();

    return () => {
      unmounted = true;
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [router]);

  return null;
}
