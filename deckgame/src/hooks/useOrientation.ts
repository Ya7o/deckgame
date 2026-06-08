import { useState, useEffect } from "react";

export type Orientation = "portrait" | "landscape";

/**
 * Hook léger de détection d'orientation.
 * Utilise window.matchMedia — fallback "portrait" si absent (SSR / jsdom).
 * S'abonne aux changements dynamiques d'orientation via MediaQueryList.
 */
export function useOrientation(): Orientation {
  const getOrientation = (): Orientation => {
    if (typeof window === "undefined") return "portrait";
    if (typeof window.matchMedia !== "function") return "portrait";
    return window.matchMedia("(orientation: landscape)").matches
      ? "landscape"
      : "portrait";
  };

  const [orientation, setOrientation] = useState<Orientation>(getOrientation);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(orientation: landscape)");
    const handler = (e: MediaQueryListEvent) => {
      setOrientation(e.matches ? "landscape" : "portrait");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return orientation;
}
