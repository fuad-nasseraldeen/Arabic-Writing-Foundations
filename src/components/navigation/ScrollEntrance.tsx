"use client";

import { useEffect } from "react";

export function ScrollEntrance() {
  useEffect(() => {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.classList.add("scroll-enter");
        observer.unobserve(target);
      }
    });
    document.querySelectorAll("[data-scroll-enter]").forEach((section) => {
      if (section.getBoundingClientRect().top >= window.innerHeight) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
