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
  "settings.theme": "심볼 테마",
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

  // 인게임 파워업
  "powerup.groupAria": "코인 파워업",
  "powerup.hint": "즉시 힌트",
  "powerup.eliminate": "오답 소거",
  "powerup.used": "사용함",
  "powerup.policy.ranked":
    "공정한 기록 경쟁을 위해 데일리·도전장에서는 사용할 수 없어요.",
  "powerup.notEnough": "코인이 부족해요.",
  "powerup.alreadyUsed": "이 라운드에서 이미 사용했어요.",
  "powerup.unavailable": "지금은 이 파워업을 사용할 수 없어요.",
  "powerup.openFirst": "카드를 열면 파워업을 사용할 수 있어요.",
  "powerup.wait": "판정이 끝난 뒤 사용할 수 있어요.",
  "powerup.available": "각 파워업은 라운드마다 한 번 사용할 수 있어요.",
  "powerup.success.hint": "정답 심볼을 강조했어요.",
  "powerup.success.eliminate": "오답 심볼 2개를 소거했어요.",

  // HUD
  "hud.aria.openRanking": "랭킹 열기",
  "hud.aria.openingRanking": "랭킹 여는 중",
  "hud.aria.rankingFailed": "랭킹 열기. 최근 실패: {msg}",
  "hud.aria.exit": "홈으로 나가기",
  "hud.rank": "랭킹",
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
  "result.comboBonus": "최대 콤보 x{combo} 🪙 +{bonus}",

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
  "pack.ocean.label": "바다",
  "pack.ocean.desc": "물고기·조개·해양 생물 등 바다 테마",
  "pack.food.label": "음식",
  "pack.food.desc": "과일·디저트·먹거리 등 음식 테마",

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

  // 난이도
  "difficulty.label": "난이도",
  "difficulty.easy": "쉬움",
  "difficulty.normal": "보통",
  "difficulty.hard": "어려움",
  "difficulty.lockedMode": "데일리·도전장은 보통 난이도로 고정돼요.",

  // 게임 화면
  "game.open": "열기",
  "game.loading": "준비 중",
  "game.stage": "스테이지 {n}",
  "game.pauseTitle": "일시정지",
  "game.pauseBody": "화면을 벗어난 동안 시간이 멈췄어요.",
  "game.resume": "탭해서 계속",
  "game.penalty": "잠시 멈춤",
  "game.aria.locked": "오답이에요. 잠시 입력이 잠깁니다.",
  "game.aria.unlocked": "다시 누를 수 있어요.",

  // 결과 화면(버튼/상태)
  "result.share.idle": "공유하기",
  "result.share.sharing": "공유 중...",
  "result.share.shared": "공유했어요!",
  "result.share.copied": "링크 복사됨",
  "result.share.failed": "공유 실패",
  "result.newBest": "신기록!",
  "result.best": "베스트 {time}",
  "result.win": "승리!",
  "result.lose": "아쉬워요...",
  "result.opening": "여는 중",
  "result.ranking": "랭킹",
  "result.rankingUnavailable": "랭킹을 열 수 없어요",
  "result.retry": "다시 하기",
  "result.classic": "클래식",
  "result.exit": "나가기",
  "result.accuracy": "정확도 {rate}% · 오답 {wrong}회",
  "result.perfect": "무오답 클리어!",
  "result.practice": "연습 기록이라 리더보드에 올리지 않았어요.",
  "result.powerUpUnranked": "파워업을 사용한 판은 랭킹·베스트에 반영되지 않아요.",
  "result.archived": "지난 도전 기록은 리더보드에 올리지 않아요.",
  "result.nextDaily": "다음 도전까지 {time}",
  "result.dailyOpen": "새 도전이 열렸어요!",
  "result.droplets": "물방울 💧 +{n}",
  "result.stars": "별 {n}/3",
  "result.nextStage": "다음 스테이지 ▶",
  "result.stageRetry": "스테이지 다시 하기",

  // 홈(출석/정원/스테이지)
  "home.streak": "🔥 {n}일 연속 출석",
  "home.streakClaim": "오늘 보상 받기",
  "home.streakDone": "오늘 보상 완료 · 내일 🪙 {n}",
  "home.msg.streak": "출석 보상 🪙 +{n}",
  "home.droplets": "물방울 💧 {n}",
  "home.useDroplet": "💧 사용",
  "home.aria.useDroplet": "{name}에 물방울 주기",
  "home.msg.droplet": "물방울로 물을 줬어요 💧",
  "home.msg.dropletMatured": "물방울로 다 자랐어요! 🪙 +{n}",
  "home.msg.noDroplet": "물방울이 없어요. 게임을 클리어하면 모여요.",
  "home.dailyDone": "오늘 완료 ✓",
  "home.dailyNext": "새 도전까지 {time}",
  "home.archive": "지난 도전",
  "home.stage": "스테이지 도전",
  "home.stageProgress": "⭐ {n}/{m}",
  "home.stats": "내 기록",
  "home.aria.dex": "식물 도감 열기",

  // 식물 도감
  "dex.title": "식물 도감",
  "dex.subtitle": "다 키운 식물이 도감에 기록돼요. {n}/{m} 수집",
  "dex.locked": "아직 못 만난 식물",
  "dex.reward": "다 자라면 🪙 {n}",
  "dex.water": "한 단계에 물 {n}번",

  // 지난 데일리 아카이브
  "archive.title": "지난 도전",
  "archive.subtitle": "놓친 날의 덱을 다시 풀 수 있어요. 기록은 리더보드에 올라가지 않아요.",
  "archive.today": "오늘",
  "archive.cleared": "{time}",
  "archive.notCleared": "미클리어",
  "archive.sameDay": "당일 ⭐",
  "archive.late": "사후",

  // 내 기록
  "stats.title": "내 기록",
  "stats.clears": "총 클리어 {n}판",
  "stats.accuracy": "정확도 {rate}%",
  "stats.perfect": "무오답 클리어 {n}판",
  "stats.byMode": "클래식 {classic} · 데일리 {daily} · 스테이지 {stage}",
  "stats.bestClassic": "클래식 베스트 {time}",
  "stats.distribution": "클리어 시간 분포",
  "stats.bucket.under15": "15초 이하",
  "stats.bucket.under20": "20초 이하",
  "stats.bucket.under30": "30초 이하",
  "stats.bucket.over30": "30초 초과",
  "stats.empty": "아직 클리어 기록이 없어요.",

  // 스테이지
  "stage.title": "스테이지",
  "stage.subtitle": "앞 스테이지를 클리어하면 다음이 열려요.",
  "stage.locked": "잠김",
  "stage.play": "도전",
  "stage.goal": "{n}초 안에 별 2개",
  "stage.rounds": "{n}라운드",
  "stage.cleared": "클리어 ⭐{n}",

  // 설정 추가 행
  "settings.haptics": "진동",
  "settings.on": "켜짐",
  "settings.off": "꺼짐",
  "settings.tutorial": "게임 방법",
  "settings.tutorialAction": "다시 보기",
  "settings.stats": "내 기록",
  "settings.statsAction": "보기",
  "settings.themeGo": "상점에서 바꾸기 ›",

  // 튜토리얼(인터랙티브)
  "tutorial.prompt": "아래 카드에서 위 카드와 같은 그림을 찾아 눌러보세요.",
  "tutorial.correct": "바로 그거예요! 이렇게 찾으면 됩니다.",
  "tutorial.wrong": "그 그림은 위 카드에 없어요. 다시 찾아볼까요?",
  "tutorial.skip": "건너뛰기",
  "tutorial.aria.symbol": "튜토리얼 심볼 {n}",

  // 데일리 공유(스포일러 프리)
  "share.daily.message":
    "같은그림찾기 데일리 {date}\n⏱ {time}\n{grid}\n{link}",

  // 오류 복구
  "error.title": "문제가 생겼어요",
  "error.body":
    "화면을 그리는 중 문제가 생겼어요. 코인·정원·미션 기록은 그대로 저장돼 있어요.",
  "error.retry": "다시 시작",

  // 추가 미션 라벨
  "mission.play5.label": "게임 5판 플레이",
  "mission.comboMaster.label": "콤보 {c}회 이상 달성",
  "mission.noMistake.label": "오답 없이 클리어",
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
  "settings.theme": "Symbol theme",
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

  "powerup.groupAria": "Coin power-ups",
  "powerup.hint": "Instant Hint",
  "powerup.eliminate": "Remove Errors",
  "powerup.used": "Used",
  "powerup.policy.ranked":
    "Power-ups are disabled in Daily and Challenge modes for fair rankings.",
  "powerup.notEnough": "Not enough coins.",
  "powerup.alreadyUsed": "Already used in this round.",
  "powerup.unavailable": "This power-up is unavailable right now.",
  "powerup.openFirst": "Open the cards to use power-ups.",
  "powerup.wait": "Available after the current result finishes.",
  "powerup.available": "Each power-up can be used once per round.",
  "powerup.success.hint": "Highlighted the matching symbol.",
  "powerup.success.eliminate": "Removed two incorrect symbols.",

  "hud.aria.openRanking": "Open ranking",
  "hud.aria.openingRanking": "Opening ranking",
  "hud.aria.rankingFailed": "Open ranking. Last failed: {msg}",
  "hud.aria.exit": "Exit to home",
  "hud.rank": "RANK",
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
  "result.comboBonus": "Max combo x{combo} 🪙 +{bonus}",

  "tutorial.title": "Find the Matching Picture",
  "tutorial.body1":
    "There's exactly one matching picture on the top and bottom cards. Tap it on the bottom card to move to the next card.",
  "tutorial.body2":
    "A wrong tap pauses you briefly — finish faster for a better time.",
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
  "pack.ocean.label": "Ocean",
  "pack.ocean.desc": "Fish, shells, sea creatures and more",
  "pack.food.label": "Food",
  "pack.food.desc": "Fruits, desserts, snacks and more",

  "plant.sprout.name": "Sprout",
  "plant.cactus.name": "Cactus",
  "plant.sunflower.name": "Sunflower",
  "plant.rose.name": "Rose",
  "plant.tree.name": "Tree",
  "plant.palm.name": "Palm",

  "mission.play3.label": "Play 3 games",
  "mission.fastClear.label": "Clear within {n}s",
  "mission.daily.label": "Complete the Daily Challenge",

  "difficulty.label": "Difficulty",
  "difficulty.easy": "Easy",
  "difficulty.normal": "Normal",
  "difficulty.hard": "Hard",
  "difficulty.lockedMode": "Daily and Challenge always run on Normal.",

  "game.open": "OPEN",
  "game.loading": "Loading",
  "game.stage": "Stage {n}",
  "game.pauseTitle": "Paused",
  "game.pauseBody": "The timer stopped while the app was in the background.",
  "game.resume": "Tap to continue",
  "game.penalty": "Locked",
  "game.aria.locked": "Wrong tap. Input is locked for a moment.",
  "game.aria.unlocked": "You can tap again.",

  "result.share.idle": "SHARE",
  "result.share.sharing": "...",
  "result.share.shared": "SENT!",
  "result.share.copied": "LINK COPIED",
  "result.share.failed": "SHARE FAILED",
  "result.newBest": "NEW BEST!",
  "result.best": "BEST {time}",
  "result.win": "WIN!",
  "result.lose": "LOSE...",
  "result.opening": "OPENING",
  "result.ranking": "RANKING",
  "result.rankingUnavailable": "RANKING UNAVAILABLE",
  "result.retry": "RETRY",
  "result.classic": "CLASSIC",
  "result.exit": "EXIT",
  "result.accuracy": "Accuracy {rate}% · {wrong} misses",
  "result.perfect": "PERFECT CLEAR!",
  "result.practice": "Practice run — not submitted to the leaderboard.",
  "result.powerUpUnranked":
    "Runs with power-ups are excluded from rankings and best records.",
  "result.archived": "Archive runs are not submitted to the leaderboard.",
  "result.nextDaily": "Next daily in {time}",
  "result.dailyOpen": "A new daily is open!",
  "result.droplets": "Droplets 💧 +{n}",
  "result.stars": "Stars {n}/3",
  "result.nextStage": "Next stage ▶",
  "result.stageRetry": "Retry stage",

  "home.streak": "🔥 {n}-day streak",
  "home.streakClaim": "Claim today",
  "home.streakDone": "Claimed · tomorrow 🪙 {n}",
  "home.msg.streak": "Streak reward 🪙 +{n}",
  "home.droplets": "Droplets 💧 {n}",
  "home.useDroplet": "💧 Use",
  "home.aria.useDroplet": "Use a droplet on {name}",
  "home.msg.droplet": "Watered with a droplet 💧",
  "home.msg.dropletMatured": "Fully grown with a droplet! 🪙 +{n}",
  "home.msg.noDroplet": "No droplets. Clear games to earn them.",
  "home.dailyDone": "Done today ✓",
  "home.dailyNext": "New daily in {time}",
  "home.archive": "Archive",
  "home.stage": "Stage Mode",
  "home.stageProgress": "⭐ {n}/{m}",
  "home.stats": "My Stats",
  "home.aria.dex": "Open the plant collection",

  "dex.title": "Plant Collection",
  "dex.subtitle": "Fully grown plants are recorded here. {n}/{m} collected",
  "dex.locked": "Not discovered yet",
  "dex.reward": "🪙 {n} when grown",
  "dex.water": "{n} waters per stage",

  "archive.title": "Daily Archive",
  "archive.subtitle":
    "Replay decks you missed. Archive runs are not submitted to the leaderboard.",
  "archive.today": "Today",
  "archive.cleared": "{time}",
  "archive.notCleared": "Not cleared",
  "archive.sameDay": "Same day ⭐",
  "archive.late": "Late",

  "stats.title": "My Stats",
  "stats.clears": "{n} clears",
  "stats.accuracy": "Accuracy {rate}%",
  "stats.perfect": "{n} perfect clears",
  "stats.byMode": "Classic {classic} · Daily {daily} · Stage {stage}",
  "stats.bestClassic": "Classic best {time}",
  "stats.distribution": "Clear time distribution",
  "stats.bucket.under15": "≤15s",
  "stats.bucket.under20": "≤20s",
  "stats.bucket.under30": "≤30s",
  "stats.bucket.over30": ">30s",
  "stats.empty": "No clears yet.",

  "stage.title": "Stages",
  "stage.subtitle": "Clear a stage to unlock the next one.",
  "stage.locked": "Locked",
  "stage.play": "Play",
  "stage.goal": "2 stars under {n}s",
  "stage.rounds": "{n} rounds",
  "stage.cleared": "Cleared ⭐{n}",

  "settings.haptics": "Haptics",
  "settings.on": "On",
  "settings.off": "Off",
  "settings.tutorial": "How to play",
  "settings.tutorialAction": "Show again",
  "settings.stats": "My stats",
  "settings.statsAction": "View",
  "settings.themeGo": "Change in Shop ›",

  "tutorial.prompt": "Find the picture that appears on both cards and tap it below.",
  "tutorial.correct": "That's it! This is how you play.",
  "tutorial.wrong": "That one isn't on the top card. Try again!",
  "tutorial.skip": "Skip",
  "tutorial.aria.symbol": "Tutorial symbol {n}",

  "share.daily.message":
    "Match Picture Daily {date}\n⏱ {time}\n{grid}\n{link}",

  "error.title": "Something went wrong",
  "error.body":
    "The screen failed to render. Your coins, garden and missions are still saved.",
  "error.retry": "Restart",

  "mission.play5.label": "Play 5 games",
  "mission.comboMaster.label": "Reach a combo of {c}",
  "mission.noMistake.label": "Clear without a miss",
};

export const messages: Record<Locale, Messages> = { ko, en };
