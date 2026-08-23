import { cn } from "../lib/cn.js";

export default function Card({ as: Tag = "section", className, children, ...props }) {
  return (
    <Tag className={cn("rounded-panel border border-line bg-surface", className)} {...props}>
      {children}
    </Tag>
  );
}
