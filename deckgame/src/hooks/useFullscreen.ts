import { useState, useEffect, useCallback } from "react";

/**
 * Hook de gestion du plein écran.
 * Supporte les API standard et WebKit (iOS Safari).
 * Retourne :
 *   isSupported  — true si le plein écran est disponible sur cet appareil
 *   isFullscreen — true si l'app est actuellement en plein écran
 *   toggleFullscreen — demande ou quitte le plein écran (doit être appelé depuis un geste utilisateur)
 */

type AnyDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type AnyElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};

function docAny(): AnyDocument { return document as AnyDocument; }
function elAny(el: HTMLElement): AnyElement { return el as AnyElement; }

function getIsFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const d = docAny();
  return !!(d.fullscreenElement ?? d.webkitFullscreenElement);
}

export function useFullscreen() {
  const isSupported: boolean = (() => {
    if (typeof document === "undefined") return false;
    const d = docAny();
    return !!(
      d.fullscreenEnabled ||
      (d as unknown as Record<string, unknown>).webkitFullscreenEnabled
    );
  })();

  const [isFullscreen, setIsFullscreen] = useState<boolean>(getIsFullscreen);

  useEffect(() => {
    const handler = () => setIsFullscreen(getIsFullscreen());
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!isSupported) return;
    try {
      const el = elAny(document.documentElement);
      if (!getIsFullscreen()) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      } else {
        const d = docAny();
        if (d.exitFullscreen) await d.exitFullscreen();
        else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
      }
    } catch {
      // Plein écran refusé ou non disponible (ex : frame sans permission)
    }
  }, [isSupported]);

  return { isFullscreen, isSupported, toggleFullscreen };
}
