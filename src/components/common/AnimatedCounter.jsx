import { useEffect, useRef, useState } from 'react';

export default function AnimatedCounter({ to, from = 0, duration = 1800, suffix = '', prefix = '', className = '' }) {
  const [count, setCount] = useState(from);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const range = to - from;
        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(from + range * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    const el = ref.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [to, from, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
