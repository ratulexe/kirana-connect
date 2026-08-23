import { Check, CircleAlert, CircleSlash } from "lucide-react";
import Badge from "./Badge.jsx";

// Keys mirror the stock_status enum in the database.
const STATES = {
  in_stock: { tone: "success", icon: Check, label: "In stock" },
  low_stock: { tone: "warning", icon: CircleAlert, label: "Low stock" },
  out_of_stock: { tone: "neutral", icon: CircleSlash, label: "Unavailable" },
};

export default function StockBadge({ status, className }) {
  const state = STATES[status];
  if (!state) return null;

  return (
    <Badge tone={state.tone} icon={state.icon} className={className}>
      {state.label}
    </Badge>
  );
}
