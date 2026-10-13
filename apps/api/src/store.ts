// Storage for the API. MemoryStore backs tests and local development; a
// Postgres store implementing the same interface follows (see db/migrations).
import { randomUUID } from "node:crypto";
import { STARTING_POINTS, balanceOf, type MonthState, type Stage, type Tier } from "@bumpalong/core";

export interface User {
  id: string;
  reliability: number;
  /** Counters for the current calendar month. The balance always comes from the ledger. */
  receivedThisMonth: number;
  allowanceUsed: Record<Tier, number>;
}

export type ListingStatus = "open" | "drawn" | "handed_off" | "withdrawn";

export interface Listing {
  id: string;
  giverId: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  condition: string;
  tier: Tier;
  stages: Stage[];
  badges: string[];
  status: ListingStatus;
  createdAt: Date;
  closesAt: Date;
}

export interface Interest {
  listingId: string;
  userId: string;
  chips: string[];
  createdAt: Date;
}

export type HoldStatus = "offered" | "accepted" | "completed" | "released";

export interface Hold {
  id: string;
  listingId: string;
  receiverId: string;
  backups: string[];
  status: HoldStatus;
  createdAt: Date;
}

export interface LedgerRow {
  id: string;
  userId: string;
  delta: number;
  reason: "starting_points" | "gave" | "received" | "adjustment";
  /** Unique key so a retried request never moves points twice. */
  idempotencyKey: string;
  createdAt: Date;
}

export class MemoryStore {
  users = new Map<string, User>();
  listings = new Map<string, Listing>();
  interests: Interest[] = [];
  holds = new Map<string, Hold>();
  ledger: LedgerRow[] = [];

  /** Returns the user, creating them with starting points on first sight. */
  ensureUser(id: string): User {
    let u = this.users.get(id);
    if (!u) {
      u = { id, reliability: 80, receivedThisMonth: 0, allowanceUsed: { Small: 0, Medium: 0, Large: 0 } };
      this.users.set(id, u);
      this.addLedger(id, STARTING_POINTS, "starting_points", `start:${id}`);
    }
    return u;
  }

  /** Appends a ledger row unless one with the same key exists. Returns false on a duplicate. */
  addLedger(userId: string, delta: number, reason: LedgerRow["reason"], idempotencyKey: string): boolean {
    if (this.ledger.some((r) => r.idempotencyKey === idempotencyKey)) return false;
    this.ledger.push({ id: randomUUID(), userId, delta, reason, idempotencyKey, createdAt: new Date() });
    return true;
  }

  monthState(userId: string): MonthState {
    const u = this.ensureUser(userId);
    return { balance: balanceOf(this.ledger, userId), receivedThisMonth: u.receivedThisMonth, allowanceUsed: u.allowanceUsed };
  }

  holdForListing(listingId: string): Hold | undefined {
    for (const h of this.holds.values()) if (h.listingId === listingId) return h;
    return undefined;
  }
}
