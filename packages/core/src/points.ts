// Points rules (PRD PTS-*): starting balance, tiers, the need-based monthly
// allowance and the monthly receive cap. Pure functions; the ledger itself
// lives in the database as append-only entries.
import { TIER_POINTS, type Tier } from "./catalog.js";

export const STARTING_POINTS = 300;
export const MONTHLY_RECEIVE_CAP = 8;
/** Free items per month that need no points, so a parent at 0 is never shut out. */
export const MONTHLY_ALLOWANCE: Readonly<Record<Tier, number>> = { Small: 2, Medium: 1, Large: 0 };
/** How many slots of the monthly cap an item uses. */
export const CAP_WEIGHT: Readonly<Record<Tier, number>> = { Small: 1, Medium: 1, Large: 2 };

export interface MonthState {
  balance: number;
  /** Cap slots used this calendar month. */
  receivedThisMonth: number;
  allowanceUsed: Readonly<Record<Tier, number>>;
}

export type ReceiveQuote =
  | { allowed: true; method: "points"; cost: number }
  | { allowed: true; method: "allowance"; cost: 0 }
  | { allowed: false; reason: "monthly_cap" | "insufficient_points"; message: string };

/** Decide whether, and how, someone can receive an item of this tier right now. */
export function quoteReceive(state: MonthState, tier: Tier): ReceiveQuote {
  if (state.receivedThisMonth + CAP_WEIGHT[tier] > MONTHLY_RECEIVE_CAP) {
    return { allowed: false, reason: "monthly_cap", message: `You've reached this month's limit of ${MONTHLY_RECEIVE_CAP} items. It resets on the 1st.` };
  }
  const cost = TIER_POINTS[tier];
  if (state.balance >= cost) return { allowed: true, method: "points", cost };
  if (state.allowanceUsed[tier] < MONTHLY_ALLOWANCE[tier]) return { allowed: true, method: "allowance", cost: 0 };
  return {
    allowed: false,
    reason: "insufficient_points",
    message: `You need ${cost} points for a ${tier} item and you have ${state.balance}. Give something away to earn more.`,
  };
}

/** Apply a confirmed handoff to the receiver's month. Throws if the quote no longer holds. */
export function applyReceive(state: MonthState, tier: Tier): { state: MonthState; delta: number; method: "points" | "allowance" } {
  const q = quoteReceive(state, tier);
  if (!q.allowed) throw new Error(q.reason);
  const allowanceUsed = { ...state.allowanceUsed };
  if (q.method === "allowance") allowanceUsed[tier] += 1;
  return {
    state: { balance: state.balance - q.cost, receivedThisMonth: state.receivedThisMonth + CAP_WEIGHT[tier], allowanceUsed },
    delta: -q.cost,
    method: q.method,
  };
}

/** Points the giver earns when a handoff is confirmed. */
export function giverEarns(tier: Tier): number {
  return TIER_POINTS[tier];
}

export function newMonth(balance: number): MonthState {
  return { balance, receivedThisMonth: 0, allowanceUsed: { Small: 0, Medium: 0, Large: 0 } };
}

export interface LedgerEntry {
  userId: string;
  delta: number;
}

/** Balance from append-only ledger entries. */
export function balanceOf(entries: readonly LedgerEntry[], userId: string): number {
  return entries.reduce((sum, e) => (e.userId === userId ? sum + e.delta : sum), 0);
}
