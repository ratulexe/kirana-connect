import { cn } from "../lib/cn.js";

export default function Card({ className, children, ...props }) {
  return (
    <div className={cn("admin-glass rounded-card", className)} {...props}>
      {children}
    </div>
  );
}
