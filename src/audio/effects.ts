type EffectSound = "correct" | "wrong";

const EFFECT_SOURCES: Record<EffectSound, string> = {
  correct: `${import.meta.env.BASE_URL}audio/correct.wav`,
  wrong: `${import.meta.env.BASE_URL}audio/wrong.wav`,
};

const EFFECT_VOLUME: Record<EffectSound, number> = {
  correct: 0.85,
  wrong: 0.75,
};

const players = new Map<EffectSound, HTMLAudioElement>();

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

export function preloadEffectSounds(): void {
  getPlayer("correct")?.load();
  getPlayer("wrong")?.load();
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

export function stopEffectSounds(): void {
  for (const player of players.values()) {
    try {
      player.pause();
      player.currentTime = 0;
    } catch {
      // Ignore unsupported or interrupted playback.
    }
  }
}
