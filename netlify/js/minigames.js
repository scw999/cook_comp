// ==================== 재료 수집 미니게임 ====================

function startIngredientMiniGame() {
    const phaseEl = document.getElementById('ingredient-phase');

    phaseEl.innerHTML = `
        <h3 class="phase-title">재료를 잡으세요!</h3>
        <p class="phase-subtitle">떨어지는 재료를 터치/클릭해서 잡으세요!</p>

        <div class="ingredient-catch-game" id="ingredient-catch-area">
            <div class="catch-score">잡은 재료: <span id="catch-count">0</span>/6</div>
            <div class="catch-timer">남은 시간: <span id="catch-timer">20</span>초</div>
            <div class="falling-area" id="falling-area"></div>
        </div>

        <div class="caught-ingredients" id="caught-ingredients"></div>
    `;

    gameState.ingredientGameActive = true;
    gameState.caughtIngredients = [];
    gameState.ingredientGameScore = 0;

    startFallingIngredients();
    startIngredientTimer(20);  // 15초 -> 20초로 증가
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

        item.addEventListener('click', (e) => catchIngredient(e, ingredient));
        item.addEventListener('touchstart', (e) => {
            e.preventDefault();
            catchIngredient(e, ingredient);
        });

        area.appendChild(item);

        setTimeout(() => {
            if (item.parentNode) {
                item.classList.add('missed');
                setTimeout(() => item.remove(), 300);
            }
        }, 2500);

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

    updateCaughtDisplay();
    document.getElementById('catch-count').textContent = gameState.caughtIngredients.length;

    target.innerHTML = `<span class="fall-icon">✨</span>`;
    setTimeout(() => target.remove(), 200);

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

    const allIngredients = Object.values(SERVER_INGREDIENTS).flat();
    while (gameState.caughtIngredients.length < 6) {
        const randomIng = allIngredients[Math.floor(Math.random() * allIngredients.length)];
        gameState.caughtIngredients.push(randomIng);
    }

    showIngredientSelection();
}

// ==================== 조리 미니게임 공통 ====================

function renderCookingMiniGame(miniGame) {
    const phaseEl = document.getElementById('cooking-phase');

    switch (miniGame.id) {
        case 'timing': renderTimingGame(phaseEl); break;
        case 'cutting': renderCuttingGame(phaseEl); break;
        case 'stirring': renderStirringGame(phaseEl); break;
        case 'wok': renderWokGame(phaseEl); break;
        case 'frying': renderFryingGame(phaseEl); break;
        case 'grilling': renderGrillingGame(phaseEl); break;
        case 'boiling': renderBoilingGame(phaseEl); break;
        case 'tapping': renderTappingGame(phaseEl); break;
        default: renderTimingGame(phaseEl);
    }
}

// ==================== 타이밍 맞추기 ====================

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
            <div class="attempts-display"><span id="cooking-attempts">시도: 0/5</span></div>
        </div>
    `;

    gameState.cookingAttempts = 0;
    gameState.comboCount = 0;
    gameState.maxCookingAttempts = 5;
    gameState.gaugeSpeed = gameState.bossActive && gameState.currentBoss?.skillEffect === 'difficulty' ? 4.5 : 3;

    setNewTarget();
    startGauge();

    const gaugeContainer = document.getElementById('gauge-container');
    gaugeContainer.addEventListener('click', handleTimingClick);
    gaugeContainer.addEventListener('touchstart', (e) => { e.preventDefault(); handleTimingClick(e); });
    document.addEventListener('keydown', handleCookingInput);
}

function handleTimingClick(e) {
    if (gameState.phase === 2 && gameState.isGaugeRunning && gameState.cookingMiniGameType === 'timing') {
        checkCookingHit();
    }
}

function setNewTarget() {
    const targetEl = document.getElementById('gauge-target');
    if (!targetEl) return;

    const targetWidth = 15 + Math.random() * 10;
    const targetLeft = 10 + Math.random() * (75 - targetWidth);

    targetEl.style.width = targetWidth + '%';
    targetEl.style.left = targetLeft + '%';

    gameState.targetZone = { left: targetLeft, right: targetLeft + targetWidth };
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
        if (gameState.comboCount >= 3) points += gameState.comboCount * 2;

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

// ==================== 썰기 ====================

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
            <div class="attempts-display"><span id="cooking-attempts">남은 횟수: 5</span></div>
        </div>
    `;

    gameState.miniGameData = { cuts: 0, maxCuts: 5 };
    setupCuttingGame();
}

function setupCuttingGame() {
    const area = document.getElementById('cutting-area');
    let isDragging = false, startX = 0;

    const handleStart = (e) => {
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        isDragging = true;
    };

    const handleMove = (e) => {
        if (!isDragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const diff = clientX - startX;
        const progress = document.getElementById('cutting-progress');
        progress.style.width = Math.min(Math.abs(diff) / 150 * 100, 100) + '%';
    };

    const handleEnd = () => {
        if (!isDragging) return;
        isDragging = false;

        const progress = document.getElementById('cutting-progress');
        const percent = parseFloat(progress.style.width) || 0;

        if (percent >= 80) {
            gameState.cookingScore += Math.floor(percent / 5);
            gameState.miniGameData.cuts++;
            document.getElementById('cooking-emoji').textContent = '✨';
            setTimeout(() => document.getElementById('cooking-emoji').textContent = gameState.selectedIngredients.main?.icon || '🥕', 300);
        }

        progress.style.width = '0%';
        document.getElementById('cooking-score').textContent = gameState.cookingScore;
        document.getElementById('cooking-attempts').textContent = `남은 횟수: ${gameState.miniGameData.maxCuts - gameState.miniGameData.cuts}`;

        if (gameState.miniGameData.cuts >= gameState.miniGameData.maxCuts) {
            endCookingPhase();
        } else {
            document.getElementById('cutting-line').style.top = (20 + Math.random() * 60) + '%';
        }
    };

    area.addEventListener('mousedown', handleStart);
    area.addEventListener('mousemove', handleMove);
    area.addEventListener('mouseup', handleEnd);
    area.addEventListener('touchstart', handleStart);
    area.addEventListener('touchmove', handleMove);
    area.addEventListener('touchend', handleEnd);
}

// ==================== 휘젓기 ====================

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
            <div class="stir-meter"><div class="stir-fill" id="stir-fill"></div></div>
            <div class="attempts-display"><span id="cooking-attempts">저은 횟수: 0</span></div>
        </div>
    `;

    gameState.miniGameData = { totalRotation: 0, targetRotation: 1080 };
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

            if (Math.abs(delta) > 5) {
                gameState.cookingScore += Math.floor(Math.abs(delta) / 10);
                document.getElementById('cooking-score').textContent = gameState.cookingScore;
            }
        }

        lastAngle = angle;

        const distance = Math.min(Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)), 80);
        indicator.style.transform = `translate(${Math.cos(angle * Math.PI / 180) * distance}px, ${Math.sin(angle * Math.PI / 180) * distance}px)`;

        const progress = Math.min(gameState.miniGameData.totalRotation / gameState.miniGameData.targetRotation * 100, 100);
        document.getElementById('stir-fill').style.width = progress + '%';
        document.getElementById('cooking-attempts').textContent = `저은 횟수: ${Math.floor(gameState.miniGameData.totalRotation / 360)}`;

        if (progress >= 100) endCookingPhase();
    };

    area.addEventListener('mousemove', handleMove);
    area.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); });

    setTimeout(() => { if (gameState.phase === 2 && gameState.cookingMiniGameType === 'stirring') endCookingPhase(); }, 15000);
}

// ==================== 웍 볶기 ====================

function renderWokGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>🍳 웍 볶기</h3>
            <div class="wok-area" id="wok-area">
                <div class="wok-content" id="wok-content">${gameState.selectedIngredients.main?.icon || '🥬'}</div>
                <div class="wok-pan">🍳</div>
            </div>
            <div class="cooking-instructions">웍을 위아래로 흔들어주세요! (터치/클릭)</div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="attempts-display"><span id="cooking-attempts">볶은 횟수: 0/10</span></div>
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

        gameState.cookingScore += 10 + Math.floor(Math.random() * 10);
        document.getElementById('cooking-score').textContent = gameState.cookingScore;
        document.getElementById('cooking-attempts').textContent = `볶은 횟수: ${gameState.miniGameData.tossCount}/${gameState.miniGameData.maxToss}`;

        setTimeout(() => {
            content.classList.remove('tossing');
            if (gameState.miniGameData.tossCount >= gameState.miniGameData.maxToss) endCookingPhase();
        }, 400);
    };

    area.addEventListener('click', handleToss);
    area.addEventListener('touchstart', (e) => { e.preventDefault(); handleToss(); });
}

// ==================== 튀기기 ====================

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
            <div class="attempts-display"><span id="cooking-attempts">시도: 0/5</span></div>
        </div>
    `;

    gameState.miniGameData = { attempts: 0, maxAttempts: 5, tempPosition: 0, tempDirection: 1 };
    setupFryingGame();
}

function setupFryingGame() {
    const gauge = document.getElementById('temp-gauge');
    const indicator = document.getElementById('temp-indicator');

    function animateTemp() {
        if (gameState.phase !== 2 || gameState.cookingMiniGameType !== 'frying') return;

        gameState.miniGameData.tempPosition += gameState.miniGameData.tempDirection * 2;
        if (gameState.miniGameData.tempPosition >= 100) gameState.miniGameData.tempDirection = -1;
        else if (gameState.miniGameData.tempPosition <= 0) gameState.miniGameData.tempDirection = 1;

        indicator.style.left = gameState.miniGameData.tempPosition + '%';
        requestAnimationFrame(animateTemp);
    }
    animateTemp();

    const handleFry = () => {
        gameState.miniGameData.attempts++;
        const pos = gameState.miniGameData.tempPosition;
        let points = 0;

        if (pos >= 35 && pos <= 65) {
            points = 20 + Math.floor((15 - Math.abs(pos - 50)) * 2);
            document.getElementById('cooking-emoji').textContent = '😋';
        } else if (pos < 35) {
            points = 5;
            document.getElementById('cooking-emoji').textContent = '🥶';
        } else {
            points = 3;
            document.getElementById('cooking-emoji').textContent = '🥵';
        }

        gameState.cookingScore += points;
        document.getElementById('cooking-score').textContent = gameState.cookingScore;
        document.getElementById('cooking-attempts').textContent = `시도: ${gameState.miniGameData.attempts}/${gameState.miniGameData.maxAttempts}`;

        setTimeout(() => document.getElementById('cooking-emoji').textContent = '🍟', 500);

        if (gameState.miniGameData.attempts >= gameState.miniGameData.maxAttempts) endCookingPhase();
    };

    gauge.addEventListener('click', handleFry);
    gauge.addEventListener('touchstart', (e) => { e.preventDefault(); handleFry(); });
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameState.phase === 2 && gameState.cookingMiniGameType === 'frying') {
            e.preventDefault();
            handleFry();
        }
    });
}

// ==================== 굽기 ====================

function renderGrillingGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>🥩 굽기</h3>
            <div class="grill-area" id="grill-area">
                <div class="grill-item" id="grill-item">🥩</div>
                <div class="grill-doneness" id="grill-doneness">레어</div>
            </div>
            <div class="cooking-instructions">적절한 때에 뒤집어주세요! (터치/클릭)</div>

            <div class="doneness-bar"><div class="doneness-fill" id="doneness-fill"></div></div>
            <div class="doneness-labels"><span>레어</span><span>미디엄</span><span>웰던</span><span>탐</span></div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="attempts-display"><span id="cooking-attempts">뒤집기: 0/4</span></div>
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

    function cook() {
        if (!gameState.miniGameData.cooking || gameState.phase !== 2) return;

        gameState.miniGameData.doneness += 0.5;
        fill.style.width = Math.min(gameState.miniGameData.doneness, 100) + '%';

        const d = gameState.miniGameData.doneness;
        if (d < 25) donenessText.textContent = '레어';
        else if (d < 50) donenessText.textContent = '미디엄 레어';
        else if (d < 75) donenessText.textContent = '미디엄';
        else if (d < 90) donenessText.textContent = '웰던';
        else donenessText.textContent = '너무 익음!';

        if (d < 100) requestAnimationFrame(cook);
        else endCookingPhase();
    }
    cook();

    const handleFlip = () => {
        if (gameState.miniGameData.flips >= gameState.miniGameData.maxFlips) return;

        gameState.miniGameData.flips++;
        item.classList.add('flipping');

        const d = gameState.miniGameData.doneness;
        let points = (d >= 40 && d <= 80) ? 25 - Math.abs(d - 60) / 2 : (d >= 25 && d <= 90) ? 15 : 5;

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
    area.addEventListener('touchstart', (e) => { e.preventDefault(); handleFlip(); });
}

// ==================== 끓이기 ====================

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

            <div class="heat-meter"><div class="heat-fill" id="heat-fill"></div><div class="heat-target"></div></div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="attempts-display"><span id="cooking-attempts">남은 시간: 15초</span></div>
        </div>
    `;

    gameState.miniGameData = { heat: 50 };
    setupBoilingGame();
}

function setupBoilingGame() {
    const fill = document.getElementById('heat-fill');
    const bubbles = document.getElementById('bubbles');
    let timeLeft = 15;

    const heatDown = () => { gameState.miniGameData.heat = Math.max(0, gameState.miniGameData.heat - 10); };
    const heatUp = () => { gameState.miniGameData.heat = Math.min(100, gameState.miniGameData.heat + 10); };

    document.getElementById('heat-down').addEventListener('click', heatDown);
    document.getElementById('heat-up').addEventListener('click', heatUp);
    document.getElementById('heat-down').addEventListener('touchstart', (e) => { e.preventDefault(); heatDown(); });
    document.getElementById('heat-up').addEventListener('touchstart', (e) => { e.preventDefault(); heatUp(); });

    function updateBoiling() {
        if (gameState.phase !== 2 || gameState.cookingMiniGameType !== 'boiling') return;

        gameState.miniGameData.heat += (Math.random() - 0.4) * 5;
        gameState.miniGameData.heat = Math.max(0, Math.min(100, gameState.miniGameData.heat));

        fill.style.width = gameState.miniGameData.heat + '%';

        if (gameState.miniGameData.heat >= 40 && gameState.miniGameData.heat <= 70) {
            gameState.cookingScore += 1;
            document.getElementById('cooking-score').textContent = gameState.cookingScore;
        }

        bubbles.innerHTML = gameState.miniGameData.heat > 70 ? '💨💨💨' : gameState.miniGameData.heat > 40 ? '💨💨' : '💨';

        requestAnimationFrame(updateBoiling);
    }
    updateBoiling();

    const timer = setInterval(() => {
        timeLeft--;
        document.getElementById('cooking-attempts').textContent = `남은 시간: ${timeLeft}초`;
        if (timeLeft <= 0) { clearInterval(timer); endCookingPhase(); }
    }, 1000);
}

// ==================== 손질하기 ====================

function renderTappingGame(container) {
    container.innerHTML = `
        <div class="cooking-game">
            <h3>👋 손질하기</h3>
            <div class="tapping-area" id="tapping-area">
                <div class="tap-target" id="tap-target">${gameState.selectedIngredients.main?.icon || '🥬'}</div>
            </div>
            <div class="cooking-instructions">빠르게 탭/클릭해서 재료를 손질하세요!</div>

            <div class="tap-progress"><div class="tap-fill" id="tap-fill"></div></div>

            <div class="cooking-score">점수: <span id="cooking-score">${gameState.cookingScore}</span></div>
            <div class="attempts-display"><span id="cooking-attempts">진행: 0%</span></div>
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
        target.classList.add('tapped');
        setTimeout(() => target.classList.remove('tapped'), 100);

        gameState.cookingScore += 3;
        document.getElementById('cooking-score').textContent = gameState.cookingScore;

        const progress = Math.min(gameState.miniGameData.taps / gameState.miniGameData.targetTaps * 100, 100);
        fill.style.width = progress + '%';
        document.getElementById('cooking-attempts').textContent = `진행: ${Math.floor(progress)}%`;

        if (progress >= 100) endCookingPhase();
    };

    area.addEventListener('click', handleTap);
    area.addEventListener('touchstart', (e) => { e.preventDefault(); handleTap(); });

    setTimeout(() => { if (gameState.phase === 2 && gameState.cookingMiniGameType === 'tapping') endCookingPhase(); }, 10000);
}
