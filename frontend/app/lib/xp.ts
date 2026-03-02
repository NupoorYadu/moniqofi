/**
 * MoniqoFi – Finance RPG XP Utility
 * All XP awards go through here so they are deduplicated, persisted,
 * and broadcast to the Sidebar in real time.
 */

export const XP_STORAGE_KEY = "moniqofi_xp";

export type XPAction =
  | "login_daily"          // awarded by Sidebar on mount
  | "transaction_logged"   // logged a spend/income (+10, once/day)
  | "goal_contributed"     // added money to any goal (+15, once/day)
  | `goal_completed_${string}` // a specific goal hit 100% (+50, once per goal id)
  | "budget_on_track"      // all budgets < 80% used (+30, once/day)
  | "health_improved"      // health score went up since last check (+25, once/day)
  | "health_score_viewed"  // viewed health score while ≥ 60 (+10, once/day)
  | string;                // future-proof

/**
 * Award XP for an action.
 * - Deduplicated: each action key is awarded at most once per calendar day
 *   (except goals_completed_<id> which is truly one-time)
 * - Persists total in localStorage
 * - Fires a CustomEvent so the Sidebar ring can update without a page refresh
 * @returns amount actually awarded (0 if already awarded)
 */
export function awardXP(action: XPAction, amount: number): number {
  if (typeof window === "undefined") return 0;

  const today    = new Date().toDateString();
  const isOneTime = action.startsWith("goal_completed_");
  const storeKey  = isOneTime
    ? `moniqofi_xp_act_${action}`                  // permanent, no date
    : `moniqofi_xp_act_${action}_${today}`;         // resets daily

  if (localStorage.getItem(storeKey)) return 0;     // already awarded

  localStorage.setItem(storeKey, "1");

  const prev     = parseInt(localStorage.getItem(XP_STORAGE_KEY) || "0");
  const newTotal = prev + amount;
  localStorage.setItem(XP_STORAGE_KEY, String(newTotal));

  window.dispatchEvent(
    new CustomEvent("xpAwarded", {
      detail: { action, amount, total: newTotal },
    })
  );

  return amount;
}
