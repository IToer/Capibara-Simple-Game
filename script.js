document.addEventListener('DOMContentLoaded', () => {
    console.log("Iniciando Aventura del Capibara v1.1...");

    // --- Obtener Elementos del DOM ---
    const canvas = document.getElementById('gameCanvas');
    const instructions = document.getElementById('instructions');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level'); // Elemento para el nivel

    // Validar existencia de elementos cruciales
    if (!canvas || !instructions || !scoreElement || !levelElement) {
        console.error("¡Error Fatal! No se encuentran elementos esenciales del DOM (canvas, instructions, score o level).");
        if (document.body) document.body.innerHTML = "<h1 style='color:red;'>Error al cargar el juego. Faltan elementos HTML.</h1>";
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("¡Error Fatal! No se puede obtener el contexto 2D.");
        if (canvas) canvas.outerHTML = "<p style='color:red; font-weight:bold;'>Error: Tu navegador no soporta Canvas 2D.</p>";
        return;
    }

    // --- Constantes del Juego ---
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    // Capibara
    const capybaraWidth = 40; const capybaraHeight = 30; const capybaraSpeed = 6;
    const capybaraY = canvasHeight - capybaraHeight - 10;
    // Objetos
    const objectWidth = 30; const objectHeight = 30; const coinRadius = 15;
    const initialObjectSpeed = 2.5; // Velocidad inicial ligeramente ajustada
    const speedIncrementPerLevel = 0.25; // Cuánto aumenta la velocidad por nivel
    const spawnIntervalTime = 800;
    const coinProbability = 0.4;
    const pathWidthRatio = 0.8;
    const scorePerLevel = 100; // Puntos necesarios para subir de nivel

    // --- Variables de Estado del Juego ---
    let capybaraX; let objects; let score; let level; let objectSpeed; // <-- objectSpeed ahora es variable
    let isGameOver; let animationFrameId = null; let spawnIntervalId = null;
    let gameOverMessageElement = null; let keys = {};

    // --- Control de Teclado (sin cambios) ---
    window.addEventListener('keydown', (e) => { if (!isGameOver && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { keys[e.key] = true; e.preventDefault(); } });
    window.addEventListener('keyup', (e) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = false; } });

    // --- Funciones de Dibujo ---
    function drawCapybara() {
        // Sombra simple (opcional)
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        // ctx.fillRect(capybaraX + 2, capybaraY + 2, capybaraWidth, capybaraHeight);

        // Cuerpo
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(capybaraX, capybaraY, capybaraWidth, capybaraHeight);
        // Borde oscuro para definir
        ctx.strokeStyle = '#5e2d0a'; // Marrón oscuro
        ctx.lineWidth = 2;
        ctx.strokeRect(capybaraX, capybaraY, capybaraWidth, capybaraHeight);
        // Ojos
        ctx.fillStyle = '#000000';
        ctx.fillRect(capybaraX + 8, capybaraY + 8, 5, 5);
        ctx.fillRect(capybaraX + capybaraWidth - 13, capybaraY + 8, 5, 5);
        // Nariz
        ctx.fillStyle = '#5e2d0a';
        ctx.fillRect(capybaraX + (capybaraWidth / 2) - 5, capybaraY + 15, 10, 5);
    }

    function drawObstacle(obstacle) {
        // Sombra simple
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        // ctx.fillRect(obstacle.x + 2, obstacle.y + 2, objectWidth, objectHeight);

        if (obstacle.type === 'rock') {
            ctx.fillStyle = '#696969'; ctx.beginPath(); ctx.moveTo(obstacle.x, obstacle.y + objectHeight / 2); ctx.lineTo(obstacle.x + objectWidth / 3, obstacle.y); ctx.lineTo(obstacle.x + (objectWidth * 2 / 3), obstacle.y); ctx.lineTo(obstacle.x + objectWidth, obstacle.y + objectHeight / 2); ctx.lineTo(obstacle.x + (objectWidth * 2 / 3), obstacle.y + objectHeight); ctx.lineTo(obstacle.x + objectWidth / 3, obstacle.y + objectHeight); ctx.closePath(); ctx.fill();
            // Borde roca
             ctx.strokeStyle = '#4d4d4d'; ctx.lineWidth = 1; ctx.stroke();
        } else { // log
            ctx.fillStyle = '#8B4513'; ctx.fillRect(obstacle.x, obstacle.y, objectWidth, objectHeight);
            // Borde tronco
            ctx.strokeStyle = '#5e2d0a'; ctx.lineWidth = 2; ctx.strokeRect(obstacle.x, obstacle.y, objectWidth, objectHeight);
             // Textura
            ctx.fillStyle = '#5e2d0a'; ctx.fillRect(obstacle.x + 5, obstacle.y, 3, objectHeight); ctx.fillRect(obstacle.x + objectWidth - 8, obstacle.y, 3, objectHeight);
        }
    }

     function drawCoin(coin) {
        // Sombra moneda
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath(); ctx.arc(coin.x + coinRadius + 1, coin.y + coinRadius + 1, coinRadius, 0, Math.PI * 2); ctx.fill();

        // Moneda
        ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(coin.x + coinRadius, coin.y + coinRadius, coinRadius, 0, Math.PI * 2); ctx.fill();
        // Borde moneda
        ctx.strokeStyle = '#e6ac00'; ctx.lineWidth = 2; ctx.stroke();
        // Brillo
        ctx.fillStyle = '#FFFFE0'; ctx.beginPath(); ctx.arc(coin.x + coinRadius * 0.7, coin.y + coinRadius * 0.7, coinRadius * 0.4, 0, Math.PI * 2); ctx.fill();
    }

    function drawBackground() {
        // Fondo exterior (simulando cielo oscuro o similar)
        ctx.fillStyle = '#2c3e50'; // Azul noche oscuro
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const pathWidth = canvasWidth * pathWidthRatio;
        const pathX = (canvasWidth - pathWidth) / 2;

        // Dibujar "árboles" simples a los lados
        const treeWidth = (canvasWidth - pathWidth) / 2; // Ancho de la zona lateral
        ctx.fillStyle = '#2d5a2d'; // Verde muy oscuro para árboles
        ctx.fillRect(0, 0, treeWidth, canvasHeight); // Izquierda
        ctx.fillRect(pathX + pathWidth, 0, treeWidth, canvasHeight); // Derecha
        // Añadir alguna "textura" simple a los árboles (líneas verticales)
        ctx.strokeStyle = '#1e3c1e'; // Verde aún más oscuro
        ctx.lineWidth = 4;
        for (let tx = treeWidth / 3; tx < treeWidth; tx += treeWidth / 2) {
            ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, canvasHeight); ctx.stroke(); // Izquierda
            ctx.beginPath(); ctx.moveTo(pathX + pathWidth + tx, 0); ctx.lineTo(pathX + pathWidth + tx, canvasHeight); ctx.stroke(); // Derecha
        }

        // Camino
        ctx.fillStyle = '#6b4f3a'; // Marrón tierra para el camino
        ctx.fillRect(pathX, 0, pathWidth, canvasHeight);
        // Línea central (más sutil)
        ctx.strokeStyle = '#9d7a5c'; // Marrón más claro
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(canvasWidth / 2, 0); ctx.lineTo(canvasWidth / 2, canvasHeight); ctx.stroke();
        ctx.setLineDash([]);
    }

    // --- Funciones de Lógica del Juego ---
    function spawnObject() { /* ... sin cambios respecto a la v. anterior ... */
        if (isGameOver) return;
        const pathWidth = canvasWidth * pathWidthRatio; const pathX = (canvasWidth - pathWidth) / 2;
        const isCoin = Math.random() < coinProbability; let newObject = {};
        if (isCoin) { const spawnAreaWidth = pathWidth - (coinRadius * 2); newObject = { x: pathX + Math.random() * spawnAreaWidth, y: -(coinRadius * 2), type: 'coin', isObstacle: false, width: coinRadius * 2, height: coinRadius * 2 }; }
        else { const spawnAreaWidth = pathWidth - objectWidth; const obstacleType = Math.random() < 0.5 ? 'rock' : 'log'; newObject = { x: pathX + Math.random() * spawnAreaWidth, y: -objectHeight, type: obstacleType, isObstacle: true, width: objectWidth, height: objectHeight }; }
        objects.push(newObject);
    }

    function updatePlayer() { /* ... sin cambios ... */
        if (keys['ArrowLeft'] && capybaraX > 0) { capybaraX -= capybaraSpeed; if (capybaraX < 0) capybaraX = 0; }
        if (keys['ArrowRight'] && capybaraX < canvasWidth - capybaraWidth) { capybaraX += capybaraSpeed; if (capybaraX > canvasWidth - capybaraWidth) capybaraX = canvasWidth - capybaraWidth; }
    }

    function updateObjects() {
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            obj.y += objectSpeed; // <-- Usa la velocidad actual, que puede cambiar

            if ( capybaraX < obj.x + obj.width && capybaraX + capybaraWidth > obj.x &&
                 capybaraY < obj.y + obj.height && capybaraY + capybaraHeight > obj.y )
            {
                if (obj.isObstacle) {
                    console.log(`¡COLISIÓN con ${obj.type}!`); gameOver(); return;
                } else {
                    score += 10; scoreElement.textContent = score;
                    console.log(`¡MONEDA recogida! Puntos: ${score}`);
                    objects.splice(i, 1);

                    // *** Chequeo de Nivel y Velocidad ***
                    if (score > 0 && score % scorePerLevel === 0) {
                        level++;
                        levelElement.textContent = level;
                        objectSpeed += speedIncrementPerLevel; // Aumentar velocidad
                        console.log(`¡NIVEL ${level} ALCANZADO! Velocidad aumentada a: ${objectSpeed.toFixed(2)}`);
                        // Opcional: Podríamos también ajustar spawnIntervalTime aquí si quisiéramos
                    }
                    // ***********************************
                }
            }

            if (obj.y > canvasHeight) { objects.splice(i, 1); }
        }
    }

    // --- Funciones de Control de Estado del Juego ---
    function showGameOverMessage() { /* ... sin cambios lógicos ... */
        if (!gameOverMessageElement) { gameOverMessageElement = document.createElement('div'); gameOverMessageElement.textContent = '¡HAS PERDIDO!'; gameOverMessageElement.className = 'game-over-text'; document.body.appendChild(gameOverMessageElement); }
        gameOverMessageElement.style.display = 'block';
        const canvasRect = canvas.getBoundingClientRect(); const messageTop = canvasRect.top + canvasHeight * 0.5; const messageLeft = canvasRect.left + canvasWidth / 2; // Centrado verticalmente ahora
        gameOverMessageElement.style.top = `${messageTop}px`; gameOverMessageElement.style.left = `${messageLeft}px`; gameOverMessageElement.style.transform = 'translate(-50%, -50%)'; // Asegurar centrado exacto
        instructions.textContent = "¡Clic en la pantalla para jugar de nuevo!"; canvas.addEventListener('click', restartGame, { once: true }); console.log("Mensaje Game Over mostrado. Listener de reinicio añadido.");
    }
    function hideGameOverMessage() { /* ... sin cambios ... */
        if (gameOverMessageElement) { gameOverMessageElement.style.display = 'none'; } instructions.textContent = "Usa ⬅️ y ➡️ para moverte. Clic para reiniciar si pierdes.";
    }
    function gameOver() { /* ... sin cambios ... */
        console.log("Función gameOver ejecutada."); isGameOver = true; if (spawnIntervalId) { clearInterval(spawnIntervalId); spawnIntervalId = null; console.log("Intervalo de spawn detenido."); } if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; console.log("Animación detenida."); } showGameOverMessage();
    }
    function restartGame() { /* ... sin cambios ... */
         console.log("--- REINICIANDO JUEGO ---"); hideGameOverMessage(); startGame();
    }
    function gameLoop() { /* ... sin cambios lógicos, solo llama a las funciones actualizadas ... */
        if (isGameOver) return;
        updatePlayer(); updateObjects();
        if (isGameOver) return;
        drawBackground(); drawCapybara();
        objects.forEach(obj => { if (obj.type === 'coin') drawCoin(obj); else drawObstacle(obj); });
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
        console.log("Iniciando/Reiniciando variables y procesos...");
        // Estado inicial
        capybaraX = (canvasWidth - capybaraWidth) / 2;
        objects = [];
        score = 0;
        level = 1; // <-- Iniciar Nivel en 1
        objectSpeed = initialObjectSpeed; // <-- Resetear velocidad
        isGameOver = false;
        keys = {};

        // Actualizar UI inicial
        scoreElement.textContent = score;
        levelElement.textContent = level; // <-- Actualizar display de nivel

        // Limpiar procesos anteriores
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
        if (spawnIntervalId) { clearInterval(spawnIntervalId); spawnIntervalId = null; }

        // Iniciar nuevos procesos
        spawnIntervalId = setInterval(spawnObject, spawnIntervalTime);
        console.log(`Intervalo de spawn iniciado (ID: ${spawnIntervalId})`);
        animationFrameId = requestAnimationFrame(gameLoop);
        console.log(`Bucle de animación iniciado (ID: ${animationFrameId})`);
        console.log(`Velocidad inicial: ${objectSpeed.toFixed(2)}`);
    }

    // --- Iniciar el juego por primera vez ---
    startGame();

}); // Fin del addEventListener('DOMContentLoaded')