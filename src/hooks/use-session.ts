"use client";

import { useCallback, useEffect, useState } from "react";

import { hasSession } from "@/lib/session";

export function useSession() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const refresh = useCallback(() => {
    setIsAuthenticated(hasSession());
  }, []);

  useEffect(() => {
    refresh();
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "ledgerly_session") {
        refresh();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refresh]);

  return { isAuthenticated, refresh };
}
