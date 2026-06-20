/**
 * 경량 i18n 사전. UI 문자열 + 데이터(심볼팩/식물/미션) 이름을 모두 키로 관리한다.
 * 새 언어를 추가하려면 SUPPORTED_LOCALES와 messages에 항목을 더하면 된다.
 *
 * 보간: 값에 {name} 형태를 쓰면 t(key, { name }) 로 치환된다.
 */
export const SUPPORTED_LOCALES = ["ko", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export type Messages = Record<string, string>;

const ko: Messages = {
  // 탭
  "tab.home": "홈",
  "tab.shop": "상점",
  "tab.missions": "미션",
  "tab.settings": "설정",
  "tab.aria": "메뉴",

  // 공통
  "common.close": "닫기",

  // 홈(정원)
  "home.title": "나의 정원",
  "home.plant": "씨앗 심기",
  "home.grown": "다 자람",
  "home.waterMore": "물 {n}번 더",
  "home.clear": "치우기",
  "home.water": "물주기",
  "home.wateredToday": "오늘 물 줬어요",
  "home.seedButton": "씨앗 심기",
  "home.dex": "도감 {n}/{m}",
  "home.play": "게임 시작",
  "home.daily": "오늘의 도전",
  "home.msg.matured": "식물이 다 자랐어요! 🪙 +{n}",
  "home.msg.watered": "물을 줬어요. 식물이 자라고 있어요 🌱",
  "home.msg.fertMatured": "비료로 다 자랐어요! 🪙 +{n}",
  "home.msg.fertilized": "비료를 줬어요 🌿",
  "home.msg.notEnough": "코인이 부족해요.",
  "home.msg.planted": "{name} 씨앗을 심었어요 🌱",
  "home.aria.emptyPlot": "빈 화분에 씨앗 심기",
  "home.aria.removePlot": "{name} 화분 치우기",
  "home.aria.fertilize": "{name}에 비료 주기 (코인 {cost})",

  // 씨앗 심기 모달
  "seed.title": "씨앗 심기",
  "seed.subCan": "코인으로 씨앗을 사서 빈 화분에 심어요.",
  "seed.subFull": "빈 화분이 없어요. 다 자란 화분을 치워주세요.",
  "seed.rewardWhenGrown": "다 자라면 🪙 {n}",
  "seed.free": "무료",

  // 상점
  "shop.title": "상점",
  "shop.subtitle":
    "심볼팩을 코인으로 해금하고 장착하세요. 팩을 누르면 전체 심볼을 볼 수 있어요.",
  "shop.equipped": "사용 중",
  "shop.use": "사용",
  "shop.bought": "'{name}' 팩을 구매하고 장착했어요.",
  "shop.notEnough": "코인이 부족해요. 게임을 플레이해 코인을 모아보세요.",
  "shop.previewAria": "{name} 팩 전체 심볼 보기",
  "shop.previewMore": "전체 보기 ›",

  // 미션
  "missions.title": "오늘의 미션",
  "missions.subtitle": "매일 자정(KST)에 새 미션으로 갱신됩니다.",
  "missions.done": "완료 ✓",
  "missions.claim": "받기",
  "missions.inProgress": "진행 중",

  // 설정
  "settings.title": "설정",
  "settings.sound": "사운드",
  "settings.soundHint": "게임 화면에서 조절",
  "settings.theme": "심볼 테마",
  "settings.themeHint": "상점에서 장착",
  "settings.version": "버전",
  "settings.language": "언어",

  // 게임 모드 바
  "game.classic": "클래식",
  "game.daily": "오늘의 도전 {label}",
  "game.challenge": "도전장",
  "game.modeAria": "게임 모드",
  "game.aria.opponent": "상대 카드",
  "game.aria.mine": "내 카드",
  "game.aria.openCard": "카드 열고 게임 시작",
  "game.openSub": "카드 열기",
  "home.aria.garden": "나의 정원",

  // HUD
  "hud.aria.openRanking": "랭킹 열기",
  "hud.aria.openingRanking": "랭킹 여는 중",
  "hud.aria.rankingFailed": "랭킹 열기. 최근 실패: {msg}",
  "hud.aria.exit": "홈으로 나가기",
  "hud.aria.soundOff": "효과음 끄기",
  "hud.aria.soundOn": "효과음 켜기",

  // 결과 화면
  "result.daily": "오늘의 도전",
  "result.challenge": "도전장 대결",
  "result.toBest": "베스트까지 {n}초!",
  "result.rival": "상대 기록 {t}",
  "result.submitting": "랭킹 등록 중",
  "result.submitFailed": "랭킹 등록 실패",
  "result.scoreLabel": "랭킹 등록 점수",
  "result.dailyCta": "오늘의 도전 ▶",

  // 튜토리얼
  "tutorial.title": "같은 그림을 찾아요",
  "tutorial.body1":
    "위 카드와 아래 카드에는 같은 그림이 딱 하나 있어요. 아래 카드에서 그 그림을 누르면 다음 카드로 넘어갑니다.",
  "tutorial.body2": "틀리면 잠깐 멈추고, 빨리 끝낼수록 기록이 좋아져요.",
  "tutorial.start": "알겠어요",

  // 공유 문구
  "share.message":
    "같은그림찾기 {time} 클리어! 같은 카드로 내 기록을 깨볼래요? {link}",

  // 코인 배지
  "coin.aria": "보유 코인 {n}",

  // 심볼팩
  "pack.classic.label": "클래식",
  "pack.classic.desc": "Unity 원본 NotoEmoji 심볼",
  "pack.pixel.label": "픽셀",
  "pack.pixel.desc": "12×12 픽셀 아트 19종 × 3색",
  "pack.space.label": "우주",
  "pack.space.desc": "행성·UFO·로켓 등 우주 테마",
  "pack.instrument.label": "악기",
  "pack.instrument.desc": "기타·드럼·음표 등 악기 테마",

  // 식물
  "plant.sprout.name": "새싹",
  "plant.cactus.name": "선인장",
  "plant.sunflower.name": "해바라기",
  "plant.rose.name": "장미",
  "plant.tree.name": "나무",
  "plant.palm.name": "야자수",

  // 미션 라벨
  "mission.play3.label": "게임 3판 플레이",
  "mission.fastClear.label": "{n}초 안에 클리어",
  "mission.daily.label": "오늘의 도전 완료",
};

const en: Messages = {
  "tab.home": "Home",
  "tab.shop": "Shop",
  "tab.missions": "Missions",
  "tab.settings": "Settings",
  "tab.aria": "Menu",

  "common.close": "Close",

  "home.title": "My Garden",
  "home.plant": "Plant",
  "home.grown": "Grown",
  "home.waterMore": "{n} more water",
  "home.clear": "Clear",
  "home.water": "Water",
  "home.wateredToday": "Watered today",
  "home.seedButton": "Plant Seed",
  "home.dex": "Collection {n}/{m}",
  "home.play": "Play",
  "home.daily": "Daily Challenge",
  "home.msg.matured": "Your plant fully grew! 🪙 +{n}",
  "home.msg.watered": "Watered! It's growing 🌱",
  "home.msg.fertMatured": "Grown with fertilizer! 🪙 +{n}",
  "home.msg.fertilized": "Fertilized 🌿",
  "home.msg.notEnough": "Not enough coins.",
  "home.msg.planted": "Planted {name} 🌱",
  "home.aria.emptyPlot": "Plant a seed in the empty plot",
  "home.aria.removePlot": "Clear the {name} plot",
  "home.aria.fertilize": "Fertilize {name} ({cost} coins)",

  "seed.title": "Plant a Seed",
  "seed.subCan": "Buy a seed with coins and plant it in an empty plot.",
  "seed.subFull": "No empty plot. Clear a fully grown plant first.",
  "seed.rewardWhenGrown": "🪙 {n} when grown",
  "seed.free": "Free",

  "shop.title": "Shop",
  "shop.subtitle":
    "Unlock symbol packs with coins and equip them. Tap a pack to see every symbol.",
  "shop.equipped": "Equipped",
  "shop.use": "Use",
  "shop.bought": "Bought and equipped '{name}'.",
  "shop.notEnough": "Not enough coins. Play games to earn more.",
  "shop.previewAria": "View all symbols in the {name} pack",
  "shop.previewMore": "See all ›",

  "missions.title": "Today's Missions",
  "missions.subtitle": "Refreshes every day at midnight (KST).",
  "missions.done": "Done ✓",
  "missions.claim": "Claim",
  "missions.inProgress": "In progress",

  "settings.title": "Settings",
  "settings.sound": "Sound",
  "settings.soundHint": "Adjust in game",
  "settings.theme": "Symbol theme",
  "settings.themeHint": "Equip in Shop",
  "settings.version": "Version",
  "settings.language": "Language",

  "game.classic": "Classic",
  "game.daily": "Daily {label}",
  "game.challenge": "Challenge",
  "game.modeAria": "Game mode",
  "game.aria.opponent": "Opponent card",
  "game.aria.mine": "Your card",
  "game.aria.openCard": "Open cards and start",
  "game.openSub": "Open cards",
  "home.aria.garden": "My garden",

  "hud.aria.openRanking": "Open ranking",
  "hud.aria.openingRanking": "Opening ranking",
  "hud.aria.rankingFailed": "Open ranking. Last failed: {msg}",
  "hud.aria.exit": "Exit to home",
  "hud.aria.soundOff": "Mute sound",
  "hud.aria.soundOn": "Unmute sound",

  "result.daily": "Daily Challenge",
  "result.challenge": "Challenge Match",
  "result.toBest": "{n}s to your best!",
  "result.rival": "Rival {t}",
  "result.submitting": "Submitting score",
  "result.submitFailed": "Score submit failed",
  "result.scoreLabel": "Submitted score",
  "result.dailyCta": "Daily Challenge ▶",

  "tutorial.title": "Find the Matching Picture",
  "tutorial.body1":
    "There's exactly one matching picture on the top and bottom cards. Tap it on the bottom card to move to the next card.",
  "tutorial.body2": "A wrong tap pauses you briefly — finish faster for a better time.",
  "tutorial.start": "Got it",

  "share.message":
    "I cleared Match Picture in {time}! Beat my record on the same cards: {link}",

  "coin.aria": "{n} coins",

  "pack.classic.label": "Classic",
  "pack.classic.desc": "Original Unity NotoEmoji symbols",
  "pack.pixel.label": "Pixel",
  "pack.pixel.desc": "12×12 pixel art, 19 motifs × 3 colors",
  "pack.space.label": "Space",
  "pack.space.desc": "Planets, UFOs, rockets and more",
  "pack.instrument.label": "Instrument",
  "pack.instrument.desc": "Guitars, drums, notes and more",

  "plant.sprout.name": "Sprout",
  "plant.cactus.name": "Cactus",
  "plant.sunflower.name": "Sunflower",
  "plant.rose.name": "Rose",
  "plant.tree.name": "Tree",
  "plant.palm.name": "Palm",

  "mission.play3.label": "Play 3 games",
  "mission.fastClear.label": "Clear within {n}s",
  "mission.daily.label": "Complete the Daily Challenge",
};

export const messages: Record<Locale, Messages> = { ko, en };
