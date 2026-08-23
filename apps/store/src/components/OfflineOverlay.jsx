import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

function readOffline() {
  return typeof navigator !== "undefined" ? !navigator.onLine : false;
}

export default function OfflineOverlay() {
  const [offline, setOffline] = useState(readOffline);
  const panelRef = useRef(null);
  const plugRef = useRef(null);
  const sparkRef = useRef(null);

  useEffect(() => {
    const update = () => setOffline(readOffline());

    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!offline) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    const context = gsap.context(() => {
      gsap.fromTo(
        panelRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
      );

      gsap.to(plugRef.current, {
        x: -7,
        y: 3,
        rotation: -4,
        transformOrigin: "85% 50%",
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.fromTo(
        sparkRef.current,
        { opacity: 0.1, scale: 0.7 },
        {
          opacity: 1,
          scale: 1.1,
          transformOrigin: "50% 50%",
          duration: 0.55,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
        },
      );
    }, panelRef);

    return () => context.revert();
  }, [offline]);

  const tryAgain = () => {
    if (navigator.onLine) {
      window.location.reload();
      return;
    }

    gsap.fromTo(
      panelRef.current,
      { x: -4 },
      { x: 4, duration: 0.06, repeat: 5, yoyo: true, clearProps: "x" },
    );
  };

  if (!offline) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-canvas/95 p-5 backdrop-blur-sm">
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="offline-title"
        aria-describedby="offline-desc"
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-xl"
      >
        <svg
          viewBox="0 0 220 130"
          className="mx-auto mb-2 h-32 w-52"
          aria-hidden="true"
        >
          {/* ---- plug + cable (animated group) ---- */}
          <g ref={plugRef}>
            {/* cable from the left */}
            <path
              d="M6 84 Q28 84 36 68 T58 58"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="text-ink-faint"
            />
            {/* plug body */}
            <rect
              x="56"
              y="40"
              width="34"
              height="40"
              rx="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-primary"
            />
            {/* top prong */}
            <line
              x1="90"
              y1="52"
              x2="108"
              y2="52"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="text-primary"
            />
            {/* bottom prong */}
            <line
              x1="90"
              y1="68"
              x2="108"
              y2="68"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              className="text-primary"
            />
          </g>

          {/* ---- sparks in the gap ---- */}
          <g
            ref={sparkRef}
            fill="none"
            stroke="var(--color-accent)"
            strokeLinecap="round"
            strokeWidth="4"
          >
            <path d="M114 36 l6 -10" />
            <path d="M116 60 h10" />
            <path d="M114 84 l6 10" />
          </g>

          {/* ---- wall socket (static) ---- */}
          <rect
            x="136"
            y="26"
            width="58"
            height="68"
            rx="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-ink-faint"
          />
          {/* left slot */}
          <line
            x1="156"
            y1="48"
            x2="156"
            y2="60"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-ink-soft"
          />
          {/* right slot */}
          <line
            x1="174"
            y1="48"
            x2="174"
            y2="60"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-ink-soft"
          />
          {/* ground arc */}
          <path
            d="M161 72 a4 4 0 0 0 8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            className="text-ink-soft"
          />
        </svg>

        <h2 id="offline-title" className="text-lg font-bold text-ink">
          ugh! you are offline!
        </h2>
        <p id="offline-desc" className="mt-1.5 text-sm text-ink-muted">
          check your internet connection and try again
        </p>
        <button
          type="button"
          onClick={tryAgain}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-[0.9375rem] font-semibold text-primary-fg transition-colors hover:bg-primary-hover active:scale-[0.97]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
