/**
 * Circle-draws then check-draws then one small settle pulse, ~700ms total.
 * Plain CSS keyframes (kc-tick-circle/-check/-pulse, defined in index.css)
 * rather than GSAP or a particle library -- restrained on purpose, and it
 * means the existing global prefers-reduced-motion rule (which zeroes every
 * animation-duration for `*`) already covers this with no extra handling:
 * a reduced-motion viewer just sees the finished mark immediately.
 */
export default function SuccessTick({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block motion-safe:animate-[kc-tick-pulse_250ms_ease-out_650ms_1] ${className}`}
    >
      <svg viewBox="0 0 100 100" className="size-20">
        <circle
          cx="50"
          cy="50"
          r="45"
          className="fill-none stroke-success"
          strokeWidth="6"
          style={{
            strokeDasharray: 283,
            strokeDashoffset: 283,
            animation: "kc-tick-circle 450ms ease-out forwards",
          }}
        />
        <path
          d="M28 52 L44 68 L74 34"
          className="fill-none stroke-success"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 60,
            strokeDashoffset: 60,
            animation: "kc-tick-check 300ms 300ms ease-out forwards",
          }}
        />
      </svg>
    </span>
  );
}
