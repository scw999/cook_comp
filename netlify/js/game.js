// ==================== 유틸리티 ====================

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

// ==================== 게임 시작 ====================

function startGame() {
    const inputs = document.querySelectorAll('#player-names input');
    if (inputs.length < 2) {
        alert('먼저 플레이어 수를 선택하세요!');
        return;
    }

    resetGameState();

    Array.from(inputs).forEach((input, i) => {
        const player = new Player(`player-${i + 1}`, input.value || `플레이어 ${i + 1}`);
        gameState.players.push(player);
    });

    document.getElementById('total-rounds').textContent = gameState.totalRounds;
    startRound();
}

function startRound() {
    showScreen('game-screen');
    document.getElementById('current-round').textContent = gameState.currentRound;
    startPlayerTurn();
}

function startPlayerTurn() {
    // 게임 화면으로 전환 (심사 화면에서 돌아올 때 필요)
    showScreen('game-screen');

    const player = getCurrentPlayer();
    document.getElementById('current-player-display').textContent = `${player.name}의 차례`;

    resetTurnState();

    const boss = checkForBoss(player);
    if (boss) {
        showBossIntro(boss);
        return;
    }

    updatePhaseIndicator();
    showIngredientPhase();
}

function updatePhaseIndicator() {
    for (let i = 1; i <= 3; i++) {
        const phase = document.getElementById(`phase-${i}`);
        phase.classList.remove('active', 'completed');
        if (i < gameState.phase) phase.classList.add('completed');
        else if (i === gameState.phase) phase.classList.add('active');
    }
}

// ==================== 1단계: 재료 선택 ====================

function showIngredientPhase() {
    document.querySelectorAll('.game-phase').forEach(p => p.style.display = 'none');
    document.getElementById('ingredient-phase').style.display = 'block';
    startIngredientMiniGame();
}

function showIngredientSelection() {
    const phaseEl = document.getElementById('ingredient-phase');

    phaseEl.innerHTML = `
        <h3 class="phase-title">재료를 선택하세요</h3>
        <p class="phase-subtitle">잡은 재료 중 주재료 1개와 부재료 2개를 선택하세요</p>
        <p class="bonus-score">미니게임 보너스: +${gameState.ingredientGameScore}점</p>

        <div class="selected-ingredients">
            <div class="selected-slot" id="main-slot"><span class="slot-icon">?</span><span class="slot-label">주재료</span></div>
            <div class="selected-slot" id="sub-slot-1"><span class="slot-icon">?</span><span class="slot-label">부재료 1</span></div>
            <div class="selected-slot" id="sub-slot-2"><span class="slot-icon">?</span><span class="slot-label">부재료 2</span></div>
        </div>

        <div class="synergy-display">
            <div>현재 시너지</div>
            <div class="synergy-score synergy-neutral" id="synergy-score">0</div>
            <div id="synergy-message" class="synergy-message"></div>
        </div>

        <div class="caught-selection" id="caught-selection"></div>

        <div class="center-buttons">
            <button class="btn btn-primary" id="confirm-ingredients" onclick="confirmIngredients()" disabled>선택 완료</button>
        </div>
    `;

    renderCaughtForSelection();

    let timeLimit = gameState.bossActive && gameState.currentBoss?.skillEffect === 'time' ? 21 : 30;
    startTimer(timeLimit, () => {
        if (!gameState.selectedIngredients.main) autoSelectFromCaught();
        confirmIngredients();
    });
}

function renderCaughtForSelection() {
    const container = document.getElementById('caught-selection');
    container.innerHTML = gameState.caughtIngredients.map(ing => {
        const isSelected = Object.values(gameState.selectedIngredients).some(s => s?.id === ing.id);
        return `
            <div class="ingredient-card ${isSelected ? 'selected' : ''}" onclick="selectCaughtIngredient('${ing.id}')">
                <div class="ingredient-icon">${ing.icon}</div>
                <div class="ingredient-name">${ing.name}</div>
                <div class="ingredient-stats">맛: ${ing.taste} | ${ing.attribute}</div>
            </div>
        `;
    }).join('');
}

function selectCaughtIngredient(id) {
    const ingredient = gameState.caughtIngredients.find(i => i.id === id);
    if (!ingredient) return;

    const slots = gameState.selectedIngredients;

    if (Object.values(slots).some(s => s?.id === id)) {
        if (slots.main?.id === id) slots.main = null;
        else if (slots.sub1?.id === id) slots.sub1 = null;
        else if (slots.sub2?.id === id) slots.sub2 = null;
    } else {
        if (!slots.main) slots.main = ingredient;
        else if (!slots.sub1) slots.sub1 = ingredient;
        else if (!slots.sub2) slots.sub2 = ingredient;
    }

    renderCaughtForSelection();
    updateSelectedSlots();
    updateSynergyDisplay();

    document.getElementById('confirm-ingredients').disabled = !(slots.main && slots.sub1 && slots.sub2);
}

function autoSelectFromCaught() {
    gameState.selectedIngredients = {
        main: gameState.caughtIngredients[0],
        sub1: gameState.caughtIngredients[1],
        sub2: gameState.caughtIngredients[2]
    };
}

function updateSelectedSlots() {
    const slots = gameState.selectedIngredients;

    ['main', 'sub1', 'sub2'].forEach((slotKey, index) => {
        const slotId = index === 0 ? 'main-slot' : `sub-slot-${index}`;
        const slot = document.getElementById(slotId);
        if (!slot) return;

        const ingredient = slots[slotKey];
        const labels = ['주재료', '부재료 1', '부재료 2'];

        if (ingredient) {
            slot.innerHTML = `<span class="slot-icon">${ingredient.icon}</span><span class="slot-label">${ingredient.name}</span>`;
            slot.classList.add('filled');
        } else {
            slot.innerHTML = `<span class="slot-icon">?</span><span class="slot-label">${labels[index]}</span>`;
            slot.classList.remove('filled');
        }
    });
}

function updateSynergyDisplay() {
    const slots = gameState.selectedIngredients;
    const scoreEl = document.getElementById('synergy-score');
    const msgEl = document.getElementById('synergy-message');

    if (!scoreEl || !msgEl) return;

    if (slots.main && slots.sub1 && slots.sub2) {
        const synergy = calculateSynergy(slots.main.id, slots.sub1.id, slots.sub2.id);
        const messages = getSynergyMessages(slots.main.id, slots.sub1.id, slots.sub2.id);
        const bonus = synergy - 50;

        scoreEl.textContent = (bonus >= 0 ? '+' : '') + bonus;
        scoreEl.className = 'synergy-score ' + (bonus > 0 ? 'synergy-positive' : bonus < 0 ? 'synergy-negative' : 'synergy-neutral');
        msgEl.textContent = messages.join(' ');
    } else {
        scoreEl.textContent = '0';
        scoreEl.className = 'synergy-score synergy-neutral';
        msgEl.textContent = '';
    }
}

function confirmIngredients() {
    stopTimer();
    gameState.cookingScore += gameState.ingredientGameScore;
    gameState.phase = 2;
    updatePhaseIndicator();
    showCookingPhase();
}

// ==================== 2단계: 조리 ====================

function showCookingPhase() {
    const miniGame = COOKING_MINI_GAMES[Math.floor(Math.random() * COOKING_MINI_GAMES.length)];
    gameState.cookingMiniGameType = miniGame.id;

    document.querySelectorAll('.game-phase').forEach(p => p.style.display = 'none');
    document.getElementById('cooking-phase').style.display = 'block';

    renderCookingMiniGame(miniGame);
}

function endCookingPhase() {
    gameState.isGaugeRunning = false;
    document.removeEventListener('keydown', handleCookingInput);

    if (Math.random() < 0.3) triggerRandomEvent();

    setTimeout(() => {
        gameState.phase = 3;
        updatePhaseIndicator();
        showPlatingPhase();
    }, 1000);
}

function triggerRandomEvent() {
    const events = [
        { title: '불 조절 실패!', desc: '불이 너무 세졌습니다.', value: -10, icon: '🔥' },
        { title: '요리의 영감!', desc: '좋은 아이디어!', value: 15, icon: '💡' },
        { title: '재료 낙하!', desc: '재료를 떨어뜨렸습니다!', value: -15, icon: '😱' },
        { title: '퍼펙트 타이밍!', desc: '완벽한 타이밍!', value: 20, icon: '⭐' },
        { title: '비밀 재료 발견!', desc: '숨겨진 재료!', value: 12, icon: '🎁' }
    ];

    const event = events[Math.floor(Math.random() * events.length)];

    document.getElementById('event-icon').textContent = event.icon;
    document.getElementById('event-title').textContent = event.title;
    document.getElementById('event-description').textContent = event.desc;
    document.getElementById('event-overlay').style.display = 'block';
    document.getElementById('event-popup').style.display = 'block';

    gameState.cookingScore = Math.max(0, gameState.cookingScore + event.value);
}

function closeEvent() {
    document.getElementById('event-overlay').style.display = 'none';
    document.getElementById('event-popup').style.display = 'none';
}

// ==================== 3단계: 플레이팅 ====================

function showPlatingPhase() {
    document.querySelectorAll('.game-phase').forEach(p => p.style.display = 'none');
    document.getElementById('plating-phase').style.display = 'block';

    setupEnhancedPlating();
    gameState.decorations = [];

    let timeLimit = gameState.bossActive && gameState.currentBoss?.skillEffect === 'time' ? 31 : 45;
    startTimer(timeLimit, confirmPlating);
}

function setupEnhancedPlating() {
    const phaseEl = document.getElementById('plating-phase');

    phaseEl.innerHTML = `
        <h3 class="phase-title">플레이팅 & 프레젠테이션</h3>

        <div class="plating-area">
            <div class="plate-canvas" id="plate-canvas">
                <div class="main-dish-draggable" id="main-dish"><span>${gameState.selectedIngredients.main?.icon || '🍽️'}</span></div>
                <div class="side-dish-area" id="side-dish-1"></div>
                <div class="side-dish-area" id="side-dish-2"></div>
            </div>

            <div class="plating-controls">
                <div class="theme-selector">
                    <h4>테마 선택</h4>
                    <div id="theme-options">
                        ${SERVER_THEMES.map(theme => `
                            <div class="theme-option" data-id="${theme.id}" onclick="selectTheme('${theme.id}')">
                                <span class="theme-icon">${theme.icon}</span>
                                <span class="theme-name">${theme.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="dish-placement">
                    <h4>요리 배치</h4>
                    <div class="placement-btns">
                        <button class="place-btn" onclick="placeSideDish(1)">부재료 1 배치</button>
                        <button class="place-btn" onclick="placeSideDish(2)">부재료 2 배치</button>
                        <button class="place-btn sauce-btn" onclick="addSauce()">소스 뿌리기</button>
                    </div>
                </div>

                <div class="decoration-section">
                    <h4>장식</h4>
                    <div class="decoration-palette">
                        ${SERVER_DECORATIONS.map(dec => `<div class="decoration-item" onclick="addDecoration('${dec}')">${dec}</div>`).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div class="center-buttons">
            <button class="btn btn-primary" onclick="confirmPlating()">요리 완성</button>
        </div>
    `;

    setupDraggableMainDish();
}

function setupDraggableMainDish() {
    const mainDish = document.getElementById('main-dish');
    const canvas = document.getElementById('plate-canvas');

    let isDragging = false, offsetX, offsetY;

    const handleStart = (e) => {
        isDragging = true;
        const rect = mainDish.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;
        mainDish.style.cursor = 'grabbing';
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const canvasRect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        let x = ((clientX - offsetX - canvasRect.left) / canvasRect.width) * 100;
        let y = ((clientY - offsetY - canvasRect.top) / canvasRect.height) * 100;

        x = Math.max(10, Math.min(80, x));
        y = Math.max(10, Math.min(80, y));

        mainDish.style.left = x + '%';
        mainDish.style.top = y + '%';
        gameState.mainDishPosition = { x, y };
    };

    const handleEnd = () => { isDragging = false; mainDish.style.cursor = 'grab'; };

    mainDish.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    mainDish.addEventListener('touchstart', handleStart);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
}

function placeSideDish(num) {
    const ingredient = num === 1 ? gameState.selectedIngredients.sub1 : gameState.selectedIngredients.sub2;
    if (!ingredient) return;

    const area = document.getElementById(`side-dish-${num}`);
    area.innerHTML = `<span class="side-icon">${ingredient.icon}</span>`;
    area.classList.add('placed');

    const mainPos = gameState.mainDishPosition;
    const angle = num === 1 ? -45 : 45;
    const distance = 25;

    area.style.left = Math.max(5, Math.min(85, mainPos.x + Math.cos(angle * Math.PI / 180) * distance)) + '%';
    area.style.top = Math.max(5, Math.min(85, mainPos.y + Math.sin(angle * Math.PI / 180) * distance)) + '%';
}

function addSauce() {
    const sauces = ['🟤', '🟡', '🔴', '🟢', '⚪'];
    const sauce = sauces[Math.floor(Math.random() * sauces.length)];

    const canvas = document.getElementById('plate-canvas');
    const drizzle = document.createElement('div');
    drizzle.className = 'sauce-dot';
    drizzle.textContent = sauce;
    drizzle.style.left = (20 + Math.random() * 60) + '%';
    drizzle.style.top = (20 + Math.random() * 60) + '%';
    drizzle.style.fontSize = (0.5 + Math.random() * 0.5) + 'em';

    canvas.appendChild(drizzle);
    gameState.decorations.push('sauce');
}

function selectTheme(themeId) {
    gameState.selectedTheme = themeId;
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.id === themeId);
    });
}

function addDecoration(emoji) {
    if (gameState.decorations.length >= 8) return;

    const canvas = document.getElementById('plate-canvas');
    const decoration = document.createElement('div');
    decoration.className = 'plate-decoration';
    decoration.textContent = emoji;
    decoration.style.left = (15 + Math.random() * 70) + '%';
    decoration.style.top = (15 + Math.random() * 70) + '%';

    canvas.appendChild(decoration);
    gameState.decorations.push(emoji);
}

function confirmPlating() {
    stopTimer();
    showJudgingScreen();
}

// ==================== 심사 ====================

function showJudgingScreen() {
    showScreen('judging-screen');

    const slots = gameState.selectedIngredients;
    const synergy = calculateSynergy(slots.main.id, slots.sub1.id, slots.sub2.id);
    const platingHarmony = Math.min(100, 50 + gameState.decorations.length * 10);

    let themeMatch = 50;
    if (gameState.selectedTheme) {
        const theme = SERVER_THEMES.find(t => t.id === gameState.selectedTheme);
        if (theme) {
            const selectedIds = [slots.main.id, slots.sub1.id, slots.sub2.id];
            const matches = selectedIds.filter(id => theme.matchIngredients.includes(id)).length;
            themeMatch = 50 + matches * 15;
        }
    }

    const judgeAScore = Math.round((gameState.cookingScore * 0.5) + (synergy * 0.3) + (gameState.cookingScore * 0.2));
    const judgeBScore = Math.round((platingHarmony * 0.4) + (themeMatch * 0.4) + (synergy * 0.2));
    const totalScore = judgeAScore + judgeBScore;

    let bossScore = null, bossDefeated = false;
    if (gameState.bossActive && gameState.currentBoss) {
        bossScore = 120 + Math.floor(Math.random() * 30);
        bossDefeated = totalScore > bossScore;
        if (bossDefeated) gameState.defeatedBosses.push(gameState.currentBoss.id);
    }

    getCurrentPlayer().addRoundScore(totalScore);

    document.getElementById('final-dish-emoji').textContent = slots.main?.icon || '🍽️';

    const judgeAComment = getJudgeComment('A', judgeAScore);
    const judgeBComment = getJudgeComment('B', judgeBScore);

    setTimeout(() => {
        document.getElementById('judge-a-score').textContent = judgeAScore;
        document.getElementById('judge-a-breakdown').innerHTML = `
            <div class="judge-comment">"${judgeAComment}"</div>
            <div><span>조리:</span><span>${Math.round(gameState.cookingScore * 0.5)}</span></div>
            <div><span>시너지:</span><span>${Math.round(synergy * 0.3)}</span></div>
            <div><span>대처:</span><span>${Math.round(gameState.cookingScore * 0.2)}</span></div>
        `;
    }, 500);

    setTimeout(() => {
        document.getElementById('judge-b-score').textContent = judgeBScore;
        document.getElementById('judge-b-breakdown').innerHTML = `
            <div class="judge-comment">"${judgeBComment}"</div>
            <div><span>플레이팅:</span><span>${Math.round(platingHarmony * 0.4)}</span></div>
            <div><span>테마:</span><span>${Math.round(themeMatch * 0.4)}</span></div>
            <div><span>시너지:</span><span>${Math.round(synergy * 0.2)}</span></div>
        `;
    }, 1000);

    setTimeout(() => {
        let scoreText = totalScore.toString();
        if (bossScore !== null) {
            scoreText = bossDefeated ? `${totalScore} - 승리! (보스: ${bossScore})` : `${totalScore} - 패배... (보스: ${bossScore})`;
        }
        document.getElementById('total-score').textContent = scoreText;
    }, 1500);
}

// ==================== 다음 턴 ====================

function nextTurn() {
    nextPlayer();

    if (isGameOver()) {
        showVictoryScreen();
        return;
    }

    if (gameState.currentPlayerIndex === 0) {
        showRoundResults();
        return;
    }

    startPlayerTurn();
}

function showRoundResults() {
    showScreen('round-results');

    const scoreboard = document.getElementById('round-scoreboard');
    const sortedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore);

    scoreboard.innerHTML = sortedPlayers.map((player, index) => {
        const tier = getTier(player.fame);
        const roundScore = player.roundScores[gameState.currentRound - 2] || 0;

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
    startRound();
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

// ==================== 승리 ====================

function showVictoryScreen() {
    showScreen('victory-screen');

    const sortedPlayers = [...gameState.players].sort((a, b) => b.totalScore - a.totalScore);
    const winner = sortedPlayers[0];

    document.getElementById('winner-name').textContent = winner.name;

    const standings = document.getElementById('final-standings');
    const medals = ['🥇', '🥈', '🥉', ''];

    standings.innerHTML = sortedPlayers.map((player, index) => {
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
    if (!timerEl) return;

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
