// Selecteer het canvas en context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Stel canvas afmetingen in
canvas.width = 800;
canvas.height = 600;

// Canvas centreren op het scherm
canvas.style.position = "absolute";
canvas.style.left = `${(window.innerWidth - canvas.width) / 2}px`;
canvas.style.top = `${(window.innerHeight - canvas.height) / 2}px`;
canvas.style.border = "2px solid white"; // Witte lijn om het canvas

// Virtueel achtergrondgebied (groter dan het canvas)
const virtualWidth = canvas.width * 2; // 2x de canvas-breedte
const virtualHeight = canvas.height * 2; // 2x de canvas-hoogte

// Array voor sterren
const stars = [];
const starCount = 300; // Aantal sterren

// Initialiseer sterren
function initializeStars() {
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * virtualWidth - canvas.width / 2, // Positie buiten het canvas
      y: Math.random() * virtualHeight - canvas.height / 2, // Positie buiten het canvas
      size: Math.random() * 2 + 1, // Grootte tussen 1 en 3 pixels
      speed: Math.random() * 2 + 1, // Snelheid tussen 1 en 3 pixels per frame
    });
  }
}

// Update sterren
function updateStars() {
  stars.forEach((star) => {
    // Beweeg ster naar het midden van het scherm (speler)
    star.x += (canvas.width / 2 - star.x) * 0.02; // Langzame beweging naar het midden
    star.y += (canvas.height / 2 - star.y) * 0.02;
    // Verwijder sterren die het speelveld bereiken
    if (
      star.x > -canvas.width / 2 &&
      star.x < canvas.width / 2 &&
      star.y > -canvas.height / 2 &&
      star.y < canvas.height / 2
    ) {
      // Reset ster naar een nieuwe positie buiten het speelveld
      star.x = Math.random() * virtualWidth - canvas.width / 2;
      star.y = Math.random() * virtualHeight - canvas.height / 2;
    }
  });
}

// Teken sterren
function drawStars() {
  ctx.fillStyle = "white";
  stars.forEach((star) => {
    // Teken sterren alleen buiten het speelveld
    if (
      star.x < -canvas.width / 2 ||
      star.x > canvas.width / 2 ||
      star.y < -canvas.height / 2 ||
      star.y > canvas.height / 2
    ) {
      ctx.fillRect(
        star.x + canvas.width / 2,
        star.y + canvas.height / 2,
        star.size,
        star.size
      );
    }
  });
}

// Globale variabelen
let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;
let gameStarted = false;

// Speler instellingen
const player = {
  width: 20, // Verkleinde breedte
  height: 20, // Verkleinde hoogte
  x: canvas.width / 2 - 10, // Aangepaste startpositie (midden van het scherm)
  y: canvas.height - 40, // Aangepaste startpositie (dichter bij de onderkant)
  speed: 5,
  image: new Image(),
};

// Vijanden instellingen
const enemies = [];
const enemyCols = 8;
let enemyRows = 1;
const enemyWidth = 40;
const enemyHeight = 40;
const enemyPadding = 20;
let enemySpeed = 1;
let enemyDirection = 1;
const enemyVerticalSpeed = 20;

// Kogels instellingen
const bullets = [];
const enemyBullets = [];
const bulletSpeed = 7;
const enemyBulletSpeed = 3;

// Explosies instellingen
const explosions = [];
const explosionDuration = 20; // Duur van explosies in frames

// Functie om een explosie toe te voegen
function addExplosion(x, y) {
  explosions.push({
    x: x,
    y: y,
    radius: 0, // Begin met een kleine radius
    alpha: 1.0, // Begin met volle transparantie
    duration: explosionDuration,
  });
}

// Update functie voor explosies
function updateExplosions() {
  explosions.forEach((explosion, index) => {
    if (explosion.duration > 0) {
      explosion.radius += 3; // Maak de explosie kleiner door de increment te verlagen
      explosion.alpha -= 1 / explosionDuration; // Verminder de transparantie
      explosion.duration--; // Verminder de duur
    } else {
      explosions.splice(index, 1); // Verwijder de explosie na afloop
    }
  });
}

// Teken functie voor explosies
function drawExplosions() {
  ctx.save(); // Sla de huidige context op
  explosions.forEach((explosion) => {
    const outerRadius = explosion.radius * 0.8; // Buitenste laag (geel)
    const innerRadius = explosion.radius * 0.6; // Binnenste laag (oranje)

    // Teken buitenste laag (geel)
    ctx.globalAlpha = explosion.alpha * 0.8; // Transparantie voor de buitenste laag
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Teken binnenste laag (oranje)
    ctx.globalAlpha = explosion.alpha * 1.0; // Transparantie voor de binnenste laag
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, innerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Teken kern (rood)
    ctx.globalAlpha = explosion.alpha * 1.2; // Transparantie voor de kern
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore(); // Herstel de context
}

// Laad afbeeldingen
player.image.src = "player.png"; // Zorg ervoor dat 'player.png' beschikbaar is
const enemyImage = new Image();
enemyImage.src = "enemy.png"; // Zorg ervoor dat 'enemy.png' beschikbaar is

// Functie om de start modal te tonen
function showStartModal() {
  const startModal = document.getElementById("startModal");
  startModal.style.display = "block";
  document.getElementById("startButton").addEventListener("click", () => {
    startModal.style.display = "none";
    gameStarted = true;
    initializeEnemies();
    initializeStars(); // Initialiseer sterren
    enemyShootingTimer = setInterval(allEnemiesShoot, 2000); // Alle vijanden schieten elke 2 seconden
    gameLoop();
  });
}

// Functie voor alle vijanden om tegelijk te schieten
function allEnemiesShoot() {
  if (!gameStarted || gameOver) return;
  enemies.forEach((enemy) => {
    if (enemy.alive) {
      const bullet = {
        x: enemy.x + enemy.width / 2 - 2,
        y: enemy.y + enemy.height,
        width: 4,
        height: 10,
        color: "green",
        dy: enemyBulletSpeed,
        enemyId: enemy.id, // Koppel kogel aan vijand ID
      };
      enemyBullets.push(bullet);
    }
  });
}

// Functie om de game over modal te tonen
function showGameOverModal() {
  const gameOverModal = document.getElementById("gameOverModal");
  document.getElementById("finalScore").textContent = `Score: ${score}`;
  document.getElementById("finalLevel").textContent = `Level bereikt: ${level}`;
  gameOverModal.style.display = "block";
  document.getElementById("restartButton").addEventListener("click", () => {
    gameOverModal.style.display = "none";
    resetGame();
  });
}

// Functie om het spel te resetten
function resetGame() {
  score = 0;
  lives = 3;
  level = 1;
  gameOver = false;
  player.x = canvas.width / 2 - player.width / 2;
  bullets.length = 0;
  enemyBullets.length = 0;
  explosions.length = 0; // Reset explosies
  enemySpeed = 1;
  enemyRows = 1;
  clearInterval(enemyShootingTimer);
  initializeEnemies();
  initializeStars(); // Herinitialiseer sterren
  enemyShootingTimer = setInterval(allEnemiesShoot, 2000); // Vaste interval van 2 seconden
  gameLoop();
}

// Functie om de vijanden te initialiseren
function initializeEnemies() {
  enemies.length = 0;
  let idCounter = 0;
  for (let row = 0; row < enemyRows; row++) {
    for (let col = 0; col < enemyCols; col++) {
      enemies.push({
        id: idCounter++,
        x: col * (enemyWidth + enemyPadding) + enemyPadding,
        y: row * (enemyHeight + enemyPadding) + enemyPadding + 50,
        width: enemyWidth,
        height: enemyHeight,
        alive: true,
      });
    }
  }
}

// Event listeners voor toetsenbord
let keys = {};
let shootingInterval = null;
let enemyShootingTimer = null;

window.addEventListener("keydown", (e) => {
  if (!gameStarted || gameOver) return;
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === " ") {
    keys.space = true;
    if (!shootingInterval) {
      shootingInterval = setInterval(shootBullet, 300);
    }
  }
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === " ") {
    keys.space = false;
    clearInterval(shootingInterval);
    shootingInterval = null;
  }
});

// Functie om een kogel te schieten
function shootBullet() {
  if (!gameStarted || gameOver) return;
  bullets.push({
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    color: "yellow",
    dy: -bulletSpeed,
  });
}

// Functie om alles te tekenen
function draw() {
  // Wis het canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Teken sterren als achtergrond
  drawStars();

  if (!gameStarted) return;

  // Teken speler met afbeelding
  ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

  // Teken vijanden met afbeelding
  enemies.forEach((enemy) => {
    if (enemy.alive) {
      ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
    }
  });

  // Teken kogels
  bullets.forEach((bullet) => {
    ctx.fillStyle = bullet.color;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Teken vijanden-kogels
  enemyBullets.forEach((bullet) => {
    ctx.fillStyle = bullet.color;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Teken explosies
  drawExplosions();

  // Teken score, levens en level
  ctx.fillStyle = "white";
  ctx.font = '22px "Press Start 2P", cursive';
  ctx.fillText(`Score: ${score}`, 10, 30);

  // Teken levens als hartjes
  drawLives();

  ctx.fillText(`Level: ${level}`, canvas.width / 2 - 40, 30);
}

// Functie om de levens visueel weer te geven
function drawLives() {
  const heartSize = 20;
  const heartSpacing = 5;
  const startX = canvas.width - (heartSize + heartSpacing) * lives;
  for (let i = 0; i < lives; i++) {
    const x = startX + i * (heartSize + heartSpacing);
    const y = 10;
    ctx.beginPath();
    ctx.moveTo(x + heartSize / 2, y + heartSize / 4);
    ctx.bezierCurveTo(
      x + heartSize / 2,
      y,
      x,
      y + heartSize / 4,
      x,
      y + heartSize / 2
    );
    ctx.bezierCurveTo(
      x,
      y + (heartSize * 3) / 4,
      x + heartSize / 2,
      y + heartSize,
      x + heartSize / 2,
      y + (heartSize * 3) / 4
    );
    ctx.bezierCurveTo(
      x + heartSize,
      y + (heartSize * 3) / 4,
      x + heartSize,
      y + heartSize / 4,
      x + heartSize / 2,
      y + heartSize / 4
    );
    ctx.closePath();
    ctx.fillStyle = "red";
    ctx.fill();
  }
}

// Functie om de game te updaten
function update() {
  if (!gameStarted || gameOver) return;

  // Update sterren
  updateStars();

  // Update speler positie
  if (keys.left && player.x > 0) player.x -= player.speed;
  if (keys.right && player.x + player.width < canvas.width)
    player.x += player.speed;

  // Update kogels
  bullets.forEach((bullet, i) => {
    bullet.y += bullet.dy;
    if (bullet.y < 0) bullets.splice(i, 1);
  });

  // Update vijanden-kogels
  enemyBullets.forEach((bullet, i) => {
    bullet.y += bullet.dy;
    if (bullet.y > canvas.height) {
      enemyBullets.splice(i, 1);
    } else if (
      bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y
    ) {
      lives--;
      enemyBullets.splice(i, 1);
      if (lives <= 0) {
        gameOver = true;
        showGameOverModal();
      }
    }
  });

  // Update vijanden
  function updateEnemies() {
    let moveDown = false;
    enemies.forEach((enemy) => {
      if (enemy.alive) {
        enemy.x += enemySpeed * enemyDirection;
        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
          moveDown = true;
        }
        if (enemy.y + enemy.height > player.y) {
          gameOver = true;
          showGameOverModal();
        }
      }
    });

    if (moveDown) {
      enemies.forEach((enemy) => {
        if (enemy.alive) {
          enemy.y += enemyVerticalSpeed;
        }
      });
      enemyDirection *= -1;
    }

    // Controleer botsingen tussen kogels en vijanden
    bullets.forEach((bullet, i) => {
      enemies.forEach((enemy, j) => {
        if (
          enemy.alive &&
          bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y
        ) {
          enemy.alive = false;
          bullets.splice(i, 1);

          // Voeg een explosie toe
          addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

          score += 10;

          // Verwijder alle kogels van deze vijand
          for (let k = enemyBullets.length - 1; k >= 0; k--) {
            if (enemyBullets[k].enemyId === enemy.id) {
              enemyBullets.splice(k, 1);
            }
          }
        }
      });
    });

    const aliveEnemies = enemies.filter((enemy) => enemy.alive);
    if (aliveEnemies.length === 0) {
      level++;
      enemySpeed += 0.5;
      enemyRows = Math.min(4, enemyRows + 1);
      clearInterval(enemyShootingTimer);
      enemyShootingTimer = setInterval(allEnemiesShoot, 2000); // Vaste interval van 2 seconden
      initializeEnemies();
    }
  }

  updateEnemies();

  // Update explosies
  updateExplosions();
}

// Hoofd game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Start het spel
showStartModal();
