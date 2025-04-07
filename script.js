document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando Aventura del Capibara v1.3 (Música Corregida)...");

    // --- Obtener Elementos del DOM ---
    const canvas = document.getElementById('gameCanvas');
    const instructions = document.getElementById('instructions');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const backgroundMusic = document.getElementById('background-music');

    // Validaciones de elementos...
    if (!canvas || !instructions || !scoreElement || !levelElement) { /* ... Error ... */ return; }
    if (!backgroundMusic) { console.warn("Elemento audio 'background-music' no encontrado. Sin música."); }
    const ctx = canvas.getContext('2d');
    if (!ctx) { /* ... Error Contexto ... */ return; }

    // --- Constantes del Juego (sin cambios) ---
    const canvasWidth = canvas.width; const canvasHeight = canvas.height;
    const capybaraWidth = 40; const capybaraHeight = 30; const capybaraSpeed = 6; const capybaraY = canvasHeight - capybaraHeight - 10;
    const objectWidth = 30; const objectHeight = 30; const coinRadius = 15;
    const initialObjectSpeed = 2.5; const speedIncrementPerLevel = 0.25;
    const spawnIntervalTime = 800; const coinProbability = 0.4;
    const pathWidthRatio = 0.8; const scorePerLevel = 100;

    // --- Variables de Estado del Juego ---
    let capybaraX; let objects; let score; let level; let objectSpeed;
    let isGameOver; let animationFrameId = null; let spawnIntervalId = null;
    let gameOverMessageElement = null; let keys = {};
    let musicStarted = false; // <-- NUEVO FLAG para controlar inicio de música

    // --- Control de Teclado (Modificado para iniciar música) ---
    window.addEventListener('keydown', (e) => {
        if (!isGameOver && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            keys[e.key] = true;
            e.preventDefault();
            // *** INTENTAR INICIAR MÚSICA EN LA PRIMERA TECLA ***
            if (!musicStarted) {
                console.log("Intentando iniciar música por primera pulsación de tecla...");
                playAudio();
            }
            // **************************************************
        }
    });
    window.addEventListener('keyup', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = false; } });

    // --- Funciones de Control de Audio (Modificada playAudio) ---
    function playAudio() {
        // Solo intentar si existe el elemento y la música no ha sido iniciada con éxito antes
        if (backgroundMusic && !musicStarted) {
             // Usamos una promesa para manejar el play() asíncrono
             const playPromise = backgroundMusic.play();

             if (playPromise !== undefined) {
                 playPromise.then(() => {
                     // ¡Éxito! La música está sonando.
                     console.log("Música iniciada con éxito.");
                     musicStarted = true; // Marcar que ya inició
                 }).catch(error => {
                     // Falló (probablemente por falta de interacción)
                     console.warn("playAudio() bloqueado por el navegador (esperando interacción):", error.name);
                     musicStarted = false; // Asegurarse de que sigue false para reintentar
                 });
             } else {
                 // Algunos navegadores muy viejos podrían no devolver promesa
                 // Intentar de forma simple (menos robusto)
                 try {
                     backgroundMusic.play();
                     musicStarted = true;
                     console.log("Música iniciada (método alternativo).");
                 } catch (err) {
                      console.warn("playAudio() falló (método alternativo):", err.name);
                      musicStarted = false;
                 }
             }
        } else if (backgroundMusic && musicStarted && backgroundMusic.paused) {
            // Si la música ya inició antes pero está pausada (ej. por game over), reanudar
             backgroundMusic.play().catch(error => console.error("Error al reanudar música:", error));
             console.log("Reanudando música...");
        }
    }

    function pauseAudio() {
        if (backgroundMusic && !backgroundMusic.paused) {
            backgroundMusic.pause();
             console.log("Música pausada.");
            // NO reiniciar currentTime aquí, para poder reanudar si se reinicia rápido
        }
    }

     function stopAndResetAudio() {
        if (backgroundMusic) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0; // Reiniciar al principio
            musicStarted = false; // Permitir que se intente iniciar de nuevo en el próximo juego
            console.log("Música detenida y reseteada.");
        }
    }


    // --- Funciones de Dibujo (sin cambios) ---
    function drawCapybara() { /* ... */ }
    function drawObstacle(obstacle) { /* ... */ }
    function drawCoin(coin) { /* ... */ }
    function drawBackground() { /* ... */ }
    // (Código completo para referencia)
    function drawCapybara() { ctx.fillStyle = '#8B4513'; ctx.fillRect(capybaraX, capybaraY, capybaraWidth, capybaraHeight); ctx.strokeStyle = '#5e2d0a'; ctx.lineWidth = 2; ctx.strokeRect(capybaraX, capybaraY, capybaraWidth, capybaraHeight); ctx.fillStyle = '#000000'; ctx.fillRect(capybaraX + 8, capybaraY + 8, 5, 5); ctx.fillRect(capybaraX + capybaraWidth - 13, capybaraY + 8, 5, 5); ctx.fillStyle = '#5e2d0a'; ctx.fillRect(capybaraX + (capybaraWidth / 2) - 5, capybaraY + 15, 10, 5); }
    function drawObstacle(obstacle) { if (obstacle.type === 'rock') { ctx.fillStyle = '#696969'; ctx.beginPath(); ctx.moveTo(obstacle.x, obstacle.y + objectHeight / 2); ctx.lineTo(obstacle.x + objectWidth / 3, obstacle.y); ctx.lineTo(obstacle.x + (objectWidth * 2 / 3), obstacle.y); ctx.lineTo(obstacle.x + objectWidth, obstacle.y + objectHeight / 2); ctx.lineTo(obstacle.x + (objectWidth * 2 / 3), obstacle.y + objectHeight); ctx.lineTo(obstacle.x + objectWidth / 3, obstacle.y + objectHeight); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#4d4d4d'; ctx.lineWidth = 1; ctx.stroke(); } else { ctx.fillStyle = '#8B4513'; ctx.fillRect(obstacle.x, obstacle.y, objectWidth, objectHeight); ctx.strokeStyle = '#5e2d0a'; ctx.lineWidth = 2; ctx.strokeRect(obstacle.x, obstacle.y, objectWidth, objectHeight); ctx.fillStyle = '#5e2d0a'; ctx.fillRect(obstacle.x + 5, obstacle.y, 3, objectHeight); ctx.fillRect(obstacle.x + objectWidth - 8, obstacle.y, 3, objectHeight); } }
    function drawCoin(coin) { ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.beginPath(); ctx.arc(coin.x + coinRadius + 1, coin.y + coinRadius + 1, coinRadius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(coin.x + coinRadius, coin.y + coinRadius, coinRadius, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e6ac00'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#FFFFE0'; ctx.beginPath(); ctx.arc(coin.x + coinRadius * 0.7, coin.y + coinRadius * 0.7, coinRadius * 0.4, 0, Math.PI * 2); ctx.fill(); }
    function drawBackground() { ctx.fillStyle = '#2c3e50'; ctx.fillRect(0, 0, canvasWidth, canvasHeight); const pathWidth = canvasWidth * pathWidthRatio; const pathX = (canvasWidth - pathWidth) / 2; const treeWidth = (canvasWidth - pathWidth) / 2; ctx.fillStyle = '#2d5a2d'; ctx.fillRect(0, 0, treeWidth, canvasHeight); ctx.fillRect(pathX + pathWidth, 0, treeWidth, canvasHeight); ctx.strokeStyle = '#1e3c1e'; ctx.lineWidth = 4; for (let tx = treeWidth / 3; tx < treeWidth; tx += treeWidth / 2) { ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, canvasHeight); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pathX + pathWidth + tx, 0); ctx.lineTo(pathX + pathWidth + tx, canvasHeight); ctx.stroke(); } ctx.fillStyle = '#6b4f3a'; ctx.fillRect(pathX, 0, pathWidth, canvasHeight); ctx.strokeStyle = '#9d7a5c'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(canvasWidth / 2, 0); ctx.lineTo(canvasWidth / 2, canvasHeight); ctx.stroke(); ctx.setLineDash([]); }


    // --- Funciones de Lógica del Juego (sin cambios) ---
    function spawnObject() { /* ... */ }
    function updatePlayer() { /* ... */ }
    function updateObjects() { /* ... */ }
    // (Código completo para referencia)
    function spawnObject() { if (isGameOver) return; const pathWidth = canvasWidth * pathWidthRatio; const pathX = (canvasWidth - pathWidth) / 2; const isCoin = Math.random() < coinProbability; let newObject = {}; if (isCoin) { const spawnAreaWidth = pathWidth - (coinRadius * 2); newObject = { x: pathX + Math.random() * spawnAreaWidth, y: -(coinRadius * 2), type: 'coin', isObstacle: false, width: coinRadius * 2, height: coinRadius * 2 }; } else { const spawnAreaWidth = pathWidth - objectWidth; const obstacleType = Math.random() < 0.5 ? 'rock' : 'log'; newObject = { x: pathX + Math.random() * spawnAreaWidth, y: -objectHeight, type: obstacleType, isObstacle: true, width: objectWidth, height: objectHeight }; } objects.push(newObject); }
    function updatePlayer() { if (keys['ArrowLeft'] && capybaraX > 0) { capybaraX -= capybaraSpeed; if (capybaraX < 0) capybaraX = 0; } if (keys['ArrowRight'] && capybaraX < canvasWidth - capybaraWidth) { capybaraX += capybaraSpeed; if (capybaraX > canvasWidth - capybaraWidth) capybaraX = canvasWidth - capybaraWidth; } }
    function updateObjects() { for (let i = objects.length - 1; i >= 0; i--) { const obj = objects[i]; obj.y += objectSpeed; if ( capybaraX < obj.x + obj.width && capybaraX + capybaraWidth > obj.x && capybaraY < obj.y + obj.height && capybaraY + capybaraHeight > obj.y ) { if (obj.isObstacle) { console.log(`¡COLISIÓN con ${obj.type}!`); gameOver(); return; } else { score += 10; scoreElement.textContent = score; console.log(`¡MONEDA recogida! Puntos: ${score}`); objects.splice(i, 1); if (score > 0 && score % scorePerLevel === 0) { level++; levelElement.textContent = level; objectSpeed += speedIncrementPerLevel; console.log(`¡NIVEL ${level} ALCANZADO! Velocidad aumentada a: ${objectSpeed.toFixed(2)}`); } } } if (obj.y > canvasHeight) { objects.splice(i, 1); } } }


    // --- Funciones de Control de Estado del Juego (Modificado gameOver) ---
    function showGameOverMessage() { /* ... sin cambios ... */ }
    function hideGameOverMessage() { /* ... sin cambios ... */ }
    // (Código completo para referencia)
    function showGameOverMessage() { if (!gameOverMessageElement) { gameOverMessageElement = document.createElement('div'); gameOverMessageElement.textContent = '¡HAS PERDIDO!'; gameOverMessageElement.className = 'game-over-text'; document.body.appendChild(gameOverMessageElement); } gameOverMessageElement.style.display = 'block'; const canvasRect = canvas.getBoundingClientRect(); const messageTop = canvasRect.top + canvasHeight * 0.5; const messageLeft = canvasRect.left + canvasWidth / 2; gameOverMessageElement.style.top = `${messageTop}px`; gameOverMessageElement.style.left = `${messageLeft}px`; gameOverMessageElement.style.transform = 'translate(-50%, -50%)'; instructions.textContent = "¡Clic en la pantalla para jugar de nuevo!"; canvas.addEventListener('click', restartGame, { once: true }); console.log("Mensaje Game Over mostrado. Listener de reinicio añadido."); }
    function hideGameOverMessage() { if (gameOverMessageElement) { gameOverMessageElement.style.display = 'none'; } instructions.textContent = "Usa ⬅️ y ➡️ para moverte. Clic para reiniciar si pierdes."; }


    function gameOver() {
        console.log("Función gameOver ejecutada.");
        isGameOver = true;
        // *** Usar stopAndResetAudio para detener Y resetear al perder ***
        stopAndResetAudio();
        // **************************************************************
        if (spawnIntervalId) { clearInterval(spawnIntervalId); spawnIntervalId = null; console.log("Intervalo de spawn detenido."); }
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; console.log("Animación detenida."); }
        showGameOverMessage();
    }

    function restartGame() {
         console.log("--- REINICIANDO JUEGO ---");
         hideGameOverMessage();
         // startGame ahora intentará iniciar el audio de nuevo
         startGame();
    }

    function gameLoop() { /* ... sin cambios ... */
        if (isGameOver) return; updatePlayer(); updateObjects(); if (isGameOver) return; drawBackground(); drawCapybara(); objects.forEach(obj => { if (obj.type === 'coin') drawCoin(obj); else drawObstacle(obj); }); animationFrameId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
        console.log("Iniciando/Reiniciando variables y procesos...");
        // Estado inicial
        capybaraX = (canvasWidth - capybaraWidth) / 2; objects = []; score = 0; level = 1;
        objectSpeed = initialObjectSpeed; isGameOver = false; keys = {};

        // Actualizar UI inicial
        scoreElement.textContent = score; levelElement.textContent = level;

        // Limpiar procesos anteriores
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
        if (spawnIntervalId) { clearInterval(spawnIntervalId); spawnIntervalId = null; }

        // Asegurarse de que la música está detenida y lista para intentar iniciar
        // (stopAndResetAudio maneja el flag musicStarted = false)
        stopAndResetAudio();

        // Iniciar nuevos procesos
        spawnIntervalId = setInterval(spawnObject, spawnIntervalTime);
        console.log(`Intervalo de spawn iniciado (ID: ${spawnIntervalId})`);
        animationFrameId = requestAnimationFrame(gameLoop);
        console.log(`Bucle de animación iniciado (ID: ${animationFrameId})`);
        console.log(`Velocidad inicial: ${objectSpeed.toFixed(2)}`);

        // *** Intentar iniciar música DESPUÉS de reiniciar procesos ***
        // Es posible que el clic de reinicio ya cuente como interacción
         console.log("Intentando iniciar música al empezar/reiniciar...");
         playAudio();
        // ************************************************************
    }

    // --- Iniciar el juego por primera vez ---
    // Ya no necesitamos el setTimeout, la interacción con teclado o clic se encargará
    startGame();
    console.log("Juego inicializado. Esperando interacción para iniciar música si es necesario.");


}); // Fin del addEventListener('DOMContentLoaded')