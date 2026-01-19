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
    currentCategory: 'meat',
    defeatedBosses: [],
    // 재료 수집 미니게임
    ingredientGameActive: false,
    caughtIngredients: [],
    fallingIngredients: [],
    ingredientGameScore: 0,
    // 조리 미니게임 타입
    cookingMiniGameType: null,
    miniGameData: {},
    // 플레이팅 메인 요리 위치
    mainDishPosition: { x: 50, y: 50 }
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
        gameState.defeatedBosses = [];

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
    gameState.ingredientGameScore = 0;
    gameState.caughtIngredients = [];
    gameState.mainDishPosition = { x: 50, y: 50 };

    // 보스전 체크
    const boss = checkForBoss(player);
    if (boss) {
        showBossIntro(boss);
        return;
    }

    updatePhaseIndicator();
    showIngredientPhase();
}

function checkForBoss(player) {
    for (const boss of SERVER_BOSSES) {
        if (player.fame >= boss.fameRequired && !gameState.defeatedBosses.includes(boss.id)) {
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

// ==================== 1단계: 재료 수집 미니게임 ====================

function showIngredientPhase() {
    document.querySelectorAll('.game-phase').forEach(p => p.style.display = 'none');
    document.getElementById('ingredient-phase').style.display = 'block';

    // 미니게임 시작
    startIngredientMiniGame();
}

function startIngredientMiniGame() {
    const phaseEl = document.getElementById('ingredient-phase');

    // 미니게임 UI 생성
    phaseEl.innerHTML = `
        <h3 class="phase-title">재료를 잡으세요!</h3>
        <p class="phase-subtitle">떨어지는 재료를 터치/클릭해서 잡으세요!</p>

        <div class="ingredient-catch-game" id="ingredient-catch-area">
            <div class="catch-score">잡은 재료: <span id="catch-count">0</span>/6</div>
            <div class="catch-timer">남은 시간: <span id="catch-timer">15</span>초</div>
            <div class="falling-area" id="falling-area"></div>
        </div>

        <div class="caught-ingredients" id="caught-ingredients"></div>
    `;

    gameState.ingredientGameActive = true;
    gameState.caughtIngredients = [];
    gameState.ingredientGameScore = 0;

    startFallingIngredients();
    startIngredientTimer(15);
}

function startFallingIngredients() {
    const area = document.getElementById('falling-area');
    if (!area) return;

    const allIngredients = Object.values(SERVER_INGREDIENTS).flat();

    function spawnIngredient() {
        if (!gameState.ingredientGameActive) return;

        const ingredient = allIngredients[Math.floor(Math.random() * allIngredients.length)];
        const item = document.createElement('div');
        item.className = 'falling-ingredient';
        item.innerHTML = `<span class="fall-icon">${ingredient.icon}</span>`;
        item.style.left = (10 + Math.random() * 80) + '%';
        item.dataset.id = ingredient.id;
        item.dataset.category = ingredient.category || 'etc';

        // 터치/클릭 이벤트
        item.addEventListener('click', (e) => catchIngredient(e, ingredient));
        item.addEventListener('touchstart', (e) => {
            e.preventDefault();
            catchIngredient(e, ingredient);
        });

        area.appendChild(item);

        // 애니메이션 후 제거
        setTimeout(() => {
            if (item.parentNode) {
                item.classList.add('missed');
                setTimeout(() => item.remove(), 300);
            }
        }, 2500);

        // 다음 재료 스폰
        if (gameState.ingredientGameActive) {
            setTimeout(spawnIngredient, 600 + Math.random() * 400);
        }
    }

    spawnIngredient();
}

function catchIngredient(e, ingredient) {
    if (gameState.caughtIngredients.length >= 6) return;

    const target = e.target.closest('.falling-ingredient');
    if (!target || target.classList.contains('caught')) return;

    target.classList.add('caught');
    gameState.caughtIngredients.push(ingredient);
    gameState.ingredientGameScore += 10;

    // 잡은 재료 표시
    updateCaughtDisplay();
    document.getElementById('catch-count').textContent = gameState.caughtIngredients.length;

    // 효과음 대신 시각 효과
    target.innerHTML = `<span class="fall-icon">✨</span>`;
    setTimeout(() => target.remove(), 200);

    // 6개 다 잡으면 종료
    if (gameState.caughtIngredients.length >= 6) {
        endIngredientMiniGame();
    }
}

function updateCaughtDisplay() {
    const container = document.getElementById('caught-ingredients');
    if (!container) return;

    container.innerHTML = gameState.caughtIngredients.map(ing => `
        <div class="caught-item">
            <span>${ing.icon}</span>
            <span class="caught-name">${ing.name}</span>
        </div>
    `).join('');
}

function startIngredientTimer(seconds) {
    let remaining = seconds;
    const timerEl = document.getElementById('catch-timer');

    const interval = setInterval(() => {
        remaining--;
        if (timerEl) timerEl.textContent = remaining;

        if (remaining <= 0 || !gameState.ingredientGameActive) {
            clearInterval(interval);
            if (gameState.ingredientGameActive) {
                endIngredientMiniGame();
            }
        }
    }, 1000);
}

function endIngredientMiniGame() {
    gameState.ingredientGameActive = false;

    // 부족한 재료 자동 채우기
    const allIngredients = Object.values(SERVER_INGREDIENTS).flat();
    while (gameState.caughtIngredients.length < 6) {
        const randomIng = allIngredients[Math.floor(Math.random() * allIngredients.length)];
        gameState.caughtIngredients.push(randomIng);
    }

    // 재료 선택 화면으로 전환
    showIngredientSelection();
}

function showIngredientSelection() {
    const phaseEl = document.getElementById('ingredient-phase');

    phaseEl.innerHTML = `
        <h3 class="phase-title">재료를 선택하세요</h3>
        <p class="phase-subtitle">잡은 재료 중 주재료 1개와 부재료 2개를 선택하세요</p>
        <p class="bonus-score">미니게임 보너스: +${gameState.ingredientGameScore}점</p>

        <div class="selected-ingredients">
            <div class="selected-slot" id="main-slot">
                <span class="slot-icon">?</span>
                <span class="slot-label">주재료</span>
            </div>
            <div class="selected-slot" id="sub-slot-1">
                <span class="slot-icon">?</span>
                <span class="slot-label">부재료 1</span>
            </div>
            <div class="selected-slot" id="sub-slot-2">
                <span class="slot-icon">?</span>
                <span class="slot-label">부재료 2</span>
            </div>
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

    let timeLimit = 30;
    if (gameState.bossActive && gameState.currentBoss?.skillEffect === 'time') {
        timeLimit = Math.floor(timeLimit * 0.7);
    }

    startTimer(timeLimit, () => {
        if (gameState.selectedIngredients.main) {
            confirmIngredients();
        } else {
            autoSelectFromCaught();
            confirmIngredients();
        }
    });
}

function renderCaughtForSelection() {
    const container = document.getElementById('caught-selection');

    container.innerHTML = gameState.caughtIngredients.map(ing => {
        const isSelected = Object.values(gameState.selectedIngredients).some(s => s?.id === ing.id);
        return `
            <div class="ingredient-card ${isSelected ? 'selected' : ''}"
                 onclick="selectCaughtIngredient('${ing.id}')">
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

    // 이미 선택된 경우 해제
    if (Object.values(slots).some(s => s?.id === id)) {
        if (slots.main?.id === id) slots.main = null;
        else if (slots.sub1?.id === id) slots.sub1 = null;
        else if (slots.sub2?.id === id) slots.sub2 = null;
    } else {
        // 새로 선택
        if (!slots.main) {
            slots.main = ingredient;
        } else if (!slots.sub1) {
            slots.sub1 = ingredient;
        } else if (!slots.sub2) {
            slots.sub2 = ingredient;
        }
    }

    renderCaughtForSelection();
    updateSelectedSlots();
    updateSynergyDisplay();

    const allFilled = slots.main && slots.sub1 && slots.sub2;
    document.getElementById('confirm-ingredients').disabled = !allFilled;
}

function autoSelectFromCaught() {
    const caught = gameState.caughtIngredients;
    gameState.selectedIngredients = {
        main: caught[0],
        sub1: caught[1],
        sub2: caught[2]
    };
}

function updateSelectedSlots() {
    const slots = gameState.selectedIngredients;

    ['main', 'sub1', 'sub2'].forEach((slotKey, index) => {
        const slotId = index === 0 ? 'main-slot' : `sub-slot-${index}`;
        const slot = document.getElementById(slotId);
        if (!slot) return;

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

    const scoreEl = document.getElementById('synergy-score');
    const msgEl = document.getElementById('synergy-message');

    if (!scoreEl || !msgEl) return;

    if (mainId && sub1Id && sub2Id) {
        try {
            const result = await apiCall(`/api/game/${gameState.gameId || 'temp'}/synergy`, 'POST', {
                main: mainId, sub1: sub1Id, sub2: sub2Id
            });

            const bonus = result.synergy - 50;
            scoreEl.textContent = (bonus >= 0 ? '+' : '') + bonus;
            scoreEl.className = 'synergy-score ' + (bonus > 0 ? 'synergy-positive' : bonus < 0 ? 'synergy-negative' : 'synergy-neutral');
            msgEl.textContent = result.messages.join(' ');
        } catch (e) {
            scoreEl.textContent = '0';
            msgEl.textContent = '';
        }
    } else {
        scoreEl.textContent = '0';
        scoreEl.className = 'synergy-score synergy-neutral';
        msgEl.textContent = '';
    }
}

async function confirmIngredients() {
    stopTimer();

    // 미니게임 보너스 추가
    gameState.cookingScore += gameState.ingredientGameScore;

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

// ==================== 2단계: 다양한 조리 미니게임 ====================

const COOKING_MINI_GAMES = [
    { id: 'timing', name: '타이밍 맞추기', icon: '🎯', desc: '정확한 타이밍에 터치하세요!' },
    { id: 'cutting', name: '썰기', icon: '🔪', desc: '재료를 정확하게 썰어주세요!' },
    { id: 'stirring', name: '휘젓기', icon: '🥄', desc: '빠르게 원을 그리며 저어주세요!' },
    { id: 'wok', name: '웍 볶기', icon: '🍳', desc: '웍을 흔들어 재료를 볶아주세요!' },
    { id: 'frying', name: '튀기기', icon: '🍟', desc: '적절한 온도에서 튀겨주세요!' },
    { id: 'grilling', name: '굽기', icon: '🥩', desc: '고기를 적절히 뒤집어주세요!' },
    { id: 'boiling', name: '끓이기', icon: '🫕', desc: '불 조절을 정확하게 하세요!' },
    { id: 'tapping', name: '손질하기', icon: '👋', desc: '빠르게 탭해서 손질하세요!' }
];

function showCookingPhase() {
    // 랜덤 미니게임 선택
    const miniGame = COOKING_MINI_GAMES[Math.floor(Math.random() * COOKING_MINI_GAMES.length)];
    gameState.cookingMiniGameType = miniGame.id;

    document.querySelectorAll('.game-phase').forEach(p => p.style.display = 'none');
    document.getElementById('cooking-phase').style.display = 'block';

    // 미니게임별 UI 렌더링
    renderCookingMiniGame(miniGame);
}

function renderCookingMiniGame(miniGame) {
    const phaseEl = document.getElementById('cooking-phase');

    switch (miniGame.id) {
        case 'timing':
            renderTimingGame(phaseEl);
            break;
        case 'cutting':
            renderCuttingGame(phaseEl);
            break;
        case 'stirring':
            renderStirringGame(phaseEl);
            break;
        case 'wok':
            renderWokGame(phaseEl);
            break;
        case 'frying':
            renderFryingGame(phaseEl);
            break;
        case 'grilling':
            renderGrillingGame(phaseEl);
            break;
        case 'boiling':
            renderBoilingGame(phaseEl);
            break;
        case 'tapping':
            renderTappingGame(phaseEl);
            break;
        default:
            renderTimingGame(phaseEl);
    }
}

// 타이밍 맞추기 게임 (기존 게이지 게임)
function renderTimingGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>🎯 타이밍 맞추기</h3>
            <div class="cooking-animation" id="cooking-emoji">🍳</div>
            <div class="cooking-instructions">초록색 영역에서 터치/스페이스바를 누르세요!</div>

            <div class="gauge-container" id="gauge-container">
                <div class="gauge-target" id="gauge-target"></div>
                <div class="gauge-indicator" id="gauge-indicator"></div>
            </div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="combo-display">콤보: <span id="combo-count">0</span>x</div>
            <div class="attempts-display">
                <span id="cooking-attempts">시도: 0/5</span>
            </div>
        </div>
    `;

    gameState.cookingAttempts = 0;
    gameState.comboCount = 0;
    gameState.maxCookingAttempts = 5;

    gameState.gaugeSpeed = 3;
    if (gameState.bossActive && gameState.currentBoss?.skillEffect === 'difficulty') {
        gameState.gaugeSpeed = 4.5;
    }

    setNewTarget();
    startGauge();

    // 터치/클릭 이벤트 추가
    const gaugeContainer = document.getElementById('gauge-container');
    gaugeContainer.addEventListener('click', handleTimingClick);
    gaugeContainer.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleTimingClick(e);
    });

    document.addEventListener('keydown', handleCookingInput);
}

function handleTimingClick(e) {
    if (gameState.phase === 2 && gameState.isGaugeRunning && gameState.cookingMiniGameType === 'timing') {
        checkCookingHit();
    }
}

// 썰기 게임
function renderCuttingGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>🔪 썰기</h3>
            <div class="cooking-animation" id="cooking-emoji">${gameState.selectedIngredients.main?.icon || '🥕'}</div>
            <div class="cooking-instructions">선을 따라 스와이프/드래그하세요!</div>

            <div class="cutting-area" id="cutting-area">
                <div class="cutting-line" id="cutting-line"></div>
                <div class="cutting-progress" id="cutting-progress"></div>
            </div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="attempts-display">
                <span id="cooking-attempts">남은 횟수: 5</span>
            </div>
        </div>
    `;

    gameState.miniGameData = { cuts: 0, maxCuts: 5, totalScore: 0 };
    setupCuttingGame();
}

function setupCuttingGame() {
    const area = document.getElementById('cutting-area');
    let isDragging = false;
    let startX = 0;

    const handleStart = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        startX = clientX;
        isDragging = true;
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const diff = clientX - startX;

        const progress = document.getElementById('cutting-progress');
        const percent = Math.min(Math.abs(diff) / 150 * 100, 100);
        progress.style.width = percent + '%';
    };

    const handleEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;

        const progress = document.getElementById('cutting-progress');
        const percent = parseFloat(progress.style.width) || 0;

        if (percent >= 80) {
            // 성공적인 썰기
            const points = Math.floor(percent / 5);
            gameState.cookingScore += points;
            gameState.miniGameData.cuts++;

            document.getElementById('cooking-emoji').textContent = '✨';
            setTimeout(() => {
                document.getElementById('cooking-emoji').textContent = gameState.selectedIngredients.main?.icon || '🥕';
            }, 300);
        }

        progress.style.width = '0%';
        document.getElementById('cooking-score').textContent = gameState.cookingScore;
        document.getElementById('cooking-attempts').textContent = `남은 횟수: ${gameState.miniGameData.maxCuts - gameState.miniGameData.cuts}`;

        if (gameState.miniGameData.cuts >= gameState.miniGameData.maxCuts) {
            endCookingPhase();
        } else {
            // 새 위치에 라인 생성
            const line = document.getElementById('cutting-line');
            line.style.top = (20 + Math.random() * 60) + '%';
        }
    };

    area.addEventListener('mousedown', handleStart);
    area.addEventListener('mousemove', handleMove);
    area.addEventListener('mouseup', handleEnd);
    area.addEventListener('touchstart', handleStart);
    area.addEventListener('touchmove', handleMove);
    area.addEventListener('touchend', handleEnd);
}

// 휘젓기 게임
function renderStirringGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>🥄 휘젓기</h3>
            <div class="cooking-animation" id="cooking-emoji">🍲</div>
            <div class="cooking-instructions">원을 그리며 빠르게 저어주세요!</div>

            <div class="stirring-area" id="stirring-area">
                <div class="stir-indicator" id="stir-indicator">🥄</div>
            </div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="stir-meter">
                <div class="stir-fill" id="stir-fill"></div>
            </div>
            <div class="attempts-display">
                <span id="cooking-attempts">저은 횟수: 0</span>
            </div>
        </div>
    `;

    gameState.miniGameData = { stirCount: 0, lastAngle: 0, totalRotation: 0, targetRotation: 1080 };
    setupStirringGame();
}

function setupStirringGame() {
    const area = document.getElementById('stirring-area');
    const indicator = document.getElementById('stir-indicator');
    let lastAngle = null;

    const handleMove = (e) => {
        const rect = area.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const angle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;

        if (lastAngle !== null) {
            let delta = angle - lastAngle;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;

            gameState.miniGameData.totalRotation += Math.abs(delta);

            // 점수 계산
            if (Math.abs(delta) > 5) {
                gameState.cookingScore += Math.floor(Math.abs(delta) / 10);
                document.getElementById('cooking-score').textContent = gameState.cookingScore;
            }
        }

        lastAngle = angle;

        // 지시자 회전
        const distance = Math.min(Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)), 80);
        indicator.style.transform = `translate(${Math.cos(angle * Math.PI / 180) * distance}px, ${Math.sin(angle * Math.PI / 180) * distance}px)`;

        // 진행바 업데이트
        const progress = Math.min(gameState.miniGameData.totalRotation / gameState.miniGameData.targetRotation * 100, 100);
        document.getElementById('stir-fill').style.width = progress + '%';
        document.getElementById('cooking-attempts').textContent = `저은 횟수: ${Math.floor(gameState.miniGameData.totalRotation / 360)}`;

        if (progress >= 100) {
            endCookingPhase();
        }
    };

    area.addEventListener('mousemove', handleMove);
    area.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleMove(e);
    });

    // 15초 후 자동 종료
    setTimeout(() => {
        if (gameState.phase === 2 && gameState.cookingMiniGameType === 'stirring') {
            endCookingPhase();
        }
    }, 15000);
}

// 웍 볶기 게임
function renderWokGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>🍳 웍 볶기</h3>
            <div class="wok-area" id="wok-area">
                <div class="wok-content" id="wok-content">
                    ${gameState.selectedIngredients.main?.icon || '🥬'}
                </div>
                <div class="wok-pan">🍳</div>
            </div>
            <div class="cooking-instructions">웍을 위아래로 흔들어주세요! (터치/클릭)</div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="attempts-display">
                <span id="cooking-attempts">볶은 횟수: 0/10</span>
            </div>
        </div>
    `;

    gameState.miniGameData = { tossCount: 0, maxToss: 10 };
    setupWokGame();
}

function setupWokGame() {
    const area = document.getElementById('wok-area');
    const content = document.getElementById('wok-content');

    const handleToss = () => {
        if (content.classList.contains('tossing')) return;

        content.classList.add('tossing');
        gameState.miniGameData.tossCount++;

        // 점수 추가
        const points = 10 + Math.floor(Math.random() * 10);
        gameState.cookingScore += points;
        document.getElementById('cooking-score').textContent = gameState.cookingScore;
        document.getElementById('cooking-attempts').textContent = `볶은 횟수: ${gameState.miniGameData.tossCount}/${gameState.miniGameData.maxToss}`;

        setTimeout(() => {
            content.classList.remove('tossing');

            if (gameState.miniGameData.tossCount >= gameState.miniGameData.maxToss) {
                endCookingPhase();
            }
        }, 400);
    };

    area.addEventListener('click', handleToss);
    area.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleToss();
    });
}

// 튀기기 게임
function renderFryingGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>🍟 튀기기</h3>
            <div class="cooking-animation" id="cooking-emoji">🍟</div>
            <div class="cooking-instructions">온도가 초록색 영역에 있을 때 터치하세요!</div>

            <div class="temp-gauge" id="temp-gauge">
                <div class="temp-zone temp-cold">차가움</div>
                <div class="temp-zone temp-good">적절함</div>
                <div class="temp-zone temp-hot">너무 뜨거움</div>
                <div class="temp-indicator" id="temp-indicator">🌡️</div>
            </div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="attempts-display">
                <span id="cooking-attempts">시도: 0/5</span>
            </div>
        </div>
    `;

    gameState.miniGameData = { attempts: 0, maxAttempts: 5, tempPosition: 0, tempDirection: 1 };
    setupFryingGame();
}

function setupFryingGame() {
    const gauge = document.getElementById('temp-gauge');
    const indicator = document.getElementById('temp-indicator');

    // 온도 지시자 움직임
    function animateTemp() {
        if (gameState.phase !== 2 || gameState.cookingMiniGameType !== 'frying') return;

        gameState.miniGameData.tempPosition += gameState.miniGameData.tempDirection * 2;
        if (gameState.miniGameData.tempPosition >= 100) {
            gameState.miniGameData.tempDirection = -1;
        } else if (gameState.miniGameData.tempPosition <= 0) {
            gameState.miniGameData.tempDirection = 1;
        }

        indicator.style.left = gameState.miniGameData.tempPosition + '%';
        requestAnimationFrame(animateTemp);
    }
    animateTemp();

    const handleFry = () => {
        gameState.miniGameData.attempts++;
        const pos = gameState.miniGameData.tempPosition;

        let points = 0;
        if (pos >= 35 && pos <= 65) {
            // 적절한 온도
            points = 20 + Math.floor((15 - Math.abs(pos - 50)) * 2);
            document.getElementById('cooking-emoji').textContent = '😋';
        } else if (pos < 35) {
            // 너무 차가움
            points = 5;
            document.getElementById('cooking-emoji').textContent = '🥶';
        } else {
            // 너무 뜨거움
            points = 3;
            document.getElementById('cooking-emoji').textContent = '🥵';
        }

        gameState.cookingScore += points;
        document.getElementById('cooking-score').textContent = gameState.cookingScore;
        document.getElementById('cooking-attempts').textContent = `시도: ${gameState.miniGameData.attempts}/${gameState.miniGameData.maxAttempts}`;

        setTimeout(() => {
            document.getElementById('cooking-emoji').textContent = '🍟';
        }, 500);

        if (gameState.miniGameData.attempts >= gameState.miniGameData.maxAttempts) {
            endCookingPhase();
        }
    };

    gauge.addEventListener('click', handleFry);
    gauge.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleFry();
    });
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameState.phase === 2 && gameState.cookingMiniGameType === 'frying') {
            e.preventDefault();
            handleFry();
        }
    });
}

// 굽기 게임
function renderGrillingGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>🥩 굽기</h3>
            <div class="grill-area" id="grill-area">
                <div class="grill-item" id="grill-item">🥩</div>
                <div class="grill-doneness" id="grill-doneness">레어</div>
            </div>
            <div class="cooking-instructions">적절한 때에 뒤집어주세요! (터치/클릭)</div>

            <div class="doneness-bar">
                <div class="doneness-fill" id="doneness-fill"></div>
            </div>
            <div class="doneness-labels">
                <span>레어</span><span>미디엄</span><span>웰던</span><span>탐</span>
            </div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="attempts-display">
                <span id="cooking-attempts">뒤집기: 0/4</span>
            </div>
        </div>
    `;

    gameState.miniGameData = { doneness: 0, flips: 0, maxFlips: 4, cooking: true };
    setupGrillingGame();
}

function setupGrillingGame() {
    const area = document.getElementById('grill-area');
    const item = document.getElementById('grill-item');
    const fill = document.getElementById('doneness-fill');
    const donenessText = document.getElementById('grill-doneness');

    // 굽기 진행
    function cook() {
        if (!gameState.miniGameData.cooking || gameState.phase !== 2) return;

        gameState.miniGameData.doneness += 0.5;
        fill.style.width = Math.min(gameState.miniGameData.doneness, 100) + '%';

        // 익힘 정도 표시
        const d = gameState.miniGameData.doneness;
        if (d < 25) donenessText.textContent = '레어';
        else if (d < 50) donenessText.textContent = '미디엄 레어';
        else if (d < 75) donenessText.textContent = '미디엄';
        else if (d < 90) donenessText.textContent = '웰던';
        else donenessText.textContent = '너무 익음!';

        if (d < 100) {
            requestAnimationFrame(cook);
        } else {
            endCookingPhase();
        }
    }
    cook();

    const handleFlip = () => {
        if (gameState.miniGameData.flips >= gameState.miniGameData.maxFlips) return;

        gameState.miniGameData.flips++;
        item.classList.add('flipping');

        // 점수 계산 (미디엄~웰던 사이가 최고)
        const d = gameState.miniGameData.doneness;
        let points = 0;
        if (d >= 40 && d <= 80) {
            points = 25 - Math.abs(d - 60) / 2;
        } else if (d >= 25 && d <= 90) {
            points = 15;
        } else {
            points = 5;
        }

        gameState.cookingScore += Math.floor(points);
        document.getElementById('cooking-score').textContent = gameState.cookingScore;
        document.getElementById('cooking-attempts').textContent = `뒤집기: ${gameState.miniGameData.flips}/${gameState.miniGameData.maxFlips}`;

        setTimeout(() => {
            item.classList.remove('flipping');

            if (gameState.miniGameData.flips >= gameState.miniGameData.maxFlips) {
                gameState.miniGameData.cooking = false;
                endCookingPhase();
            }
        }, 300);
    };

    area.addEventListener('click', handleFlip);
    area.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleFlip();
    });
}

// 끓이기 게임
function renderBoilingGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>🫕 끓이기</h3>
            <div class="boiling-area" id="boiling-area">
                <div class="pot">🫕</div>
                <div class="bubbles" id="bubbles"></div>
            </div>
            <div class="cooking-instructions">거품이 넘치기 전에 불을 줄이세요!</div>

            <div class="heat-control">
                <button class="heat-btn" id="heat-down">🔽 불 줄이기</button>
                <button class="heat-btn" id="heat-up">🔼 불 올리기</button>
            </div>

            <div class="heat-meter">
                <div class="heat-fill" id="heat-fill"></div>
                <div class="heat-target"></div>
            </div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="attempts-display">
                <span id="cooking-attempts">남은 시간: 15초</span>
            </div>
        </div>
    `;

    gameState.miniGameData = { heat: 50, stable: 0 };
    setupBoilingGame();
}

function setupBoilingGame() {
    const fill = document.getElementById('heat-fill');
    const bubbles = document.getElementById('bubbles');
    let timeLeft = 15;

    // 불 조절
    document.getElementById('heat-down').addEventListener('click', () => {
        gameState.miniGameData.heat = Math.max(0, gameState.miniGameData.heat - 10);
    });
    document.getElementById('heat-up').addEventListener('click', () => {
        gameState.miniGameData.heat = Math.min(100, gameState.miniGameData.heat + 10);
    });

    // 터치 지원
    document.getElementById('heat-down').addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.miniGameData.heat = Math.max(0, gameState.miniGameData.heat - 10);
    });
    document.getElementById('heat-up').addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.miniGameData.heat = Math.min(100, gameState.miniGameData.heat + 10);
    });

    function updateBoiling() {
        if (gameState.phase !== 2 || gameState.cookingMiniGameType !== 'boiling') return;

        // 자연스러운 열 변화
        gameState.miniGameData.heat += (Math.random() - 0.4) * 5;
        gameState.miniGameData.heat = Math.max(0, Math.min(100, gameState.miniGameData.heat));

        fill.style.width = gameState.miniGameData.heat + '%';

        // 안정 영역 체크 (40-70)
        if (gameState.miniGameData.heat >= 40 && gameState.miniGameData.heat <= 70) {
            gameState.miniGameData.stable += 0.1;
            gameState.cookingScore += 1;
            document.getElementById('cooking-score').textContent = gameState.cookingScore;
        }

        // 거품 애니메이션
        if (gameState.miniGameData.heat > 70) {
            bubbles.innerHTML = '💨💨💨';
        } else if (gameState.miniGameData.heat > 40) {
            bubbles.innerHTML = '💨💨';
        } else {
            bubbles.innerHTML = '💨';
        }

        requestAnimationFrame(updateBoiling);
    }
    updateBoiling();

    // 타이머
    const timer = setInterval(() => {
        timeLeft--;
        document.getElementById('cooking-attempts').textContent = `남은 시간: ${timeLeft}초`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            endCookingPhase();
        }
    }, 1000);
}

// 손질하기 게임 (빠른 탭)
function renderTappingGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>👋 손질하기</h3>
            <div class="tapping-area" id="tapping-area">
                <div class="tap-target" id="tap-target">${gameState.selectedIngredients.main?.icon || '🥬'}</div>
            </div>
            <div class="cooking-instructions">빠르게 탭/클릭해서 재료를 손질하세요!</div>

            <div class="tap-progress">
                <div class="tap-fill" id="tap-fill"></div>
            </div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="attempts-display">
                <span id="cooking-attempts">진행: 0%</span>
            </div>
        </div>
    `;

    gameState.miniGameData = { taps: 0, targetTaps: 30 };
    setupTappingGame();
}

function setupTappingGame() {
    const area = document.getElementById('tapping-area');
    const target = document.getElementById('tap-target');
    const fill = document.getElementById('tap-fill');

    const handleTap = () => {
        gameState.miniGameData.taps++;

        // 애니메이션
        target.classList.add('tapped');
        setTimeout(() => target.classList.remove('tapped'), 100);

        // 점수
        gameState.cookingScore += 3;
        document.getElementById('cooking-score').textContent = gameState.cookingScore;

        // 진행
        const progress = Math.min(gameState.miniGameData.taps / gameState.miniGameData.targetTaps * 100, 100);
        fill.style.width = progress + '%';
        document.getElementById('cooking-attempts').textContent = `진행: ${Math.floor(progress)}%`;

        if (progress >= 100) {
            endCookingPhase();
        }
    };

    area.addEventListener('click', handleTap);
    area.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleTap();
    });

    // 10초 제한
    setTimeout(() => {
        if (gameState.phase === 2 && gameState.cookingMiniGameType === 'tapping') {
            endCookingPhase();
        }
    }, 10000);
}

// 기존 타이밍 게임 함수들
function setNewTarget() {
    const targetEl = document.getElementById('gauge-target');
    if (!targetEl) return;

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
    if (!indicator) return;

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
    if (e.code === 'Space' && gameState.phase === 2 && gameState.isGaugeRunning && gameState.cookingMiniGameType === 'timing') {
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
        const emoji = document.getElementById('cooking-emoji');
        emoji.classList.add('shake');
        setTimeout(() => emoji.classList.remove('shake'), 500);
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

    let timeLimit = 45;
    if (gameState.bossActive && gameState.currentBoss?.skillEffect === 'time') {
        timeLimit = Math.floor(timeLimit * 0.7);
    }

    startTimer(timeLimit, confirmPlating);
}

function setupEnhancedPlating() {
    const phaseEl = document.getElementById('plating-phase');

    phaseEl.innerHTML = `
        <h3 class="phase-title">플레이팅 & 프레젠테이션</h3>

        <div class="plating-area">
            <div class="plate-canvas" id="plate-canvas">
                <div class="main-dish-draggable" id="main-dish">
                    <span>${gameState.selectedIngredients.main?.icon || '🍽️'}</span>
                </div>
                <div class="side-dish-area" id="side-dish-1"></div>
                <div class="side-dish-area" id="side-dish-2"></div>
                <div class="sauce-drizzle" id="sauce-area"></div>
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
                    <div class="decoration-palette" id="decoration-palette">
                        ${SERVER_DECORATIONS.map(dec => `
                            <div class="decoration-item" data-emoji="${dec}"
                                 onclick="addDecoration('${dec}')">${dec}</div>
                        `).join('')}
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

    let isDragging = false;
    let offsetX, offsetY;

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

    const handleEnd = () => {
        isDragging = false;
        mainDish.style.cursor = 'grab';
    };

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

    // 랜덤 위치
    const mainPos = gameState.mainDishPosition;
    const angle = num === 1 ? -45 : 45;
    const distance = 25;

    const x = mainPos.x + Math.cos(angle * Math.PI / 180) * distance;
    const y = mainPos.y + Math.sin(angle * Math.PI / 180) * distance;

    area.style.left = Math.max(5, Math.min(85, x)) + '%';
    area.style.top = Math.max(5, Math.min(85, y)) + '%';
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
        opt.classList.remove('selected');
        if (opt.dataset.id === themeId) {
            opt.classList.add('selected');
        }
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

async function confirmPlating() {
    stopTimer();

    try {
        const result = await apiCall(`/api/game/${gameState.gameId}/plating`, 'POST', {
            theme: gameState.selectedTheme,
            decorations: gameState.decorations,
            mainDishPosition: gameState.mainDishPosition
        });

        showJudgingScreen(result);
    } catch (e) {
        console.error('플레이팅 저장 실패:', e);
        showJudgingScreenLocal();
    }
}

// ==================== 심사 화면 (다양한 심사평) ====================

const JUDGE_COMMENTS = {
    A: {
        excellent: [
            "이 조리 실력은 정말 놀랍습니다!",
            "완벽에 가까운 테크닉이군요.",
            "프로페셔널한 솜씨입니다.",
            "기술적으로 흠잡을 데가 없네요.",
            "이 정도 실력이라면 어디서든 인정받겠군요."
        ],
        good: [
            "괜찮은 조리 실력입니다.",
            "안정적인 테크닉이네요.",
            "기본기가 탄탄합니다.",
            "좋은 시도였습니다.",
            "발전 가능성이 보입니다."
        ],
        average: [
            "조금 더 연습이 필요해 보입니다.",
            "기본적인 부분에서 아쉬움이 있네요.",
            "나쁘지 않지만 인상적이진 않습니다.",
            "평범한 수준입니다.",
            "개선의 여지가 있습니다."
        ],
        poor: [
            "많은 연습이 필요합니다.",
            "기초부터 다시 시작해보세요.",
            "조리 과정에서 실수가 많았습니다.",
            "아쉬운 결과네요.",
            "다음에는 더 잘할 수 있을 겁니다."
        ]
    },
    B: {
        excellent: [
            "눈이 즐거운 요리입니다!",
            "이 프레젠테이션은 예술이에요!",
            "감성적으로 완벽합니다.",
            "마음을 사로잡는 플레이팅이네요.",
            "이 요리에서 스토리가 느껴집니다."
        ],
        good: [
            "보기 좋은 요리네요.",
            "센스 있는 플레이팅입니다.",
            "좋은 인상을 주는 요리입니다.",
            "테마 선택이 적절했어요.",
            "감각적인 면이 있네요."
        ],
        average: [
            "무난한 플레이팅이에요.",
            "조금 더 창의성이 필요해요.",
            "평범한 프레젠테이션입니다.",
            "특별한 점을 찾기 어렵네요.",
            "기본에 충실한 모습입니다."
        ],
        poor: [
            "시각적 매력이 부족합니다.",
            "플레이팅에 신경을 더 쓰셔야 해요.",
            "테마가 명확하지 않네요.",
            "감성적인 부분이 아쉽습니다.",
            "다음엔 더 예쁘게 담아보세요."
        ]
    }
};

function getJudgeComment(judge, score) {
    let category;
    if (score >= 80) category = 'excellent';
    else if (score >= 60) category = 'good';
    else if (score >= 40) category = 'average';
    else category = 'poor';

    const comments = JUDGE_COMMENTS[judge][category];
    return comments[Math.floor(Math.random() * comments.length)];
}

function showJudgingScreen(result) {
    showScreen('judging-screen');

    const mainIng = gameState.selectedIngredients.main;
    document.getElementById('final-dish-emoji').textContent = mainIng?.icon || '🍽️';

    const judgeAComment = getJudgeComment('A', result.judgeAScore);
    const judgeBComment = getJudgeComment('B', result.judgeBScore);

    setTimeout(() => {
        document.getElementById('judge-a-score').textContent = result.judgeAScore;
        document.getElementById('judge-a-breakdown').innerHTML = `
            <div class="judge-comment">"${judgeAComment}"</div>
            <div><span>조리:</span><span>${result.judgeABreakdown.cooking}</span></div>
            <div><span>시너지:</span><span>${result.judgeABreakdown.synergy}</span></div>
            <div><span>대처:</span><span>${result.judgeABreakdown.handling}</span></div>
        `;
    }, 500);

    setTimeout(() => {
        document.getElementById('judge-b-score').textContent = result.judgeBScore;
        document.getElementById('judge-b-breakdown').innerHTML = `
            <div class="judge-comment">"${judgeBComment}"</div>
            <div><span>플레이팅:</span><span>${result.judgeBBreakdown.plating}</span></div>
            <div><span>테마:</span><span>${result.judgeBBreakdown.theme}</span></div>
            <div><span>시너지:</span><span>${result.judgeBBreakdown.synergy}</span></div>
        `;
    }, 1000);

    setTimeout(() => {
        let scoreText = result.totalScore.toString();
        if (result.bossScore !== null && result.bossScore !== undefined) {
            if (result.bossDefeated) {
                scoreText = `${result.totalScore} - 승리! (보스: ${result.bossScore})`;
                gameState.defeatedBosses.push(gameState.currentBoss?.id);
            } else {
                scoreText = `${result.totalScore} - 패배... (보스: ${result.bossScore})`;
            }
        }
        document.getElementById('total-score').textContent = scoreText;

        // 플레이어 상태 업데이트
        if (result.player) {
            gameState.players[gameState.currentPlayerIndex] = result.player;
        }
    }, 1500);
}

function showJudgingScreenLocal() {
    const result = {
        judgeAScore: Math.floor(gameState.cookingScore * 0.7),
        judgeBScore: Math.floor(50 + gameState.decorations.length * 10),
        totalScore: 0,
        judgeABreakdown: { cooking: gameState.cookingScore, synergy: 0, handling: 0 },
        judgeBBreakdown: { plating: gameState.decorations.length * 5, theme: gameState.selectedTheme ? 10 : 0, synergy: 0 }
    };
    result.totalScore = result.judgeAScore + result.judgeBScore;
    showJudgingScreen(result);
}

// ==================== 다음 턴 (버그 수정) ====================

async function nextTurn() {
    try {
        const result = await apiCall(`/api/game/${gameState.gameId}/next`, 'POST');

        if (result.gameOver) {
            showVictoryScreen();
            return;
        }

        if (result.roundOver) {
            showRoundResults();
            return;
        }

        // 서버에서 받은 상태로 업데이트 (버그 수정: 직접 증가하지 않음)
        if (result.game) {
            gameState.players = result.game.players;
            gameState.currentPlayerIndex = result.game.currentPlayerIndex;
            gameState.currentRound = result.game.currentRound;
        }

        if (result.boss) {
            showBossIntro(result.boss);
        } else {
            startPlayerTurn();
        }
    } catch (e) {
        console.error('다음 턴 처리 실패:', e);
        // 로컬 처리 (폴백)
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
    gameState.currentRound++;
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
