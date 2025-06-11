document.addEventListener('DOMContentLoaded', () => {

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const backButton = document.getElementById('backButton');
const bgm = document.getElementById('bgm');
const tapSound = document.getElementById('tapSound');
const difficultySelector = document.getElementById('difficultySelector');
const laneSelector = document.getElementById('laneSelector');

let lanes = [];
let laneKeys = [];
let notes = [];
let score = 0;
let gameRunning = false;
let laneCount = 6;
let difficulty = 'normal';
let spawnInterval;
let effects = [];
let judgeEffects = [];

const keyMapping = ['D', 'F', 'G', 'J', 'K', 'L'];
const difficulties = {
    easy: { noteSpeed: 3, spawnRate: 800 },
    normal: { noteSpeed: 5, spawnRate: 600 },
    hard: { noteSpeed: 7, spawnRate: 400 }
};

let noteSpeed = difficulties[difficulty].noteSpeed;
let noteSpawnRate = difficulties[difficulty].spawnRate;

// 全画面対応
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function playTapSound() {
    tapSound.currentTime = 0;
    tapSound.play();
}

function initializeLanes(count) {
    lanes = [];
    laneKeys = [];
    let laneWidth = 60;
    let totalWidth = laneWidth * count;
    let startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;

    for (let i = 0; i < count; i++) {
        lanes.push(startX + i * laneWidth);
        laneKeys.push(keyMapping[i]);
    }
}

startButton.onclick = () => {
    laneCount = parseInt(laneSelector.value);
    difficulty = difficultySelector.value;
    noteSpeed = difficulties[difficulty].noteSpeed;
    noteSpawnRate = difficulties[difficulty].spawnRate;

    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    startGame();
};

retryButton.onclick = () => {
    clearInterval(spawnInterval);
    location.reload();
};

backButton.onclick = () => {
    location.reload();
};

function startGame() {
    initializeLanes(laneCount);
    bgm.play();
    gameRunning = true;
    score = 0;
    notes = [];

    spawnInterval = setInterval(() => {
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
            let judge = getJudge(note.y);
            notes.splice(i, 1);
            score += 100;
            playTapSound();
            judgeEffects.push({ text: judge, x: note.x, y: note.y, timer: 30 });
            effects.push({ x: note.x, y: note.y, timer: 15 });
            return;
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
                let judge = getJudge(note.y);
                notes.splice(i, 1);
                score += 100;
                playTapSound();
                judgeEffects.push({ text: judge, x: note.x, y: note.y, timer: 30 });
                effects.push({ x: note.x, y: note.y, timer: 15 });
                return;
            }
        }
    }
});

function getJudge(noteY) {
    let hitLine = canvas.height - 50;
    let diff = Math.abs(noteY - hitLine);

    if (diff <= 22.5) return 'Perfect';
    else if (diff <= 50) return 'Great';
    else if (diff <= 80) return 'Good';
    else return 'Miss';
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'white';
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

    // 判定エフェクト描画
    judgeEffects.forEach((effect, index) => {
        ctx.fillStyle = 'white';
        if (effect.text === 'Perfect') ctx.fillStyle = 'gold';
        if (effect.text === 'Great') ctx.fillStyle = 'blue';
        if (effect.text === 'Good') ctx.fillStyle = 'green';
        if (effect.text === 'Miss') ctx.fillStyle = 'red';

        ctx.font = '30px Arial';
        ctx.fillText(effect.text, effect.x, effect.y);
        effect.timer--;
        if (effect.timer <= 0) judgeEffects.splice(index, 1);
    });

    // タップエフェクト
    effects.forEach((effect, index) => {
        ctx.strokeStyle = 'cyan';
        ctx.beginPath();
        ctx.arc(effect.x + 25, effect.y + 25, 30 - effect.timer, 0, 2 * Math.PI);
        ctx.stroke();
        effect.timer--;
        if (effect.timer <= 0) effects.splice(index, 1);
    });

    // スコア表示
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 20, 40);

    // ノーツ落下判定（リザルト遷移）
    notes = notes.filter(note => {
        if (note.y > canvas.height + 50) {
            endGame();
            return false;
        }
        return true;
    });

    if (gameRunning) {
        requestAnimationFrame(draw);
    }
}

function endGame() {
    gameRunning = false;
    clearInterval(spawnInterval);
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'block';

    document.getElementById('finalScore').innerText = 'スコア: ' + score;
    document.getElementById('finalRank').innerText = 'ランク: ' + getRank(score);
}

function getRank(score) {
    if (score >= 30000) return 'SS';
    else if (score >= 20000) return 'S';
    else if (score >= 15000) return 'A';
    else if (score >= 10000) return 'B';
    else return 'C';
}

canvas.addEventListener('touchstart', function (event) {
    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const touchX = event.touches[0].clientX - rect.left;
    const touchY = event.touches[0].clientY - rect.top;

    for (let i = 0; i < notes.length; i++) {
        let note = notes[i];
        if (touchX >= note.x && touchX <= note.x + 50 && touchY >= note.y && touchY <= note.y + 50) {
            let judge = getJudge(note.y);
            notes.splice(i, 1);
            score += 100;
            playTapSound();
            judgeEffects.push({ text: judge, x: note.x, y: note.y, timer: 30 });
            effects.push({ x: note.x, y: note.y, timer: 15 });
            return;
        }
    }
});

initializeLanes(laneCount);

});
