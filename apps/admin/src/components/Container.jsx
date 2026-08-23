import { cn } from "../lib/cn.js";

export default function Container({ className, children }) {
  return <div className={cn("mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
