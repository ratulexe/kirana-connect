import { useEffect, useRef, useState } from 'react';

export default function AnimatedCounter({ to, from = 0, duration = 1800, suffix = '', prefix = '', className = '' }) {
  const [count, setCount] = useState(from);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);

    // A tab that never delivers an intersection callback (backgrounded on
    // load, etc.) still ends up showing the real number rather than being
    // stuck at `from` forever.
    const safetyTimer = setTimeout(() => setIsVisible(true), 2500);

    return () => {
      observer.disconnect();
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    // Runs again whenever `to` changes -- in particular the first time real
    // data replaces the 0 the counter renders while a query is still
    // loading, so a section already on screen before the fetch resolves does
    // not freeze at 0 forever.
    if (!isVisible) return undefined;

    let frame;
    const start = performance.now();
    const range = to - from;
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + range * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `from` intentionally excluded: it is the animation's static start value, not a retrigger condition.
  }, [to, isVisible, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
