import { Link } from "react-router-dom";
import { cn } from "../lib/cn.js";

/**
 * Portal wordmark: Parkinsans (the body font), never a paragraph or control,
 * matching the same rule the Consumer and Admin wordmarks follow.
 *
 * The entrance moment lives in the app-level loading screen (see
 * AppLoader.jsx / App.jsx), not here.
 */
export default function Logo({ to = "/", className }) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-center rounded-control py-1.5", className)}
      aria-label="Kirana Connect Store, go to start"
    >
      <span className="inline-block font-sans text-[1.25rem] font-extrabold tracking-tight text-ink sm:text-[1.5rem]">
        Kirana{" "}
        <span className="bg-gradient-to-r from-[#7c3aed] via-[#e93483] to-[#ffd45e] bg-clip-text text-transparent">
          Connect
        </span>{" "}
        <span className="text-primary">Store</span>
      </span>
    </Link>
  );
}
