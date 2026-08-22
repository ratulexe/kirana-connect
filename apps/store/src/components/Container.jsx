import { cn } from "../lib/cn.js";

export default function Container({ as: Tag = "div", className, children }) {
  return (
    <Tag className={cn("mx-auto w-full max-w-content px-5 sm:px-6 lg:px-8", className)}>
      {children}
    </Tag>
  );
}
