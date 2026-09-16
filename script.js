// --- DOM Elements ---
const displayArea = document.getElementById("display-area");
const scoreContainer = document.getElementById("score-container");
const scoreDisplay = document.getElementById("score-display");
const categorySelect = document.getElementById("category-select");
const focusSelect = document.getElementById("focus-select");
const focusLabel = document.getElementById("focus-label");
const modeSelect = document.getElementById("mode-select");
const answerInput = document.getElementById("answer-input");
const submitBtn = document.getElementById("submit-btn");

// --- State ---
let dataset = [];
let currentIndex = 0;
let score = 0;
let timerInterval = null;

// --- Initialize App with Random Values ---
function randomizeAndStart() {
  // Array of 6 items: 3 tables (50%), 1 squares (16.6%), 1 cubes (16.6%), 1 fractions (16.6%)
  const weightedCategories = [
    "tables",
    "tables",
    "tables",
    "squares",
    "cubes",
    "fractions",
  ];

  const cat =
    weightedCategories[Math.floor(Math.random() * weightedCategories.length)];
  categorySelect.value = cat;

  // Populate the focus select based on random category chosen
  populateFocusOptions(cat);

  // Pick random focus number/set from available options
  const options = focusSelect.options;
  focusSelect.value = options[Math.floor(Math.random() * options.length)].value;

  modeSelect.value = "flashcard";
  updateApp();
}

// --- Dynamic Input Population ---
function populateFocusOptions(category) {
  focusSelect.innerHTML = "";

  if (category === "tables") {
    focusLabel.innerText = "Focus Number";
    for (let i = 1; i <= 30; i++) {
      focusSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
  } else if (category === "fractions") {
    focusLabel.innerText = "Focus Number";
    for (let i = 1; i <= 10; i++) {
      focusSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }
  } else if (category === "squares" || category === "cubes") {
    focusLabel.innerText = "Focus Set";
    focusSelect.innerHTML += `<option value="1">Set 1 (1-10)</option>`;
    focusSelect.innerHTML += `<option value="2">Set 2 (11-20)</option>`;
    focusSelect.innerHTML += `<option value="3">Set 3 (21-30)</option>`;
  }
}

// --- Data Generation Logic ---
function generateData() {
  const category = categorySelect.value;
  const focus = parseInt(focusSelect.value) || 1;
  let data = [];

  if (category === "tables") {
    for (let i = 1; i <= 10; i++)
      data.push({ q: `${focus} × ${i}`, a: focus * i });
  } else if (category === "squares") {
    let start = (focus - 1) * 10 + 1;
    let end = focus * 10;
    for (let i = start; i <= end; i++) data.push({ q: `${i}²`, a: i * i });
  } else if (category === "cubes") {
    let start = (focus - 1) * 10 + 1;
    let end = focus * 10;
    for (let i = start; i <= end; i++)
      data.push({ q: `${i}³`, a: Math.pow(i, 3) });
  } else if (category === "fractions") {
    // If the focus is 1, treat it as a 2 so it returns actual fractions.
    const denom = focus === 1 ? 2 : focus;

    // Always show 1 through 10 in the numerator
    for (let i = 1; i <= 10; i++) {
      let dec = +(i / denom).toFixed(3);
      data.push({ q: `${i} / ${denom}`, a: dec });
    }
  }
  return data;
}

// --- Render Controllers ---
function updateApp() {
  clearInterval(timerInterval);

  const mode = modeSelect.value;

  // Hide score container during flashcard mode
  if (mode === "quiz") {
    scoreContainer.classList.remove("hidden");
  } else {
    scoreContainer.classList.add("hidden");
  }

  dataset = generateData();
  currentIndex = 0;
  score = 0;
  scoreDisplay.innerText = `0 / ${Math.min(5, dataset.length)} (Flashcards) / ${dataset.length} (Total)`; // Reset score display visually

  if (mode === "learning") {
    renderLearningGrid();
    disableInputs(true);
  } else if (mode === "flashcard") {
    // Shuffle and slice to a maximum of 5
    dataset = [...dataset].sort(() => 0.5 - Math.random()).slice(0, 5);
    renderFlashcard();
    disableInputs(true);
  } else if (mode === "quiz") {
    scoreDisplay.innerText = `0 / ${dataset.length}`;
    renderQuizGrid();
    disableInputs(false);
    highlightQuizItem();
  }
}

// 1. Learning Mode (Static 2-column Grid - Flows Vertically)
function renderLearningGrid() {
  displayArea.innerHTML = `<div class="learning-grid">
    ${dataset
      .map(
        (item) => `
      <div class="grid-item">
        ${item.q} = ${item.a}
      </div>
    `,
      )
      .join("")}
  </div>`;
}

// 2. Flashcard Mode (3s Timer)
function renderFlashcard() {
  if (currentIndex >= dataset.length) {
    modeSelect.value = "learning";
    updateApp();
    return;
  }

  const item = dataset[currentIndex];

  displayArea.innerHTML = `
    <div class="flashcard-container">
      <div id="flash-timer" class="flashcard-timer">3s</div>
      <div class="flashcard-q">${item.q}</div>
      <div id="flash-answer" class="flashcard-a hidden">${item.a}</div>
    </div>
  `;

  let timeLeft = 3;
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("flash-timer").innerText = `${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      document.getElementById("flash-answer").classList.remove("hidden");
      setTimeout(() => {
        currentIndex++;
        renderFlashcard();
      }, 1500);
    }
  }, 1000);
}

// 3. Manual Quiz Mode (Interactive Grid)
function renderQuizGrid() {
  displayArea.innerHTML = `<div class="learning-grid" id="quiz-grid">
    ${dataset
      .map(
        (item, idx) => `
      <div class="grid-item" id="quiz-item-${idx}">
        ${item.q} = <span class="quiz-ans">?</span>
      </div>
    `,
      )
      .join("")}
  </div>`;
  setTimeout(() => answerInput.focus(), 100);
}

function highlightQuizItem() {
  if (currentIndex >= dataset.length) {
    disableInputs(true);
    return;
  }
  document
    .querySelectorAll(".grid-item")
    .forEach((el) => el.classList.remove("active-quiz"));
  document
    .getElementById(`quiz-item-${currentIndex}`)
    .classList.add("active-quiz");
  answerInput.value = "";
  answerInput.focus();
}

function submitAnswer() {
  if (modeSelect.value !== "quiz" || currentIndex >= dataset.length) return;

  const userAnswer = parseFloat(answerInput.value);
  const correctAnswer = dataset[currentIndex].a;
  const activeEl = document.getElementById(`quiz-item-${currentIndex}`);
  const ansSpan = activeEl.querySelector(".quiz-ans");

  ansSpan.innerText = correctAnswer;

  if (userAnswer === correctAnswer) {
    activeEl.classList.add("correct");
    score++;
  } else {
    activeEl.classList.add("wrong");
  }

  scoreDisplay.innerText = `${score} / ${dataset.length}`;
  currentIndex++;
  highlightQuizItem();
}

// --- Utility ---
function disableInputs(disabled) {
  answerInput.disabled = disabled;
  submitBtn.disabled = disabled;
}

// --- Event Listeners ---

// Update the focus dropdown when category changes
categorySelect.addEventListener("change", (e) => {
  populateFocusOptions(e.target.value);
  updateApp();
});

focusSelect.addEventListener("change", updateApp);
modeSelect.addEventListener("change", updateApp);

submitBtn.addEventListener("click", submitAnswer);
answerInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") submitAnswer();
});

// Initialize on page load
window.addEventListener("DOMContentLoaded", randomizeAndStart);
