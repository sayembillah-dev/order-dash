"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "order-dash-lazy-mode-v1";

type LazyModeContextValue = {
  lazyMode: boolean;
  setLazyMode: (next: boolean) => void;
};

const LazyModeContext = createContext<LazyModeContextValue | null>(null);

export function LazyModeProvider({ children }: { children: React.ReactNode }) {
  const [lazyMode, setLazyModeState] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      queueMicrotask(() => setLazyModeState(v === "1"));
    } catch {
      /* ignore */
    }
  }, []);

  const setLazyMode = useCallback((next: boolean) => {
    setLazyModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ lazyMode, setLazyMode }),
    [lazyMode, setLazyMode]
  );

  return (
    <LazyModeContext.Provider value={value}>{children}</LazyModeContext.Provider>
  );
}

export function useLazyMode(): LazyModeContextValue {
  const ctx = useContext(LazyModeContext);
  if (!ctx) {
    throw new Error("useLazyMode must be used within LazyModeProvider");
  }
  return ctx;
}
