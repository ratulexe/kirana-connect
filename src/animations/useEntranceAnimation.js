import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "./motionPreferences.js";

/**
 * One short staggered fade-and-rise for a container's direct children.
 *
 * Used only for the hero. Elements are marked with data-animate so the
 * animation targets an explicit opt-in list rather than whatever markup
 * happens to be nested inside.
 */
export function useEntranceAnimation({ enabled = true } = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return undefined;

    const targets = container.querySelectorAll("[data-animate]");
    if (targets.length === 0) return undefined;

    // Reduced motion, or a background tab where requestAnimationFrame is frozen
    // and a tween could never finish: show the finished layout immediately.
    if (prefersReducedMotion() || document.visibilityState === "hidden") {
      gsap.set(targets, { clearProps: "all" });
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power2.out",
          stagger: 0.07,
        },
      );
    }, container);

    return () => context.revert();
  }, [enabled]);

  return containerRef;
}
