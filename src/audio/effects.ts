type EffectSound = "correct" | "wrong" | "clear" | "combo";

const EFFECT_SOURCES: Record<EffectSound, string> = {
  correct: `${import.meta.env.BASE_URL}audio/correct.wav`,
  wrong: `${import.meta.env.BASE_URL}audio/wrong.wav`,
  clear: `${import.meta.env.BASE_URL}audio/clear.wav`,
  combo: `${import.meta.env.BASE_URL}audio/combo.wav`,
};

const EFFECT_VOLUME: Record<EffectSound, number> = {
  correct: 0.85,
  wrong: 0.75,
  clear: 0.9,
  combo: 0.5,
};

const BGM_SOURCE = `${import.meta.env.BASE_URL}audio/bgm.wav`;
const BGM_VOLUME = 0.3;

/** 이 콤보부터 정답음 위에 상승음을 얹습니다. */
export const COMBO_SOUND_THRESHOLD = 3;

const players = new Map<EffectSound, HTMLAudioElement>();
let bgmPlayer: HTMLAudioElement | null = null;

function getPlayer(sound: EffectSound): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  const cached = players.get(sound);
  if (cached) return cached;

  const player = new Audio(EFFECT_SOURCES[sound]);
  player.preload = "auto";
  player.volume = EFFECT_VOLUME[sound];
  players.set(sound, player);
  return player;
}

function getBgmPlayer(): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  if (bgmPlayer) return bgmPlayer;
  bgmPlayer = new Audio(BGM_SOURCE);
  bgmPlayer.preload = "auto";
  bgmPlayer.loop = true;
  bgmPlayer.volume = BGM_VOLUME;
  return bgmPlayer;
}

export function preloadEffectSounds(): void {
  getPlayer("correct")?.load();
  getPlayer("wrong")?.load();
  getPlayer("clear")?.load();
  getPlayer("combo")?.load();
}

export function playEffectSound(sound: EffectSound): void {
  const player = getPlayer(sound);
  if (!player) return;

  try {
    player.pause();
    player.currentTime = 0;
    void player.play().catch(() => {
      // Browser audio policy failures should never block game flow.
    });
  } catch {
    // Ignore unsupported or interrupted playback.
  }
}

/** 콤보가 임계값을 넘으면 정답음 위에 상승음을 얹습니다. */
export function playComboSound(combo: number): void {
  if (combo < COMBO_SOUND_THRESHOLD) return;
  playEffectSound("combo");
}

export function startBgm(): void {
  const player = getBgmPlayer();
  if (!player) return;
  try {
    void player.play().catch(() => {
      // 자동재생 차단은 무시합니다(다음 사용자 입력에서 다시 시도됩니다).
    });
  } catch {
    // Ignore unsupported playback.
  }
}

export function stopBgm(): void {
  if (!bgmPlayer) return;
  try {
    bgmPlayer.pause();
    bgmPlayer.currentTime = 0;
  } catch {
    // Ignore unsupported playback.
  }
}

export function stopEffectSounds(): void {
  for (const player of players.values()) {
    try {
      player.pause();
      player.currentTime = 0;
    } catch {
      // Ignore unsupported or interrupted playback.
    }
  }
  stopBgm();
}
