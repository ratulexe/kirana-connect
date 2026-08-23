import { cn } from "../../lib/cn.js";

/**
 * Horizontal rhythm for every section: one max width, one gutter.
 */
export default function Container({ as: Tag = "div", className, children }) {
  return (
    <Tag className={cn("mx-auto w-full max-w-content px-5 sm:px-6 lg:px-10", className)}>
      {children}
    </Tag>
  );
}
