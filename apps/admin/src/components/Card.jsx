import { cn } from "../lib/cn.js";

export default function Card({ className, children, ...props }) {
  return (
    <div className={cn("rounded-card border border-line bg-surface shadow-subtle", className)} {...props}>
      {children}
    </div>
  );
}
