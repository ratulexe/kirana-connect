import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "./motionPreferences.js";

const REVEAL_TIMEOUT_MS = 2500;

/**
 * Fades a section in the first time it becomes visible, then stops observing.
 *
 * Written as progressive enhancement, because hiding content with JavaScript is
 * only safe if it is guaranteed to come back:
 *
 *   - content is visible by default and is only hidden once we know an
 *     observer is available to reveal it again,
 *   - anything already on screen is never hidden, so above-the-fold content
 *     cannot flash or disappear,
 *   - a timeout reveals the section regardless, so a callback that never fires
 *     degrades to "no animation" rather than "invisible page".
 *
 * IntersectionObserver is used rather than GSAP ScrollTrigger so animation
 * progress is never tied to scroll position.
 */
export function useRevealOnScroll() {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    // A hidden tab freezes requestAnimationFrame, which is what drives GSAP, so
    // anything hidden now could not be tweened back. Skip the effect entirely
    // when the page is loaded in the background.
    if (document.visibilityState === "hidden") return undefined;

    // Already in view: leave it alone entirely.
    if (element.getBoundingClientRect().top < window.innerHeight) return undefined;

    gsap.set(element, { opacity: 0, y: 18 });

    let settled = false;
    let observer;
    let safetyTimer;

    const reveal = ({ animate = true } = {}) => {
      if (settled) return;
      settled = true;
      observer?.disconnect();
      clearTimeout(safetyTimer);

      if (animate) {
        gsap.to(element, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
      } else {
        // gsap.set applies immediately and does not need a frame, so the
        // fallback works even where a tween never would.
        gsap.set(element, { opacity: 1, y: 0 });
      }
    };

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    observer.observe(element);

    // Last resort: show the content outright rather than risk it staying hidden.
    safetyTimer = setTimeout(() => reveal({ animate: false }), REVEAL_TIMEOUT_MS);

    return () => {
      observer.disconnect();
      clearTimeout(safetyTimer);
      gsap.set(element, { clearProps: "opacity,transform" });
    };
  }, []);

  return elementRef;
}
