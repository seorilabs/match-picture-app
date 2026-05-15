import { TOTAL_CARDS } from "../game/rules";

const DEBUG_TOTAL_CARDS_KEY = "match-picture/debug-total-cards";

export function parseDebugTotalCards(value: string | null): number | null {
  if (value === null) return null;
  const totalCards = Number(value.trim());
  if (!Number.isInteger(totalCards)) return null;
  if (totalCards < 1 || totalCards > TOTAL_CARDS) return null;
  return totalCards;
}

function readSessionValue(): string | null {
  try {
    return window.sessionStorage.getItem(DEBUG_TOTAL_CARDS_KEY);
  } catch {
    return null;
  }
}

function writeSessionValue(value: number): void {
  try {
    window.sessionStorage.setItem(DEBUG_TOTAL_CARDS_KEY, String(value));
  } catch {
    // ignore storage failures in constrained WebViews
  }
}

function clearSessionValue(): void {
  try {
    window.sessionStorage.removeItem(DEBUG_TOTAL_CARDS_KEY);
  } catch {
    // ignore storage failures in constrained WebViews
  }
}

export function getDebugSessionTotalCards(): number | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const rawParam = params.get("debugTotalCards") ?? params.get("cards");

  if (rawParam !== null) {
    const normalized = rawParam.trim().toLowerCase();
    if (
      normalized === "" ||
      normalized === "off" ||
      normalized === "reset" ||
      normalized === "default"
    ) {
      clearSessionValue();
      return null;
    }

    const parsed = parseDebugTotalCards(rawParam);
    if (parsed !== null) {
      writeSessionValue(parsed);
      return parsed;
    }
  }

  return parseDebugTotalCards(readSessionValue());
}
