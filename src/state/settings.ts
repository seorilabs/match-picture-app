/**
 * 전역 설정(사운드/햅틱)의 저장 키와 직렬화. 순수 로직만 담는다.
 *
 * 사운드 키는 게임 화면이 쓰던 기존 키를 그대로 유지해 사용자의 저장값을 승계한다.
 */

export const SOUND_STORAGE_KEY = "match-picture/sound-enabled";
export const HAPTICS_STORAGE_KEY = "match-picture/haptics-enabled";

/** 저장된 "1"/"0" 문자열을 boolean으로 읽는다. 값이 없으면 기본값(켜짐). */
export function parseToggle(value: string | null, fallback = true): boolean {
  if (value === "1") return true;
  if (value === "0") return false;
  return fallback;
}

export function serializeToggle(enabled: boolean): string {
  return enabled ? "1" : "0";
}
