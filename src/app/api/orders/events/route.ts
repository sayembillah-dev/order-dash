import { type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import {
  subscribeToOrderChanges,
  unsubscribeFromOrderChanges,
} from "@/lib/change-stream";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.sub) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = crypto.randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode("data: connected\n\n"));

      subscribeToOrderChanges(clientId, () => {
        try {
          controller.enqueue(encoder.encode("data: refresh\n\n"));
        } catch {
          // Stream already closed
        }
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribeFromOrderChanges(clientId);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
