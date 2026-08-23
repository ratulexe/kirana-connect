/**
 * True when the visitor has asked their OS to reduce motion.
 *
 * Every GSAP helper checks this before building a timeline, so reduced-motion
 * users get the finished layout immediately rather than a faster animation.
 */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
