export const UNIT_OPTIONS = [
  { code: "mg", label: "mg" },
  { code: "g", label: "g" },
  { code: "kg", label: "kg" },
  { code: "ml", label: "ml" },
  { code: "l", label: "L" },
  { code: "pc", label: "pc" },
  { code: "pcs", label: "pcs" },
  { code: "pair", label: "pair" },
  { code: "dozen", label: "dozen" },
  { code: "pack", label: "pack" },
  { code: "packet", label: "packet" },
  { code: "pouch", label: "pouch" },
  { code: "sachet", label: "sachet" },
  { code: "bottle", label: "bottle" },
  { code: "can", label: "can" },
  { code: "jar", label: "jar" },
  { code: "box", label: "box" },
  { code: "carton", label: "carton" },
  { code: "roll", label: "roll" },
  { code: "tray", label: "tray" },
  { code: "tube", label: "tube" },
  { code: "bar", label: "bar" },
  { code: "set", label: "set" },
  { code: "strip", label: "strip" },
  { code: "sheet", label: "sheet" },
  { code: "bag", label: "bag" },
  { code: "egg", label: "egg" },
  { code: "eggs", label: "eggs" },
  { code: "tablet", label: "tablet" },
  { code: "tablets", label: "tablets" },
];

const UNIT_LABELS = new Map(UNIT_OPTIONS.map((unit) => [unit.code, unit.label]));
const UNIT_ALIASES = new Map([
  ["ltr", "l"],
  ["litre", "l"],
  ["liter", "l"],
  ["litres", "l"],
  ["liters", "l"],
  ["piece", "pc"],
  ["pieces", "pcs"],
]);

export function normalizeUnitCode(value) {
  const code = String(value ?? "").trim().toLowerCase();
  return UNIT_ALIASES.get(code) ?? code;
}

export function allowedUnitCodes() {
  return UNIT_OPTIONS.map((unit) => unit.code);
}

export function unitLabelFor(code) {
  return UNIT_LABELS.get(normalizeUnitCode(code));
}

export function formatQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 3,
    useGrouping: false,
  }).format(number);
}

export function formatUnitLabel(quantity, unitCode) {
  const label = unitLabelFor(unitCode);
  if (!label) return "";
  return `${formatQuantity(quantity)} ${label}`;
}

export function normalizeProductIdentity(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
