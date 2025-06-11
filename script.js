document.addEventListener('DOMContentLoaded', () => {
    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultScreen = document.getElementById('resultScreen');

    const songList = document.getElementById('songList');
    const difficultySelector = document.getElementById('difficultySelector');
    const startGameButton = document.getElementById('startGameButton');

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const bgm = document.getElementById('bgm');
    const tapSound = document.getElementById('tapSound');
    const perfectSound = document.getElementById('perfectSound');
    const greatSound = document.getElementById('greatSound');
    const goodSound = document.getElementById('goodSound');
    const missSound = document.getElementById('missSound');

    const retryButton = document.getElementById('retryButton');
    const backButton = document.getElementById('backButton');
    const backButtonResult = document.getElementById('backButtonResult');

    let selectedSong = { title: 'メデ', file: 'メデ.mp3' };

    let lanes = [];
    let laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];
    let notes = [];
    let effects = [];
    let judgeEffects = [];
    let score = 0;
    let combo = 0;
    let gameRunning = false;
    let spawnInterval;

    const difficulties = {
        easy: { noteSpeed: 3, spawnRate: 800 },
        normal: { noteSpeed: 5, spawnRate: 600 },
        hard: { noteSpeed: 7, spawnRate: 400 }
    };

    let noteSpeed = difficulties.normal.noteSpeed;
    let noteSpawnRate = difficulties.normal.spawnRate;

    const songs = [
        { title: 'メデ', file: 'メデ.mp3' },
        { title: '曲2', file: 'df327b38-4181-4d81-b13f-a4490a28cbf1.mp3' }
    ];

    songs.forEach(song => {
        const songButton = document.createElement('div');
        songButton.className = 'songItem';
        songButton.innerText = song.title;
        songButton.onclick = () => {
            selectedSong = song;
            Array.from(songList.children).forEach(child => child.style.color = 'white');
            songButton.style.color = 'yellow';
        };
        songList.appendChild(songButton);
    });

    startGameButton.onclick = () => {
        const difficulty = difficultySelector.value;
        noteSpeed = difficulties[difficulty].noteSpeed;
        noteSpawnRate = difficulties[difficulty].spawnRate;

        titleScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        startGame();
    };

    retryButton.onclick = () => location.reload();
    backButton.onclick = () => location.reload();
    backButtonResult.onclick = () => location.reload();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function initializeLanes() {
        lanes = [];
        let laneWidth = 60;
        let totalWidth = laneWidth * 8;
        let startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;

        for (let i = 0; i < 8; i++) {
            lanes.push(startX + i * laneWidth);
        }
    }

    function startGame() {
        initializeLanes();
        bgm.src = selectedSong.file;
        bgm.play();
        gameRunning = true;
        score = 0;
        combo = 0;
        notes = [];

        bgm.onended = () => {
            endGame();
        };

        spawnInterval = setInterval(() => {
            if (gameRunning) {
                let laneIndex = Math.floor(Math.random() * lanes.length);
                let lane = lanes[laneIndex];
                notes.push({ x: lane - 25, y: 0, laneIndex: laneIndex });
            }
        }, noteSpawnRate);

        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'cyan';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 5);

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

        judgeEffects.forEach((effect, index) => {
            ctx.fillStyle = effect.color;
            ctx.font = '30px Arial';
            ctx.fillText(effect.text, effect.x, effect.y);
            effect.timer--;
            if (effect.timer <= 0) judgeEffects.splice(index, 1);
        });

        effects.forEach((effect, index) => {
            ctx.strokeStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(effect.x + 25, effect.y + 25, 30 - effect.timer, 0, 2 * Math.PI);
            ctx.stroke();
            effect.timer--;
            if (effect.timer <= 0) effects.splice(index, 1);
        });

        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Score: ' + score, 20, 40);
        ctx.fillText('Combo: ' + combo, 20, 80);

        notes = notes.filter(note => note.y <= canvas.height + 50);

        if (gameRunning) {
            requestAnimationFrame(draw);
        }
    }

    function endGame() {
        gameRunning = false;
        clearInterval(spawnInterval);
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'flex';

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

    function getJudge(noteY) {
        let hitLine = canvas.height - 100;
        let diff = Math.abs(noteY - hitLine);

        if (diff <= 40) return { text: 'Perfect', color: 'gold', sound: perfectSound };
        else if (diff <= 80) return { text: 'Great', color: 'blue', sound: greatSound };
        else if (diff <= 120) return { text: 'Good', color: 'green', sound: goodSound };
        else return { text: 'Miss', color: 'red', sound: missSound };
    }

    function handleHit(note, index) {
        let judge = getJudge(note.y);
        notes.splice(index, 1);

        if (judge.text !== 'Miss') {
            score += 100;
            combo++;
            tapSound.currentTime = 0;
            tapSound.play();
        } else {
            combo = 0;
        }

        judge.sound.currentTime = 0;
        judge.sound.play();

        judgeEffects.push({ text: judge.text, color: judge.color, x: note.x, y: note.y, timer: 30 });
        effects.push({ x: note.x, y: note.y, timer: 15 });
    }

    canvas.addEventListener('click', function (event) {
        if (!gameRunning) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        for (let i = 0; i < notes.length; i++) {
            let note = notes[i];
            if (clickX >= note.x && clickX <= note.x + 50 && clickY >= note.y && clickY <= note.y + 50) {
                handleHit(note, i);
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
                if (note.laneIndex === keyIndex && note.y >= canvas.height - 150 && note.y <= canvas.height - 20) {
                    handleHit(note, i);
                    break;
                }
            }
        }
    });

    canvas.addEventListener('touchstart', function (event) {
        if (!gameRunning) return;

        const rect = canvas.getBoundingClientRect();
        const touchX = event.touches[0].clientX - rect.left;
        const touchY = event.touches[0].clientY - rect.top;

        for (let i = 0; i < notes.length; i++) {
            let note = notes[i];
            if (touchX >= note.x && touchX <= note.x + 50 && touchY >= note.y && touchY <= note.y + 50) {
                handleHit(note, i);
                break;
            }
        }
    });

});
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 600;
canvas.height = 800;

let lanes = [100, 200, 300, 400, 500];
let laneKeys = ['D', 'F', 'J', 'K', 'L'];
let notes = [];
let noteSpeed = 5;
let score = 0;
let combo = 0;
let gameRunning = false;
let judgeEffects = [];
let effects = [];

// 画像背景読み込み
const bgImage = new Image();
bgImage.src = 'background.jpg';  // 画像ファイルは同じフォルダに配置してください

// 複雑な動くグラデーション用パラメータ
let gradientAngle = 0;

// パーティクル設定
let particles = [];
const PARTICLE_COUNT = 80;

function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: randomRange(1, 3),
            speedX: randomRange(-0.3, 0.3),
            speedY: randomRange(-0.1, 0.1),
            alpha: randomRange(0.1, 0.5),
            alphaSpeed: randomRange(0.002, 0.007),
            growing: true
        });
    }
}

function updateAndDrawBackground() {
    // 1. 画像背景を描く（読み込み済みなら）
    if (bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        // 画像読み込み前は黒背景
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. 動くグラデーションオーバーレイ
    gradientAngle += 0.01;
    let gradient = ctx.createLinearGradient(
        canvas.width / 2 + Math.cos(gradientAngle) * 200, 0,
        canvas.width / 2 + Math.cos(gradientAngle + Math.PI) * 200, canvas.height
    );
    gradient.addColorStop(0, 'rgba(120, 130, 255, 0.2)');
    gradient.addColorStop(0.5, 'rgba(200, 220, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(120, 130, 255, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. パーティクルを更新＆描画
    particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        if (p.growing) {
            p.alpha += p.alphaSpeed;
            if (p.alpha >= 0.5) p.growing = false;
        } else {
            p.alpha -= p.alphaSpeed;
            if (p.alpha <= 0.1) p.growing = true;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// --- 以下は既存のゲーム処理部分 ---

function startGame() {
    if (gameRunning) return;
    gameRunning = true;
    notes = [];
    score = 0;
    combo = 0;
    judgeEffects = [];
    effects = [];
    initParticles();

    for (let i = 0; i < 50; i++) {
        let lane = lanes[Math.floor(Math.random() * lanes.length)];
        notes.push({ x: lane, y: -i * 150 });
    }

    draw();
}

function judge(key) {
    let laneIndex = laneKeys.indexOf(key.toUpperCase());
    if (laneIndex === -1) return;

    let laneX = lanes[laneIndex];
    for (let i = 0; i < notes.length; i++) {
        let note = notes[i];
        if (note.x === laneX && Math.abs(note.y - (canvas.height - 100)) < 50) {
            notes.splice(i, 1);
            score += 100;
            combo++;
            judgeEffects.push({ text: "GOOD", x: laneX, y: canvas.height - 150, color: 'lime', timer: 30 });
            effects.push({ x: laneX, y: canvas.height - 100, timer: 30 });
            return;
        }
    }
    combo = 0;
    judgeEffects.push({ text: "MISS", x: lanes[laneIndex], y: canvas.height - 150, color: 'red', timer: 30 });
}

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    judge(e.key);
});

function draw() {
    if (!gameRunning) return;

    updateAndDrawBackground();

    // 判定ライン
    ctx.fillStyle = 'cyan';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 5);

    // レーン線
    ctx.strokeStyle = 'white';
    lanes.forEach(lane => {
        ctx.beginPath();
        ctx.moveTo(lane, 0);
        ctx.lineTo(lane, canvas.height);
        ctx.stroke();
    });

    // ノーツ描画
    ctx.fillStyle = 'white';
    notes.forEach(note => {
        ctx.fillRect(note.x - 25, note.y - 25, 50, 50);
        note.y += noteSpeed;
    });

    // レーンキー表示
    ctx.fillStyle = 'yellow';
    ctx.font = '20px Arial';
    lanes.forEach((lane, index) => {
        ctx.fillText(laneKeys[index], lane - 7, canvas.height - 20);
    });

    // ジャッジ演出
    judgeEffects.forEach((effect, index) => {
        ctx.fillStyle = effect.color;
        ctx.font = '30px Arial';
        ctx.fillText(effect.text, effect.x - 20, effect.y);
        effect.timer--;
        if (effect.timer <= 0) judgeEffects.splice(index, 1);
    });

    // ノーツヒットの波紋エフェクト
    effects.forEach((effect, index) => {
        ctx.strokeStyle = 'cyan';
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, 30 - effect.timer, 0, 2 * Math.PI);
        ctx.stroke();
        effect.timer--;
        if (effect.timer <= 0) effects.splice(index, 1);
    });

    // スコア・コンボ表示
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 20, 40);
    ctx.fillText('Combo: ' + combo, 20, 80);

    notes = notes.filter(note => note.y <= canvas.height + 50);

    requestAnimationFrame(draw);
}

startGame();
