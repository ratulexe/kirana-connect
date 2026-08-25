import { cn } from "../lib/cn.js";

export default function Card({ as: Tag = "section", className, children, ...props }) {
  return (
    <Tag className={cn("portal-glass rounded-panel", className)} {...props}>
      {children}
    </Tag>
  );
}
