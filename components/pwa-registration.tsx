"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => {
          // Silent failure keeps local development usable even if cleanup is blocked.
        });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent failure keeps the app usable even if registration is blocked.
    });
  }, []);

  return null;
}
