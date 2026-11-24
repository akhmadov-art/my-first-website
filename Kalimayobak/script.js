
const categories = {
    animals: ["ГУРБА", "САГ", "ШЕР", "ПАЛАНГ", "ФИЛ", "ХАРГӮШ", "ГОВ", "АСП", "ГУРГ", "МОР"],
    fruits: ["СЕБ", "НОК", "АНГУР", "АНОР", "ЗАРДОЛУ", "ШАФТОЛУ", "ТУТ", "БАНАН"],
    technology: ["КОМПЮТЕР", "ТЕЛЕФОН", "ИНТЕРНЕТ", "РОБОТ", "БАРНОМА", "КОД", "МОНИТОР", "КЛАВИАТУРА"],
    sports: ["ФУТБОЛ", "ВОЛЕЙБОЛ", "БАСКЕТБОЛ", "ТЕННИС", "БОКС", "ШОҲМОТ", "ДАВИДАН"],
    nature: ["ОФТОБ", "БАРФ", "БОД", "БОРАН", "ДАРЁ", "КӮҲ", "БОРИШ", "БАҲОР", "ТОБИСТОН"]
};

const difficulties = {
    easy: { size: 8, count: 6 },
    medium: { size: 10, count: 8 },
    hard: { size: 12, count: 10 }
};

const directions = [
    [0, 1], [1, 0], [0, -1], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
];

const gridElement = document.getElementById("grid");
const wordListElement = document.getElementById("wordList");
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");
const recordElement = document.getElementById("record");
const messageElement = document.getElementById("message");

let size = 10;
let board = [];
let words = [];
let foundWords = [];
let placements = {};

let score = 0;
let seconds = 0;
let paused = false;
let finished = false;
let soundEnabled = true;

let startCell = null;
let endCell = null;
let currentSelection = [];

let record = Number(localStorage.getItem("kalimaRecord")) || 0;

recordElement.textContent = record;

// Овозҳо
function playSound(frequency = 600) {
    if (!soundEnabled) return;

    try {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.frequency.value = frequency;
        gain.gain.value = 0.08;

        oscillator.start();
        oscillator.stop(audio.currentTime + 0.12);

        oscillator.onended = () => audio.close();
    } catch (error) {
        console.log("Sound unavailable");
    }
}

// Вақт
setInterval(() => {
    if (!paused && !finished) {
        seconds++;

        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;

        timerElement.textContent =
            String(minutes).padStart(2, "0") + ":" +
            String(remaining).padStart(2, "0");
    }
}, 1000);

// Тасодуфӣ
function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Сохтани массиви майдон
function createEmptyBoard() {
    board = Array.from(
        { length: size },
        () => Array(size).fill("")
    );

    placements = {};
}

// Санҷиши ҷойгиршавии калима
function canPlace(word, row, col, dr, dc) {
    for (let i = 0; i < word.length; i++) {
        const r = row + dr * i;
        const c = col + dc * i;

        if (r < 0 || r >= size || c < 0 || c >= size) {
            return false;
        }

        if (board[r][c] !== "" && board[r][c] !== word[i]) {
            return false;
        }
    }

    return true;
}

// Ҷойгир кардани калима
function placeWord(word) {
    for (let attempt = 0; attempt < 500; attempt++) {
        const direction = randomItem(directions);

        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);

        const [dr, dc] = direction;

        if (canPlace(word, row, col, dr, dc)) {
            const cells = [];

            for (let i = 0; i < word.length; i++) {
                const r = row + dr * i;
                const c = col + dc * i;

                board[r][c] = word[i];
                cells.push({ r, c });
            }

            placements[word] = cells;
            return true;
        }
    }

    return false;
}

// Пур кардани ҳарфҳои холӣ
function fillEmptyCells() {
    const letters = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЧШЪЭЮЯӢӮҒҚҶ";

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === "") {
                board[r][c] = randomItem(letters.split(""));
            }
        }
    }
}

// Оғози бозӣ
function startGame() {
    const category = document.getElementById("category").value;
    const difficulty = document.getElementById("difficulty").value;

    size = difficulties[difficulty].size;

    score = 0;
    seconds = 0;
    paused = false;
    finished = false;

    foundWords = [];
    currentSelection = [];

    scoreElement.textContent = score;
    timerElement.textContent = "00:00";
    messageElement.textContent = "Калимаҳои пинҳоншударо пайдо кун!";

    document.getElementById("pauseBtn").textContent = "⏸ Таваққуф";
    document.getElementById("winModal").classList.remove("show");

    createEmptyBoard();

    let availableWords = [];

    if (category === "all") {
        availableWords = Object.values(categories).flat();
    } else {
        availableWords = categories[category];
    }

    const count = Math.min(
        difficulties[difficulty].count,
        availableWords.length
    );

    // Калимаҳои дарозтар аввал ҷойгир мешаванд
    const selectedWords = [...availableWords]
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .sort((a, b) => b.length - a.length);

    words = [];

    for (const word of selectedWords) {
        if (placeWord(word)) {
            words.push(word);
        }
    }

    fillEmptyCells();

    gridElement.style.setProperty("--size", size);
    renderBoard();
    renderWords();
    updateProgress();
}

// Намоиши майдон
function renderBoard() {
    gridElement.innerHTML = "";

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement("div");

            cell.className = "cell";
            cell.textContent = board[r][c];

            cell.dataset.row = r;
            cell.dataset.col = c;

            gridElement.appendChild(cell);
        }
    }
}

// Намоиши калимаҳо
function renderWords() {
    wordListElement.innerHTML = "";

    words.forEach(word => {
        const item = document.createElement("div");

        item.className = "word-item";
        item.textContent = word;

        if (foundWords.includes(word)) {
            item.classList.add("found");
        }

        wordListElement.appendChild(item);
    });
}

// Навсозии пешрафт
function updateProgress() {
    const total = words.length;
    const found = foundWords.length;

    document.getElementById("progress").textContent =
        `${found} / ${total}`;

    document.getElementById("progressBar").style.width =
        (total ? found / total * 100 : 0) + "%";
}

// Гирифтани координатаи ячейка
function getCellFromPoint(x, y) {
    const element = document.elementFromPoint(x, y);

    if (!element) return null;

    const cell = element.closest(".cell");

    if (!cell || !gridElement.contains(cell)) return null;

    return {
        r: Number(cell.dataset.row),
        c: Number(cell.dataset.col)
    };
}

// Сохтани хатти рост аз аввал то охир
function getLine(start, end) {
    const dr = end.r - start.r;
    const dc = end.c - start.c;

    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
        return [];
    }

    const steps = Math.max(Math.abs(dr), Math.abs(dc));

    if (steps === 0) {
        return [{ r: start.r, c: start.c }];
    }

    const rowStep = Math.sign(dr);
    const colStep = Math.sign(dc);

    const cells = [];

    for (let i = 0; i <= steps; i++) {
        cells.push({
            r: start.r + rowStep * i,
            c: start.c + colStep * i
        });
    }

    return cells;
}

// Намоиши интихоб
function showSelection(cells) {
    gridElement.querySelectorAll(".cell.selected")
        .forEach(cell => cell.classList.remove("selected"));

    cells.forEach(pos => {
        const cell = gridElement.querySelector(
            `[data-row="${pos.r}"][data-col="${pos.c}"]`
        );

        if (cell) cell.classList.add("selected");
    });
}

// Оғози интихоб
gridElement.addEventListener("pointerdown", event => {
    if (paused || finished) return;

    const cell = getCellFromPoint(event.clientX, event.clientY);

    if (!cell) return;

    event.preventDefault();

    startCell = cell;
    endCell = cell;

    currentSelection = getLine(startCell, endCell);

    showSelection(currentSelection);
});

// Ҳаракати ангушт ё муш
document.addEventListener("pointermove", event => {
    if (!startCell || paused || finished) return;

    const cell = getCellFromPoint(event.clientX, event.clientY);

    if (!cell) return;

    endCell = cell;
    currentSelection = getLine(startCell, endCell);

    showSelection(currentSelection);
});

// Санҷидани калима
document.addEventListener("pointerup", () => {
    if (!startCell || paused || finished) return;

    if (currentSelection.length > 0) {
        checkSelection(currentSelection);
    }

    startCell = null;
    endCell = null;
    currentSelection = [];

    gridElement.querySelectorAll(".cell.selected")
        .forEach(cell => cell.classList.remove("selected"));
});

// Санҷиши калимаи интихобшуда
function checkSelection(cells) {
    const selectedWord = cells
        .map(pos => board[pos.r][pos.c])
        .join("");

    const reversedWord = selectedWord.split("").reverse().join("");

    const found = words.find(word =>
        (word === selectedWord || word === reversedWord) &&
        !foundWords.includes(word)
    );

    if (!found) {
        messageElement.textContent = "❌ Ин калима дуруст нест. Боз кӯшиш кун!";
        playSound(200);
        return;
    }

    foundWords.push(found);

    score += 10 + Math.max(0, 15 - found.length);

    scoreElement.textContent = score;

    messageElement.textContent = `✅ Офарин! "${found}" ёфт шуд!`;

    playSound(850);

    cells.forEach(pos => {
        const cell = gridElement.querySelector(
            `[data-row="${pos.r}"][data-col="${pos.c}"]`
        );

        if (cell) cell.classList.add("found");
    });

    renderWords();
    updateProgress();

    if (foundWords.length === words.length) {
        finishGame();
    }
}

// Анҷоми бозӣ
function finishGame() {
    finished = true;

    const timeBonus = Math.max(0, 100 - seconds);
    score += timeBonus;

    scoreElement.textContent = score;

    if (score > record) {
        record = score;
        localStorage.setItem("kalimaRecord", record);
        recordElement.textContent = record;
    }

    document.getElementById("finalScore").textContent =
        score + " хол";

    document.getElementById("winModal").classList.add("show");

    messageElement.textContent =
        "🎉 Ҳамаи калимаҳо ёфт шуданд!";

    playSound(1000);
}

// Ёрӣ
document.getElementById("hintBtn").addEventListener("click", () => {
    if (paused || finished) return;

    const remaining = words.filter(word =>
        !foundWords.includes(word)
    );

    if (remaining.length === 0) return;

    const word = randomItem(remaining);
    const cells = placements[word];

    cells.forEach(pos => {
        const cell = gridElement.querySelector(
            `[data-row="${pos.r}"][data-col="${pos.c}"]`
        );

        if (cell) cell.classList.add("hint-cell");
    });

    messageElement.textContent =
        `💡 Ба ҳарфҳои зард нигоҳ кун: ${word}`;

    playSound(500);

    setTimeout(() => {
        cells.forEach(pos => {
            const cell = gridElement.querySelector(
                `[data-row="${pos.r}"][data-col="${pos.c}"]`
            );

            if (cell) cell.classList.remove("hint-cell");
        });

        if (!finished) {
            messageElement.textContent =
                "Акнун калимаро пайдо кун!";
        }
    }, 1800);
});

// Таваққуф
document.getElementById("pauseBtn").addEventListener("click", () => {
    if (finished) return;

    paused = !paused;

    document.getElementById("pauseBtn").textContent =
        paused ? "▶ Давом додан" : "⏸ Таваққуф";

    if (paused) {
        messageElement.textContent = "⏸ Бозӣ таваққуф шуд.";
    } else {
        messageElement.textContent = "▶ Бозӣ идома дорад!";
    }
});

// Аз нав оғоз кардан
document.getElementById("restartBtn").addEventListener("click", startGame);

document.getElementById("playAgainBtn").addEventListener("click", startGame);

// Иваз кардани категория ё сатҳ
document.getElementById("category").addEventListener("change", startGame);

document.getElementById("difficulty").addEventListener("change", startGame);

// Садо
document.getElementById("soundBtn").addEventListener("click", () => {
    soundEnabled = !soundEnabled;

    document.getElementById("soundBtn").textContent =
        soundEnabled ? "🔊" : "🔇";

    if (soundEnabled) playSound();
});

// Оғози аввалини бозӣ
startGame();
