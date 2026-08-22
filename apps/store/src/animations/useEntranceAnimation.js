import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "./motionPreferences.js";

/**
 * Short staggered entrance for elements marked with data-animate.
 *
 * Content is never left depending on the animation finishing. Reduced motion
 * and hidden tabs both skip straight to the final state, and a hidden tab
 * matters because it freezes requestAnimationFrame, which is what drives GSAP:
 * a tween started there would never complete and the form would stay invisible.
 *
 * `key` re-runs the entrance when the wizard moves to another step.
 */
export function useEntranceAnimation(key) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const targets = container.querySelectorAll("[data-animate]");
    if (targets.length === 0) return undefined;

    if (prefersReducedMotion() || document.visibilityState === "hidden") {
      gsap.set(targets, { clearProps: "all" });
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.05 },
      );
    }, container);

    return () => context.revert();
  }, [key]);

  return containerRef;
}
