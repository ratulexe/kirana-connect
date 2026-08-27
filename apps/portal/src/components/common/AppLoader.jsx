/**
 * Loading screen shared by the Gateway (no extra line) and the Entrepreneur
 * experience (extraLine="Business"): "Kirana" then "Connect" fade up on
 * their own lines, a progress bar underneath that fills once from empty to
 * full. Plain CSS animation, not GSAP -- see the keyframes in index.css for
 * why.
 *
 * The bar's own completion is the loading signal: `onAnimationEnd` (which
 * bubbles up from the ::before pseudo-element that actually animates, onto
 * this real element) fires `onDone` once the fill reaches 100% -- there is
 * no separate timer to keep in sync with it. That also means reduced-motion
 * is handled for free: the app's own global rule collapses every
 * animation-duration to near-zero for those visitors, so the fill completes
 * (and `onDone` fires) almost immediately instead of needing its own
 * shortened duration constant.
 */
export default function AppLoader({ onDone, extraLine }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-7 bg-canvas" role="status">
      <p className="text-center font-sans text-[2.25rem] font-extrabold leading-tight tracking-tight sm:text-[2.75rem]">
        <span className="kc-loader-word block text-ink" style={{ animationDelay: "0ms" }}>
          Kirana
        </span>
        <span
          className="kc-loader-word block bg-gradient-to-r from-[#7c3aed] via-[#e93483] to-[#ffd45e] bg-clip-text text-transparent"
          style={{ animationDelay: "180ms" }}
        >
          Connect
        </span>
        {extraLine ? (
          <span className="kc-loader-word block text-primary" style={{ animationDelay: "340ms" }}>
            {extraLine}
          </span>
        ) : null}
      </p>
      <div className="kc-loader-track" aria-hidden="true" onAnimationEnd={onDone} />
      <span className="sr-only">Loading Kirana Connect{extraLine ? ` ${extraLine}` : ""}</span>
    </div>
  );
}
