import { Link } from "react-router-dom";
import { cn } from "../lib/cn.js";

/**
 * Portal wordmark: Birthstone carries the brand name only ("Kirana Connect
 * Store"), never a paragraph or control -- expressive but still legible at
 * this size, matching the same rule the Consumer and Admin wordmarks follow.
 */
export default function Logo({ to = "/", className }) {
  return (
    <Link
      to={to}
      className={cn("group inline-flex items-center rounded-control py-1.5", className)}
      aria-label="Kirana Connect Store, go to start"
    >
      <span className="relative font-brand text-[1.75rem] leading-none font-normal text-ink sm:text-[2rem]">
        Kirana Connect <span className="text-primary">Store</span>
      
      </span>
    </Link>
  );
}
