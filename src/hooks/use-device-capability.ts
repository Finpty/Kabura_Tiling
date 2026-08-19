"use client";

import { useCallback, useSyncExternalStore } from "react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

type Snapshot = {
  ready: boolean;
  allow3d: boolean;
  allowVideo: boolean;
};

export type Capability = Snapshot & { reducedMotion: boolean };

const SERVER_SNAPSHOT: Snapshot = {
  ready: false,
  allow3d: false,
  allowVideo: false,
};

/**
 * Decides whether this device should receive the heavy experience.
 *
 * Deliberately conservative: a low core count, little memory, a coarse pointer,
 * a narrow viewport, a save-data hint or a slow connection all opt the visitor
 * into the lightweight path. Nothing 3D is even imported until this reports
 * `allow3d`.
 *
 * The result is memoised at module scope so the snapshot stays referentially
 * stable between renders — `useSyncExternalStore` requires that — and is
 * invalidated on resize, since viewport width is one of the inputs.
 */
let cache: Snapshot | null = null;

function computeSnapshot(): Snapshot {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const saveData = nav.connection?.saveData === true;
  const slowNetwork = /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 1024;

  const webgl = (() => {
    try {
      const canvas = document.createElement("canvas");
      return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      return false;
    }
  })();

  const capable = cores >= 4 && memory >= 4 && !saveData && !slowNetwork;

  return {
    ready: true,
    allow3d: webgl && capable && !coarse && !narrow,
    allowVideo: !saveData && !slowNetwork,
  };
}

function getSnapshot(): Snapshot {
  cache ??= computeSnapshot();
  return cache;
}

export function useDeviceCapability(): Capability {
  const reducedMotion = usePrefersReducedMotion();

  const subscribe = useCallback((onChange: () => void) => {
    const onResize = () => {
      cache = null;
      onChange();
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SERVER_SNAPSHOT,
  );

  return {
    ...snapshot,
    reducedMotion,
    allow3d: snapshot.allow3d && !reducedMotion,
    allowVideo: snapshot.allowVideo && !reducedMotion,
  };
}
