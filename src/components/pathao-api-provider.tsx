"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "order-dash-pathao-api-v1";

type PathaoApiContextValue = {
  pathaoApiEnabled: boolean;
  setPathaoApiEnabled: (next: boolean) => void;
};

const PathaoApiContext = createContext<PathaoApiContextValue | null>(null);

export function PathaoApiProvider({ children }: { children: React.ReactNode }) {
  const [pathaoApiEnabled, setPathaoApiEnabledState] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      queueMicrotask(() => setPathaoApiEnabledState(v === "1"));
    } catch {
      /* ignore */
    }
  }, []);

  const setPathaoApiEnabled = useCallback((next: boolean) => {
    setPathaoApiEnabledState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ pathaoApiEnabled, setPathaoApiEnabled }),
    [pathaoApiEnabled, setPathaoApiEnabled],
  );

  return (
    <PathaoApiContext.Provider value={value}>
      {children}
    </PathaoApiContext.Provider>
  );
}

export function usePathaoApi(): PathaoApiContextValue {
  const ctx = useContext(PathaoApiContext);
  if (!ctx) {
    throw new Error("usePathaoApi must be used within PathaoApiProvider");
  }
  return ctx;
}
