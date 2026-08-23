import { randomUUID } from "node:crypto";

const pendingChanges = new Map();

export function isMissingChangeRequestTable(error) {
  const message = String(error?.message ?? "").toLowerCase();
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    (message.includes("store_change_requests") && message.includes("schema cache"))
  );
}

export function memoryPendingChangeByStoreId(storeId) {
  return [...pendingChanges.values()].find(
    (change) => change.store_id === storeId && change.status === "pending",
  ) ?? null;
}

export function memoryPendingChangeById(changeId) {
  const change = pendingChanges.get(changeId);
  return change?.status === "pending" ? change : null;
}

export function memoryPendingChanges({ limit = 50, offset = 0 } = {}) {
  return [...pendingChanges.values()]
    .filter((change) => change.status === "pending")
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
    .slice(offset, offset + limit);
}

export function memoryPendingChangeCount() {
  return [...pendingChanges.values()].filter((change) => change.status === "pending").length;
}

export function upsertMemoryStoreChange({ storeId, ownerId, payload, hours }) {
  const existing = memoryPendingChangeByStoreId(storeId);
  const change = {
    id: existing?.id ?? randomUUID(),
    store_id: storeId,
    owner_id: ownerId,
    payload,
    hours,
    status: "pending",
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
    admin_note: null,
    storage: "memory",
  };

  pendingChanges.set(change.id, change);
  return change;
}

export function markMemoryStoreChangeReviewed(changeId, { status, adminId }) {
  const change = pendingChanges.get(changeId);
  if (!change || change.status !== "pending") return null;

  const reviewed = {
    ...change,
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminId,
  };

  pendingChanges.set(changeId, reviewed);
  return reviewed;
}
