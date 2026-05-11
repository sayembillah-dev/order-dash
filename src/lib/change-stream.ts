import mongoose from "mongoose";
import { connectDB } from "./mongodb";
import { Order } from "./models/Order";

type Subscriber = () => void;

interface ChangeStreamState {
  initialized: boolean;
  stream: mongoose.mongo.ChangeStream | null;
  subscribers: Map<string, Subscriber>;
}

declare global {
  var orderChangeStreamState: ChangeStreamState | undefined;
}

const state: ChangeStreamState = global.orderChangeStreamState ?? {
  initialized: false,
  stream: null,
  subscribers: new Map(),
};

if (process.env.NODE_ENV !== "production") {
  global.orderChangeStreamState = state;
}

async function initChangeStream() {
  if (state.initialized) return;
  state.initialized = true;

  try {
    await connectDB();
    state.stream = Order.watch([], { fullDocument: "updateLookup" });

    state.stream.on("change", () => {
      state.subscribers.forEach((cb) => cb());
    });

    state.stream.on("error", () => {
      state.initialized = false;
      state.stream = null;
      setTimeout(initChangeStream, 5000);
    });

    state.stream.on("close", () => {
      state.initialized = false;
      state.stream = null;
      setTimeout(initChangeStream, 5000);
    });
  } catch {
    state.initialized = false;
    state.stream = null;
    setTimeout(initChangeStream, 5000);
  }
}

export function subscribeToOrderChanges(id: string, cb: Subscriber): void {
  state.subscribers.set(id, cb);
  void initChangeStream();
}

export function unsubscribeFromOrderChanges(id: string): void {
  state.subscribers.delete(id);
}
