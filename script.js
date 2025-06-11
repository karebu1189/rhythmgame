const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const startButton = document.getElementById('startButton');
const retryButton = document.getElementById('retryButton');
const scoreDisplay = document.getElementById('score');
const bgm = document.getElementById('bgm');

let lanes = [50, 150, 250, 350, 450, 550];
let laneKeys = ['A', 'S', 'D', 'J', 'K', 'L'];
let notes = [];
let score = 0;
let gameRunning = false;

startButton.onclick = () => {
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    startGame();
};

retryButton.onclick = () => {
    location.reload();
};

function startGame() {
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
    }, 600);

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

// キー入力対応
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

    // レーン区切り線の描画
    ctx.strokeStyle = 'gray';
    lanes.forEach(lane => {
        ctx.beginPath();
        ctx.moveTo(lane, 0);
        ctx.lineTo(lane, canvas.height);
        ctx.stroke();
    });

    // ノーツの描画
    ctx.fillStyle = 'white';
    notes.forEach(note => {
        ctx.fillRect(note.x, note.y, 50, 50);
        note.y += 5;
    });

    // レーンキー表示
    ctx.fillStyle = 'yellow';
    lanes.forEach((lane, index) => {
        ctx.fillText(laneKeys[index], lane - 5, canvas.height - 10);
    });

    notes = notes.filter(note => note.y <= canvas.height + 50);

    if (gameRunning) {
        requestAnimationFrame(draw);
    }
}
