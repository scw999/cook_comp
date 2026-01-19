// ==================== 게임 상태 ====================

let gameState = {
    players: [],
    currentPlayerIndex: 0,
    currentRound: 1,
    totalRounds: 4,
    phase: 1,
    selectedIngredients: { main: null, sub1: null, sub2: null },
    cookingScore: 0,
    selectedTheme: null,
    decorations: [],
    timerInterval: null,
    timeRemaining: 60,
    cookingAttempts: 0,
    maxCookingAttempts: 5,
    comboCount: 0,
    gaugeSpeed: 3,
    gaugeDirection: 1,
    gaugePosition: 0,
    isGaugeRunning: false,
    currentBoss: null,
    bossActive: false,
    defeatedBosses: [],
    // 재료 수집 미니게임
    ingredientGameActive: false,
    caughtIngredients: [],
    ingredientGameScore: 0,
    // 조리 미니게임 타입
    cookingMiniGameType: null,
    miniGameData: {},
    // 플레이팅 메인 요리 위치
    mainDishPosition: { x: 50, y: 50 }
};

// 플레이어 클래스
class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.totalScore = 0;
        this.fame = 0;
        this.roundScores = [];
    }

    addRoundScore(score) {
        this.roundScores.push(score);
        this.totalScore += score;
        this.fame += Math.floor(score / 10);
    }
}

// 게임 상태 초기화
function resetGameState() {
    gameState.players = [];
    gameState.currentPlayerIndex = 0;
    gameState.currentRound = 1;
    gameState.phase = 1;
    gameState.defeatedBosses = [];
    resetTurnState();
}

// 턴 상태 초기화
function resetTurnState() {
    gameState.phase = 1;  // 페이즈를 1로 초기화
    gameState.selectedIngredients = { main: null, sub1: null, sub2: null };
    gameState.cookingScore = 0;
    gameState.selectedTheme = null;
    gameState.decorations = [];
    gameState.cookingAttempts = 0;
    gameState.comboCount = 0;
    gameState.bossActive = false;
    gameState.currentBoss = null;
    gameState.ingredientGameScore = 0;
    gameState.caughtIngredients = [];
    gameState.ingredientGameActive = false;  // 재료 미니게임 상태 초기화
    gameState.mainDishPosition = { x: 50, y: 50 };
    gameState.isGaugeRunning = false;
    gameState.cookingMiniGameType = null;
    gameState.miniGameData = {};
}

// 다음 플레이어로 이동
function nextPlayer() {
    gameState.currentPlayerIndex++;
    if (gameState.currentPlayerIndex >= gameState.players.length) {
        gameState.currentPlayerIndex = 0;
        gameState.currentRound++;
    }
}

// 현재 플레이어 가져오기
function getCurrentPlayer() {
    return gameState.players[gameState.currentPlayerIndex];
}

// 게임 오버 체크
function isGameOver() {
    return gameState.currentRound > gameState.totalRounds;
}

// 보스 체크
function checkForBoss(player) {
    for (const boss of SERVER_BOSSES) {
        if (player.fame >= boss.fameRequired && !gameState.defeatedBosses.includes(boss.id)) {
            return boss;
        }
    }
    return null;
}

// 시너지 계산
function calculateSynergy(mainId, sub1Id, sub2Id) {
    const ids = [mainId, sub1Id, sub2Id];
    let totalSynergy = 50;

    for (const rule of SYNERGY_RULES) {
        const matches = rule.ingredients.every(ing => ids.includes(ing));
        if (matches) {
            totalSynergy += rule.bonus;
        }
    }

    return Math.max(0, Math.min(100, totalSynergy));
}

// 시너지 메시지 가져오기
function getSynergyMessages(mainId, sub1Id, sub2Id) {
    const ids = [mainId, sub1Id, sub2Id];
    const messages = [];

    for (const rule of SYNERGY_RULES) {
        const matches = rule.ingredients.every(ing => ids.includes(ing));
        if (matches) {
            messages.push(rule.message);
        }
    }

    return messages;
}

// 재료 찾기
function findIngredient(id) {
    for (const category of Object.values(SERVER_INGREDIENTS)) {
        for (const ing of category) {
            if (ing.id === id) {
                return ing;
            }
        }
    }
    return null;
}

// 티어 가져오기
function getTier(fame) {
    if (fame >= 450) return { name: '로열 마스터', class: 'tier-royal' };
    if (fame >= 300) return { name: '마스터', class: 'tier-master' };
    if (fame >= 180) return { name: '장인', class: 'tier-artisan' };
    if (fame >= 80) return { name: '챌린저', class: 'tier-challenger' };
    return { name: '언더독', class: 'tier-underdog' };
}

// 심사평 가져오기
function getJudgeComment(judge, score) {
    let category;
    if (score >= 80) category = 'excellent';
    else if (score >= 60) category = 'good';
    else if (score >= 40) category = 'average';
    else category = 'poor';

    const comments = JUDGE_COMMENTS[judge][category];
    return comments[Math.floor(Math.random() * comments.length)];
}
