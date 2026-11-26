"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const navigationStart = "app:navigation-start";

export function startNavigationProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(navigationStart));
}

export function NavigationProgress() {
  const [progress, setProgress] = useState(0);
  const pending = useRef(false);
  const pathname = usePathname();
  const query = useSearchParams().toString();

  useEffect(() => {
    let tick: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let reset: ReturnType<typeof setTimeout> | undefined;
    let paint: number | undefined;

    function finish() {
      clearInterval(tick);
      clearTimeout(timeout);
      setProgress(100);
      reset = setTimeout(() => {
        pending.current = false;
        setProgress(0);
      }, 180);
    }

    function start() {
      if (pending.current) return;
      clearTimeout(reset);
      pending.current = true;
      setProgress(22);
      tick = setInterval(() => setProgress((value) => Math.min(84, value + (value < 48 ? 9 : 2))), 160);
      timeout = setTimeout(finish, 8000);
    }

    if (pending.current) paint = requestAnimationFrame(finish);

    function matchesRoute(url: URL) {
      return url.pathname === pathname && url.searchParams.toString() === query;
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const target = new URL(anchor.href);
      if (target.origin === window.location.origin && !matchesRoute(target)) start();
    }

    function onPopState() {
      if (!matchesRoute(new URL(window.location.href))) start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener(navigationStart, start);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(navigationStart, start);
      window.removeEventListener("popstate", onPopState);
      clearInterval(tick);
      clearTimeout(timeout);
      clearTimeout(reset);
      if (paint !== undefined) cancelAnimationFrame(paint);
    };
  }, [pathname, query]);

  return <div className={`navigation-progress${progress ? " active" : ""}`} aria-hidden="true">
    <span style={{ transform: `scaleX(${progress / 100})` }} />
  </div>;
}
