const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const scoreDisplay = document.getElementById('score');
const bgm = document.getElementById('bgm');

let lanes = [];
let laneKeys = [];
let notes = [];
let score = 0;
let gameRunning = false;
let laneCount = 6;
let difficulty = 'normal';

const difficulties = {
    easy: { noteSpeed: 3, spawnRate: 800 },
    normal: { noteSpeed: 5, spawnRate: 600 },
    hard: { noteSpeed: 7, spawnRate: 400 }
};

let noteSpeed = difficulties[difficulty].noteSpeed;
let noteSpawnRate = difficulties[difficulty].spawnRate;

function initializeLanes(count) {
    lanes = [];
    laneKeys = [];
    let spacing = canvas.width / count;
    for (let i = 0; i < count; i++) {
        lanes.push(spacing * i + spacing / 2);
        laneKeys.push(String.fromCharCode(65 + i)); // A, B, C, ...
    }
}

startButton.onclick = () => {
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    startGame();
};

retryButton.onclick = () => {
    location.reload();
};

function startGame() {
    initializeLanes(laneCount);
    bgm.play();
    gameRunning = true;
    score = 0;
    notes = [];

    setInterval(() => {
        if (gameRunning) {
            let laneIndex = Math.floor(Math.random() * lanes.length);
            let lane = lanes[laneIndex];
            notes.push({ x: lane - 25, y: 0, laneIndex: laneIndex });
        }
    }, noteSpawnRate);

    draw();
}

canvas.addEventListener('click', function (event) {
    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    for (let i = 0; i < notes.length; i++) {
        let note = notes[i];
        if (clickX >= note.x && clickX <= note.x + 50 && clickY >= note.y && clickY <= note.y + 50) {
            notes.splice(i, 1);
            score += 100;
            scoreDisplay.innerText = score;
            break;
        }
    }
});

window.addEventListener('keydown', function (event) {
    if (!gameRunning) return;

    const keyIndex = laneKeys.indexOf(event.key.toUpperCase());
    if (keyIndex !== -1) {
        for (let i = 0; i < notes.length; i++) {
            let note = notes[i];
            if (note.laneIndex === keyIndex && note.y >= canvas.height - 100 && note.y <= canvas.height - 20) {
                notes.splice(i, 1);
                score += 100;
                scoreDisplay.innerText = score;
                break;
            }
        }
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'gray';
    lanes.forEach(lane => {
        ctx.beginPath();
        ctx.moveTo(lane, 0);
        ctx.lineTo(lane, canvas.height);
        ctx.stroke();
    });

    ctx.fillStyle = 'white';
    notes.forEach(note => {
        ctx.fillRect(note.x, note.y, 50, 50);
        note.y += noteSpeed;
    });

    ctx.fillStyle = 'yellow';
    lanes.forEach((lane, index) => {
        ctx.fillText(laneKeys[index], lane - 5, canvas.height - 10);
    });

    notes = notes.filter(note => note.y <= canvas.height + 50);

    if (gameRunning) {
        requestAnimationFrame(draw);
    }
}

// 設定変更用関数
function setDifficulty(newDifficulty) {
    difficulty = newDifficulty;
    noteSpeed = difficulties[difficulty].noteSpeed;
    noteSpawnRate = difficulties[difficulty].spawnRate;
}
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const scoreDisplay = document.getElementById('score');
const bgm = document.getElementById('bgm');
const difficultySelector = document.getElementById('difficultySelector');
const laneSelector = document.getElementById('laneSelector');

let lanes = \[];
let laneKeys = \[];
let notes = \[];
let score = 0;
let gameRunning = false;
let laneCount = 6;
let difficulty = 'normal';
let spawnInterval;

const difficulties = {
easy: { noteSpeed: 3, spawnRate: 800 },
normal: { noteSpeed: 5, spawnRate: 600 },
hard: { noteSpeed: 7, spawnRate: 400 }
};

let noteSpeed = difficulties\[difficulty].noteSpeed;
let noteSpawnRate = difficulties\[difficulty].spawnRate;

function initializeLanes(count) {
lanes = \[];
laneKeys = \[];
let spacing = canvas.width / count;
for (let i = 0; i < count; i++) {
lanes.push(spacing \* i + spacing / 2);
laneKeys.push(String.fromCharCode(65 + i)); // A, B, C, ...
}
}

startButton.onclick = () => {
laneCount = parseInt(laneSelector.value);
difficulty = difficultySelector.value;
noteSpeed = difficulties\[difficulty].noteSpeed;
noteSpawnRate = difficulties\[difficulty].spawnRate;

```
startScreen.style.display = 'none';
gameScreen.style.display = 'block';
startGame();
```

};

retryButton.onclick = () => {
clearInterval(spawnInterval);
location.reload();
};

function startGame() {
initializeLanes(laneCount);
bgm.play();
gameRunning = true;
score = 0;
notes = \[];

```
spawnInterval = setInterval(() => {
    if (gameRunning) {
        let laneIndex = Math.floor(Math.random() * lanes.length);
        let lane = lanes[laneIndex];
        notes.push({ x: lane - 25, y: 0, laneIndex: laneIndex });
    }
}, noteSpawnRate);

draw();
```

}

canvas.addEventListener('click', function (event) {
if (!gameRunning) return;

```
const rect = canvas.getBoundingClientRect();
const clickX = event.clientX - rect.left;
const clickY = event.clientY - rect.top;

for (let i = 0; i < notes.length; i++) {
    let note = notes[i];
    if (clickX >= note.x && clickX <= note.x + 50 && clickY >= note.y && clickY <= note.y + 50) {
        notes.splice(i, 1);
        score += 100;
        scoreDisplay.innerText = score;
        break;
    }
}
```

});

window\.addEventListener('keydown', function (event) {
if (!gameRunning) return;

```
const keyIndex = laneKeys.indexOf(event.key.toUpperCase());
if (keyIndex !== -1) {
    for (let i = 0; i < notes.length; i++) {
        let note = notes[i];
        if (note.laneIndex === keyIndex && note.y >= canvas.height - 100 && note.y <= canvas.height - 20) {
            notes.splice(i, 1);
            score += 100;
            scoreDisplay.innerText = score;
            break;
        }
    }
}
```

});

function draw() {
ctx.clearRect(0, 0, canvas.width, canvas.height);

```
ctx.strokeStyle = 'gray';
lanes.forEach(lane => {
    ctx.beginPath();
    ctx.moveTo(lane, 0);
    ctx.lineTo(lane, canvas.height);
    ctx.stroke();
});

ctx.fillStyle = 'white';
notes.forEach(note => {
    ctx.fillRect(note.x, note.y, 50, 50);
    note.y += noteSpeed;
});

ctx.fillStyle = 'yellow';
lanes.forEach((lane, index) => {
    ctx.fillText(laneKeys[index], lane - 5, canvas.height - 10);
});

notes = notes.filter(note => note.y <= canvas.height + 50);

if (gameRunning) {
    requestAnimationFrame(draw);
}
```

}

// 設定変更用関数
function setDifficulty(newDifficulty) {
difficulty = newDifficulty;
noteSpeed = difficulties\[difficulty].noteSpeed;
noteSpawnRate = difficulties\[difficulty].spawnRate;
}

function setLaneCount(newCount) {
laneCount = newCount;
}

// 画面の初期化
initializeLanes(laneCount);

function setLaneCount(newCount) {
    laneCount = newCount;
}
