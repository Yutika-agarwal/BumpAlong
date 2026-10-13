// Claim lottery (PRD SEL-*). The draw is deterministic for a given seed, so a
// retried draw job produces the same winner and backups (idempotent).
import { createHash } from "node:crypto";

export interface Entrant {
  userId: string;
  /** 0 to 100. Below the threshold, entrants are skipped. */
  reliability: number;
}

export const MIN_RELIABILITY = 40;
export const BACKUP_COUNT = 3;

export interface DrawResult {
  winner?: string;
  backups: string[];
  skipped: { userId: string; reason: "giver" | "duplicate" | "low_reliability" }[];
}

function rank(seed: string, userId: string): string {
  return createHash("sha256").update(`${seed}:${userId}`).digest("hex");
}

export function draw(seed: string, giverId: string, entrants: readonly Entrant[]): DrawResult {
  const skipped: DrawResult["skipped"] = [];
  const seen = new Set<string>();
  const eligible: Entrant[] = [];
  for (const e of entrants) {
    if (e.userId === giverId) skipped.push({ userId: e.userId, reason: "giver" });
    else if (seen.has(e.userId)) skipped.push({ userId: e.userId, reason: "duplicate" });
    else if (e.reliability < MIN_RELIABILITY) skipped.push({ userId: e.userId, reason: "low_reliability" });
    else eligible.push(e);
    seen.add(e.userId);
  }
  const order = eligible
    .map((e) => ({ id: e.userId, key: rank(seed, e.userId) }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map((x) => x.id);
  return { winner: order[0], backups: order.slice(1, 1 + BACKUP_COUNT), skipped };
}
