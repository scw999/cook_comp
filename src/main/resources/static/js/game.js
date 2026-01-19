// ==================== 게임 상태 ====================

let gameState = {
    gameId: null,
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
    currentCategory: 'meat'
};

// ==================== 유틸리티 함수 ====================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function setPlayerCount(count) {
    document.querySelectorAll('.player-count-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');

    const container = document.getElementById('player-names');
    container.innerHTML = '';

    for (let i = 1; i <= count; i++) {
        container.innerHTML += `
            <div class="player-input">
                <label>플레이어 ${i}</label>
                <input type="text" id="player-name-${i}" placeholder="이름 입력" value="플레이어 ${i}">
            </div>
        `;
    }
}

// ==================== API 호출 ====================

async function apiCall(url, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    return response.json();
}

// ==================== 게임 시작 ====================

async function startGame() {
    const inputs = document.querySelectorAll('#player-names input');
    if (inputs.length < 2) {
        alert('먼저 플레이어 수를 선택하세요!');
        return;
    }

    const playerNames = Array.from(inputs).map(input => input.value || '');

    try {
        const game = await apiCall('/api/game/create', 'POST', { players: playerNames });
        gameState.gameId = game.gameId;
        gameState.players = game.players;
        gameState.currentRound = 1;
        gameState.currentPlayerIndex = 0;

        document.getElementById('total-rounds').textContent = gameState.totalRounds;

        startRound();
    } catch (error) {
        console.error('게임 생성 실패:', error);
        alert('게임을 시작할 수 없습니다.');
    }
}

function startRound() {
    showScreen('game-screen');
    document.getElementById('current-round').textContent = gameState.currentRound;
    startPlayerTurn();
}

function startPlayerTurn() {
    const player = gameState.players[gameState.currentPlayerIndex];
    document.getElementById('current-player-display').textContent = `${player.name}의 차례`;

    gameState.phase = 1;
    gameState.selectedIngredients = { main: null, sub1: null, sub2: null };
    gameState.cookingScore = 0;
    gameState.selectedTheme = null;
    gameState.decorations = [];
    gameState.cookingAttempts = 0;
    gameState.comboCount = 0;
    gameState.bossActive = false;
    gameState.currentBoss = null;

    // 보스전 체크 (클라이언트 측에서도 체크)
    const boss = checkForBoss(player);
    if (boss) {
        showBossIntro(boss);
        return;
    }

    updatePhaseIndicator();
    showIngredientPhase();
}

function checkForBoss(player) {
    const defeatedBosses = gameState.defeatedBosses || [];
    for (const boss of SERVER_BOSSES) {
        if (player.fame >= boss.fameRequired && !defeatedBosses.includes(boss.id)) {
            return boss;
        }
    }
    return null;
}

function updatePhaseIndicator() {
    for (let i = 1; i <= 3; i++) {
        const phase = document.getElementById(`phase-${i}`);
        phase.classList.remove('active', 'completed');
        if (i < gameState.phase) {
            phase.classList.add('completed');
        } else if (i === gameState.phase) {
            phase.classList.add('active');
        }
    }
}

// ==================== 1단계: 재료 선택 ====================

function showIngredientPhase() {
    document.querySelectorAll('.game-phase').forEach(p => p.style.display = 'none');
    document.getElementById('ingredient-phase').style.display = 'block';

    // 첫 번째 탭 활성화
    const firstTab = document.querySelector('.category-tab');
    if (firstTab) {
        firstTab.classList.add('active');
        renderIngredients('meat');
    }

    updateSelectedSlots();
    updateSynergyDisplay();

    let timeLimit = 60;
    if (gameState.bossActive && gameState.currentBoss?.skillEffect === 'time') {
        timeLimit = Math.floor(timeLimit * 0.7);
    }

    startTimer(timeLimit, () => {
        if (gameState.selectedIngredients.main) {
            confirmIngredients();
        } else {
            autoSelectIngredients();
            confirmIngredients();
        }
    });
}

function renderIngredients(category) {
    gameState.currentCategory = category;

    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === category) {
            tab.classList.add('active');
        }
    });

    const grid = document.getElementById('ingredient-grid');
    const ingredients = SERVER_INGREDIENTS[category] || [];

    grid.innerHTML = ingredients.map(ing => {
        const isSelected = Object.values(gameState.selectedIngredients).some(s => s?.id === ing.id);
        const isDisabled = checkBossDowngrade(ing);

        return `
            <div class="ingredient-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                 onclick="selectIngredient('${ing.id}', '${category}')">
                <div class="ingredient-icon">${ing.icon}</div>
                <div class="ingredient-name">${ing.name}</div>
                <div class="ingredient-stats">맛: ${ing.taste} | ${ing.attribute}</div>
            </div>
        `;
    }).join('');
}

function checkBossDowngrade(ingredient) {
    if (gameState.bossActive && gameState.currentBoss?.skillEffect === 'downgrade') {
        return ingredient.taste >= 80 && Math.random() < 0.3;
    }
    return false;
}

function selectIngredient(id, category) {
    const ingredients = SERVER_INGREDIENTS[category] || [];
    const ingredient = ingredients.find(i => i.id === id);

    if (!ingredient || checkBossDowngrade(ingredient)) return;

    const slots = gameState.selectedIngredients;
    if (Object.values(slots).some(s => s?.id === id)) {
        if (slots.main?.id === id) slots.main = null;
        else if (slots.sub1?.id === id) slots.sub1 = null;
        else if (slots.sub2?.id === id) slots.sub2 = null;
    } else {
        if (!slots.main) {
            slots.main = ingredient;
        } else if (!slots.sub1) {
            slots.sub1 = ingredient;
        } else if (!slots.sub2) {
            slots.sub2 = ingredient;
        }
    }

    renderIngredients(category);
    updateSelectedSlots();
    updateSynergyDisplay();

    const allFilled = slots.main && slots.sub1 && slots.sub2;
    document.getElementById('confirm-ingredients').disabled = !allFilled;
}

function updateSelectedSlots() {
    const slots = gameState.selectedIngredients;

    ['main', 'sub1', 'sub2'].forEach((slotKey, index) => {
        const slotId = index === 0 ? 'main-slot' : `sub-slot-${index}`;
        const slot = document.getElementById(slotId);
        const ingredient = slots[slotKey];

        if (ingredient) {
            slot.innerHTML = `
                <span class="slot-icon">${ingredient.icon}</span>
                <span class="slot-label">${ingredient.name}</span>
            `;
            slot.classList.add('filled');
        } else {
            const labels = ['주재료', '부재료 1', '부재료 2'];
            slot.innerHTML = `
                <span class="slot-icon">?</span>
                <span class="slot-label">${labels[index]}</span>
            `;
            slot.classList.remove('filled');
        }
    });
}

async function updateSynergyDisplay() {
    const slots = gameState.selectedIngredients;
    const mainId = slots.main?.id;
    const sub1Id = slots.sub1?.id;
    const sub2Id = slots.sub2?.id;

    if (mainId && sub1Id && sub2Id) {
        try {
            const result = await apiCall(`/api/game/${gameState.gameId || 'temp'}/synergy`, 'POST', {
                main: mainId, sub1: sub1Id, sub2: sub2Id
            });

            const bonus = result.synergy - 50;
            const scoreEl = document.getElementById('synergy-score');
            scoreEl.textContent = (bonus >= 0 ? '+' : '') + bonus;
            scoreEl.className = 'synergy-score ' + (bonus > 0 ? 'synergy-positive' : bonus < 0 ? 'synergy-negative' : 'synergy-neutral');
            document.getElementById('synergy-message').textContent = result.messages.join(' ');
        } catch (e) {
            // 로컬 계산 폴백
            document.getElementById('synergy-score').textContent = '0';
            document.getElementById('synergy-message').textContent = '';
        }
    } else {
        document.getElementById('synergy-score').textContent = '0';
        document.getElementById('synergy-score').className = 'synergy-score synergy-neutral';
        document.getElementById('synergy-message').textContent = '';
    }
}

function autoSelectIngredients() {
    const allIngredients = Object.values(SERVER_INGREDIENTS).flat();
    const shuffled = allIngredients.sort(() => Math.random() - 0.5);

    gameState.selectedIngredients = {
        main: shuffled[0],
        sub1: shuffled[1],
        sub2: shuffled[2]
    };
}

async function confirmIngredients() {
    stopTimer();

    if (gameState.gameId) {
        try {
            await apiCall(`/api/game/${gameState.gameId}/ingredients`, 'POST', {
                main: gameState.selectedIngredients.main.id,
                sub1: gameState.selectedIngredients.sub1.id,
                sub2: gameState.selectedIngredients.sub2.id
            });
        } catch (e) {
            console.error('재료 선택 저장 실패:', e);
        }
    }

    gameState.phase = 2;
    updatePhaseIndicator();
    showCookingPhase();
}

// ==================== 2단계: 조리 미니게임 ====================

function showCookingPhase() {
    document.querySelectorAll('.game-phase').forEach(p => p.style.display = 'none');
    document.getElementById('cooking-phase').style.display = 'block';

    gameState.cookingScore = 0;
    gameState.cookingAttempts = 0;
    gameState.comboCount = 0;

    gameState.gaugeSpeed = 3;
    if (gameState.bossActive && gameState.currentBoss?.skillEffect === 'difficulty') {
        gameState.gaugeSpeed = 4.5;
    }

    document.getElementById('cooking-score').textContent = '0';
    document.getElementById('combo-count').textContent = '0';
    document.getElementById('cooking-attempts').textContent = `시도: 0/${gameState.maxCookingAttempts}`;

    setNewTarget();
    startGauge();

    document.addEventListener('keydown', handleCookingInput);
}

function setNewTarget() {
    const targetEl = document.getElementById('gauge-target');
    const targetWidth = 15 + Math.random() * 10;
    const targetLeft = 10 + Math.random() * (75 - targetWidth);

    targetEl.style.width = targetWidth + '%';
    targetEl.style.left = targetLeft + '%';

    gameState.targetZone = {
        left: targetLeft,
        right: targetLeft + targetWidth
    };
}

function startGauge() {
    gameState.gaugePosition = 0;
    gameState.gaugeDirection = 1;
    gameState.isGaugeRunning = true;

    const indicator = document.getElementById('gauge-indicator');

    function updateGauge() {
        if (!gameState.isGaugeRunning) return;

        gameState.gaugePosition += gameState.gaugeSpeed * gameState.gaugeDirection;

        if (gameState.gaugePosition >= 100) {
            gameState.gaugePosition = 100;
            gameState.gaugeDirection = -1;
        } else if (gameState.gaugePosition <= 0) {
            gameState.gaugePosition = 0;
            gameState.gaugeDirection = 1;
        }

        indicator.style.left = gameState.gaugePosition + '%';

        requestAnimationFrame(updateGauge);
    }

    requestAnimationFrame(updateGauge);
}

function handleCookingInput(e) {
    if (e.code === 'Space' && gameState.phase === 2 && gameState.isGaugeRunning) {
        e.preventDefault();
        checkCookingHit();
    }
}

function checkCookingHit() {
    gameState.cookingAttempts++;

    const pos = gameState.gaugePosition;
    const target = gameState.targetZone;

    let points = 0;

    if (pos >= target.left && pos <= target.right) {
        const center = (target.left + target.right) / 2;
        const distance = Math.abs(pos - center);
        const maxDistance = (target.right - target.left) / 2;
        const precision = 1 - (distance / maxDistance);

        points = Math.floor(10 + precision * 10);
        gameState.comboCount++;

        if (gameState.comboCount >= 3) {
            points += gameState.comboCount * 2;
        }

        document.getElementById('cooking-emoji').textContent = '🔥';
    } else {
        gameState.comboCount = 0;
        document.getElementById('cooking-emoji').textContent = '😅';
        document.getElementById('cooking-emoji').classList.add('shake');
        setTimeout(() => document.getElementById('cooking-emoji').classList.remove('shake'), 500);
    }

    gameState.cookingScore += points;
    document.getElementById('cooking-score').textContent = gameState.cookingScore;
    document.getElementById('combo-count').textContent = gameState.comboCount;
    document.getElementById('cooking-attempts').textContent = `시도: ${gameState.cookingAttempts}/${gameState.maxCookingAttempts}`;

    if (gameState.cookingAttempts >= gameState.maxCookingAttempts) {
        endCookingPhase();
    } else {
        setNewTarget();
    }
}

async function endCookingPhase() {
    gameState.isGaugeRunning = false;
    document.removeEventListener('keydown', handleCookingInput);

    // 서버에 조리 점수 전송
    if (gameState.gameId) {
        try {
            await apiCall(`/api/game/${gameState.gameId}/cooking`, 'POST', {
                score: gameState.cookingScore
            });
        } catch (e) {
            console.error('조리 점수 저장 실패:', e);
        }
    }

    // 랜덤 이벤트
    if (Math.random() < 0.3) {
        triggerRandomEvent();
    }

    setTimeout(() => {
        gameState.phase = 3;
        updatePhaseIndicator();
        showPlatingPhase();
    }, 1000);
}

function triggerRandomEvent() {
    const events = [
        { title: '불 조절 실패!', desc: '불이 너무 세져서 다시 조절해야 합니다.', value: -10, icon: '🔥' },
        { title: '요리의 영감!', desc: '갑자기 좋은 아이디어가 떠올랐습니다!', value: 15, icon: '💡' },
        { title: '재료 낙하!', desc: '재료를 떨어뜨렸습니다!', value: -15, icon: '😱' },
        { title: '퍼펙트 타이밍!', desc: '완벽한 타이밍으로 요리했습니다!', value: 20, icon: '⭐' },
        { title: '비밀 재료 발견!', desc: '숨겨진 재료를 발견했습니다!', value: 12, icon: '🎁' }
    ];

    const event = events[Math.floor(Math.random() * events.length)];

    document.getElementById('event-icon').textContent = event.icon;
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-description').textContent = event.desc;

    document.getElementById('event-overlay').style.display = 'block';
    document.getElementById('event-popup').style.display = 'block';

    gameState.cookingScore = Math.max(0, gameState.cookingScore + event.value);
    document.getElementById('cooking-score').textContent = gameState.cookingScore;
}

function closeEvent() {
    document.getElementById('event-overlay').style.display = 'none';
    document.getElementById('event-popup').style.display = 'none';
}

// ==================== 3단계: 플레이팅 ====================

function showPlatingPhase() {
    document.querySelectorAll('.game-phase').forEach(p => p.style.display = 'none');
    document.getElementById('plating-phase').style.display = 'block';

    setupPlateCanvas();
    gameState.decorations = [];

    let timeLimit = 45;
    if (gameState.bossActive && gameState.currentBoss?.skillEffect === 'time') {
        timeLimit = Math.floor(timeLimit * 0.7);
    }

    startTimer(timeLimit, confirmPlating);
}

function selectTheme(themeId) {
    gameState.selectedTheme = themeId;

    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.id === themeId) {
            opt.classList.add('selected');
        }
    });
}

function setupPlateCanvas() {
    const canvas = document.getElementById('plate-canvas');
    const mainIngredient = gameState.selectedIngredients.main;

    canvas.innerHTML = `<span style="font-size: 4em;">${mainIngredient?.icon || '🍽️'}</span>`;
}

function addDecoration(emoji) {
    if (gameState.decorations.length >= 5) return;

    const canvas = document.getElementById('plate-canvas');
    const decoration = document.createElement('div');
    decoration.className = 'plate-decoration';
    decoration.textContent = emoji;
    decoration.style.left = (20 + Math.random() * 60) + '%';
    decoration.style.top = (20 + Math.random() * 60) + '%';

    canvas.appendChild(decoration);
    gameState.decorations.push(emoji);
}

async function confirmPlating() {
    stopTimer();

    try {
        const result = await apiCall(`/api/game/${gameState.gameId}/plating`, 'POST', {
            theme: gameState.selectedTheme,
            decorations: gameState.decorations
        });

        showJudgingScreen(result);
    } catch (e) {
        console.error('플레이팅 저장 실패:', e);
        // 로컬 계산 폴백
        showJudgingScreenLocal();
    }
}

function showJudgingScreen(result) {
    showScreen('judging-screen');

    const mainIng = gameState.selectedIngredients.main;
    document.getElementById('final-dish-emoji').textContent = mainIng?.icon || '🍽️';

    setTimeout(() => {
        document.getElementById('judge-a-score').textContent = result.judgeAScore;
        document.getElementById('judge-a-breakdown').innerHTML = `
            <div><span>조리:</span><span>${result.judgeABreakdown.cooking}</span></div>
            <div><span>시너지:</span><span>${result.judgeABreakdown.synergy}</span></div>
            <div><span>대처:</span><span>${result.judgeABreakdown.handling}</span></div>
        `;
    }, 500);

    setTimeout(() => {
        document.getElementById('judge-b-score').textContent = result.judgeBScore;
        document.getElementById('judge-b-breakdown').innerHTML = `
            <div><span>플레이팅:</span><span>${result.judgeBBreakdown.plating}</span></div>
            <div><span>테마:</span><span>${result.judgeBBreakdown.theme}</span></div>
            <div><span>시너지:</span><span>${result.judgeBBreakdown.synergy}</span></div>
        `;
    }, 1000);

    setTimeout(() => {
        let scoreText = result.totalScore.toString();
        if (result.bossScore !== null) {
            scoreText = result.bossDefeated ?
                `${result.totalScore} - 승리! (보스: ${result.bossScore})` :
                `${result.totalScore} - 패배... (보스: ${result.bossScore})`;
        }
        document.getElementById('total-score').textContent = scoreText;

        // 플레이어 상태 업데이트
        if (result.player) {
            gameState.players[gameState.currentPlayerIndex] = result.player;
        }
    }, 1500);
}

function showJudgingScreenLocal() {
    // 로컬 계산 (서버 연결 실패 시)
    const result = {
        judgeAScore: Math.floor(gameState.cookingScore * 0.7),
        judgeBScore: Math.floor(50 + gameState.decorations.length * 10),
        totalScore: 0,
        judgeABreakdown: { cooking: 0, synergy: 0, handling: 0 },
        judgeBBreakdown: { plating: 0, theme: 0, synergy: 0 }
    };
    result.totalScore = result.judgeAScore + result.judgeBScore;
    showJudgingScreen(result);
}

// ==================== 다음 턴 ====================

async function nextTurn() {
    try {
        const result = await apiCall(`/api/game/${gameState.gameId}/next`, 'POST');

        if (result.gameOver) {
            showVictoryScreen();
            return;
        }

        if (result.roundOver) {
            gameState.currentRound++;
            showRoundResults();
            return;
        }

        gameState.currentPlayerIndex++;
        gameState.players = result.game.players;

        if (result.boss) {
            showBossIntro(result.boss);
        } else {
            startPlayerTurn();
        }
    } catch (e) {
        console.error('다음 턴 처리 실패:', e);
        // 로컬 처리
        gameState.currentPlayerIndex++;
        if (gameState.currentPlayerIndex >= gameState.players.length) {
            gameState.currentPlayerIndex = 0;
            gameState.currentRound++;
            if (gameState.currentRound > gameState.totalRounds) {
                showVictoryScreen();
            } else {
                showRoundResults();
            }
        } else {
            startPlayerTurn();
        }
    }
}

function showRoundResults() {
    showScreen('round-results');

    const scoreboard = document.getElementById('round-scoreboard');
    const sortedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore);

    scoreboard.innerHTML = sortedPlayers.map((player, index) => {
        const tier = getTier(player.fame);
        const roundScore = player.roundScores?.[gameState.currentRound - 1] || 0;

        return `
            <div class="scoreboard-row">
                <div class="player-rank">#${index + 1}</div>
                <div class="player-info">
                    <div><strong>${player.name}</strong></div>
                    <div class="player-fame">명성: ${player.fame} | 라운드 점수: ${roundScore}</div>
                </div>
                <div class="player-tier ${tier.class}">${tier.name}</div>
                <div style="font-size: 1.5em; font-weight: bold;">${player.totalScore}</div>
            </div>
        `;
    }).join('');
}

function nextRound() {
    gameState.currentPlayerIndex = 0;
    startRound();
}

function getTier(fame) {
    if (fame >= 450) return { name: '로열 마스터', class: 'tier-royal' };
    if (fame >= 300) return { name: '마스터', class: 'tier-master' };
    if (fame >= 180) return { name: '장인', class: 'tier-artisan' };
    if (fame >= 80) return { name: '챌린저', class: 'tier-challenger' };
    return { name: '언더독', class: 'tier-underdog' };
}

// ==================== 보스전 ====================

function showBossIntro(boss) {
    gameState.currentBoss = boss;
    gameState.bossActive = true;

    showScreen('boss-screen');

    document.getElementById('boss-portrait').textContent = boss.icon;
    document.getElementById('boss-name').textContent = boss.name;
    document.getElementById('boss-title').textContent = boss.title;
    document.getElementById('boss-description').textContent = boss.description;
    document.getElementById('boss-skill-name').textContent = boss.skillName;
    document.getElementById('boss-skill-desc').textContent = boss.skillDesc;
}

function startBossBattle() {
    showScreen('game-screen');
    updatePhaseIndicator();
    showIngredientPhase();
}

// ==================== 승리 화면 ====================

async function showVictoryScreen() {
    showScreen('victory-screen');

    try {
        const result = await apiCall(`/api/game/${gameState.gameId}/results`);
        displayVictory(result.players, result.winner);
    } catch (e) {
        // 로컬 처리
        const sortedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore);
        displayVictory(sortedPlayers, sortedPlayers[0]);
    }
}

function displayVictory(players, winner) {
    document.getElementById('winner-name').textContent = winner.name;

    const standings = document.getElementById('final-standings');
    const medals = ['🥇', '🥈', '🥉', ''];

    standings.innerHTML = players.map((player, index) => {
        const tier = getTier(player.fame);

        return `
            <div class="scoreboard-row ${index === 0 ? 'current' : ''}">
                <div class="player-rank">${medals[index] || (index + 1)}</div>
                <div class="player-info">
                    <div><strong>${player.name}</strong></div>
                    <div class="player-fame">명성: ${player.fame}</div>
                </div>
                <div class="player-tier ${tier.class}">${tier.name}</div>
                <div style="font-size: 1.5em; font-weight: bold;">${player.totalScore}</div>
            </div>
        `;
    }).join('');
}

// ==================== 타이머 ====================

function startTimer(seconds, callback) {
    gameState.timeRemaining = seconds;
    updateTimerDisplay();

    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        updateTimerDisplay();

        if (gameState.timeRemaining <= 0) {
            stopTimer();
            callback();
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    timerEl.textContent = gameState.timeRemaining;

    if (gameState.timeRemaining <= 10) {
        timerEl.style.color = '#ff6b6b';
        timerEl.classList.add('pulse');
    } else {
        timerEl.style.color = '#ffd700';
        timerEl.classList.remove('pulse');
    }
}

// ==================== 초기화 ====================

document.addEventListener('DOMContentLoaded', () => {
    setPlayerCount(2);
    document.querySelector('.player-count-btn')?.classList.add('selected');
});
