const gameBoard = document.getElementById("gameBoard");
const movesText = document.getElementById("moves");
const popup = document.getElementById("popup");
const playAgainBtn = document.getElementById("playAgain");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const boardSelect = document.getElementById("boardSize");

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matchedPairs = 0;
let totalPairs = 0;

const pokemonBase =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

// Total number of Pokemon sprites available 
const MAX_POKEMON = 898;

// Convert Pokémon ID to name using PokéAPI
async function idToName(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  return data.name.charAt(0).toUpperCase() + data.name.slice(1);
}

boardSelect.addEventListener("change", () => {
  startBtn.disabled = boardSelect.value === "";
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", resetGame);

async function startGame() {
  const size = Number(boardSelect.value);
  if (!size) return;

  clearBoard();

  totalPairs = (size * size) / 2;
  gameBoard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;


// it always use top pokemon only
  // const cards = [];
  // for (let i = 1; i <= totalPairs; i++) {
  //   cards.push(createCard(i));
  //   cards.push(createCard(i));
  // }

// random Pokémon from entire Pokedex
  const usedIds = new Set();

  // Pick unique random Pokemon IDs
  while (usedIds.size < totalPairs) {
    const randomId = Math.floor(Math.random() * MAX_POKEMON) + 1;
    usedIds.add(randomId);
  }

// Create card promises in parallel
  const cardPromises = [];
  for (const id of usedIds) {
    cardPromises.push(createCard(id));
    cardPromises.push(createCard(id));
  }

  const cards = await Promise.all(cardPromises); // wait for all cards to be created

  shuffle(cards);
  cards.forEach(card => gameBoard.appendChild(card));

  startBtn.disabled = true;
  resetBtn.disabled = false;
}

function clearBoard() {
  stopConfetti();
  popup.style.display = "none";
  gameBoard.innerHTML = "";
  firstCard = secondCard = null;
  lockBoard = false;
  matchedPairs = 0;
  moves = 0;
  movesText.textContent = 0;
}

function resetGame() {
  clearBoard();
  boardSelect.value = "";
  startBtn.disabled = true;
  resetBtn.disabled = true;
}

/* ---------- CARD ---------- */

async function createCard(id) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = id;

  // Capitalize first letter of name
  const pokemonName = await idToName(id);

  card.innerHTML = `
    <div class="front">❓</div>
    <div class="back">
      <img src="${pokemonBase}${id}.png" alt="${pokemonName}">
      <span class="pokemon-name">${pokemonName}</span>
    </div>
  `;

  card.addEventListener("click", () => flipCard(card));
  return card;
}

/* ---------- GAME LOGIC ---------- */

function flipCard(card) {
  if (lockBoard || card === firstCard || card.classList.contains("matched")) return;

  card.classList.add("flipped");

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;
  moves++;
  movesText.textContent = moves;

  checkMatch();
}

function checkMatch() {
  if (firstCard.dataset.id === secondCard.dataset.id) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    matchedPairs++;
    resetTurn();

    if (matchedPairs === totalPairs) winGame();
  } else {
    setTimeout(() => {
      firstCard.classList.remove("flipped");
      secondCard.classList.remove("flipped");
      resetTurn();
    }, 800);
  }
}

function resetTurn() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

/* ---------- WIN ---------- */

function winGame() {
  lockBoard = true;
  popup.style.display = "flex";
  startConfetti();
}

/* ---------- SHUFFLE ---------- */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* ---------- CONFETTI ---------- */

const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let confetti = [];
let confettiActive = false;

function startConfetti() {
  confettiActive = true;
  confetti = [];

  for (let i = 0; i < 200; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * 5 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
  }
  animateConfetti();
}

function stopConfetti() {
  confettiActive = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function animateConfetti() {
  if (!confettiActive) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  confetti.forEach(c => {
    ctx.beginPath();
    ctx.fillStyle = c.color;
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    c.y += c.d;
    if (c.y > canvas.height) c.y = -10;
  });

  requestAnimationFrame(animateConfetti);
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

/* ---------- DARK MODE ---------- */

const themeToggle = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀ Light Mode";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});
