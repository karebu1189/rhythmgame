document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素 ---
    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultScreen = document.getElementById('resultScreen');

    const songList = document.getElementById('songList');
    const difficultySelector = document.getElementById('difficultySelector');
    const startGameButton = document.getElementById('startGameButton');

    const retryButton = document.getElementById('retryButton');
    const backButton = document.getElementById('backButton');
    const backButtonResult = document.getElementById('backButtonResult');

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const bgm = document.getElementById('bgm');
    const tapSound = document.getElementById('tapSound');
    const perfectSound = document.getElementById('perfectSound');
    const greatSound = document.getElementById('greatSound');
    const goodSound = document.getElementById('goodSound');
    const missSound = document.getElementById('missSound');

    const finalScoreDisplay = document.getElementById('finalScore');
    const maxComboDisplay = document.getElementById('maxCombo');

    // --- 定数 ---
    const laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];

    // --- ゲーム状態 ---
    let selectedSong = null;
    let lanes = [];
    let notes = [];
    let judgeEffects = [];
    let tapEffects = [];

    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let gameRunning = false;
    let noteSpeed = 5;
    let spawnIntervalId = null;

    // --- 曲リスト ---
    const songs = [
        { title: 'メデ', file: 'メデ.mp3', bpm: 172 },
        { title: 'トンデモワンダーズ', file: 'トンデモワンダーズ.mp3', bpm: 172 },
        { title: 'テトリス', file: 'テトリス.mp3', bpm: 170 },
        { title: 'マーシャル・マキシマイザー', file: 'マーシャル・マキシマイザー.mp3', bpm: 135 },
        { title: 'スマイル_シンフォニー', file: 'スマイル_シンフォニー.mp3', bpm: 150 },
        { title: 'ラグトレイン', file: 'ラグトレイン.mp3', bpm: 125 },
        { title: 'グッバイ宣言', file: 'グッバイ宣言.mp3', bpm: 160 },
        { title: 'ドラマツルギー', file: 'ドラマツルギー.mp3', bpm: 150 },
        { title: 'KING', file: 'KING.mp3', bpm: 166 },
        { title: 'ビターチョコデコレーション', file: 'ビターチョコデコレーション.mp3', bpm: 180 },
        { title: 'ロウワー', file: 'ロウワー.mp3', bpm: 160 },
        { title: '夜に駆ける', file: '夜に駆ける.mp3', bpm: 130 },
        { title: 'マリーゴールド', file: 'マリーゴールド.mp3', bpm: 130 },
        { title: 'ドライフラワー', file: 'ドライフラワー.mp3', bpm: 125 },
        { title: '香水', file: '香水.mp3', bpm: 140 },
        { title: 'Pretender', file: 'Pretender.mp3', bpm: 140 }
    ];

    // --- 初期化 ---
    function init() {
        songList.innerHTML = '';
        songs.forEach((song, i) => {
            const btn = document.createElement('button');
            btn.textContent = song.title;
            btn.className = 'songItem';
            btn.addEventListener('click', () => selectSong(i));
            songList.appendChild(btn);
        });

        selectSong(0);
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        backButton.addEventListener('click', () => {
            stopGame();
            showScreen('titleScreen');
        });

        backButtonResult.addEventListener('click', () => showScreen('titleScreen'));
        retryButton.addEventListener('click', () => startGame());

        startGameButton.addEventListener('click', () => {
            if (!selectedSong) return;
            startGame();
        });

        difficultySelector.addEventListener('change', () => updateDifficulty());

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (const touch of e.touches) {
                handleTouch(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        window.addEventListener('keydown', e => {
            if (!gameRunning) return;
            if (laneKeys.includes(e.key.toUpperCase())) {
                judgeNote(e.key.toUpperCase());
                tapSound.currentTime = 0;
                tapSound.play();
            }
        });

        showScreen('titleScreen');
    }

    function showScreen(screenId) {
        [titleScreen, gameScreen, resultScreen].forEach(s => s.style.display = 'none');
        if (screenId === 'titleScreen') titleScreen.style.display = 'flex';
        else if (screenId === 'gameScreen') gameScreen.style.display = 'flex';
        else if (screenId === 'resultScreen') resultScreen.style.display = 'flex';
    }

    function selectSong(index) {
        selectedSong = songs[index];
        Array.from(songList.children).forEach((btn, i) => {
            btn.classList.toggle('selected', i === index);
        });
        startGameButton.disabled = false;
    }

    function updateDifficulty() {
        const diff = difficultySelector.value;
        switch (diff) {
            case 'easy': noteSpeed = 3; break;
            case 'normal': noteSpeed = 5; break;
            case 'hard': noteSpeed = 8; break;
            default: noteSpeed = 5; break;
        }
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const laneAreaWidth = canvas.width * 0.5;
        const laneWidth = laneAreaWidth / laneKeys.length;

        lanes = [];
        for (let i = 0; i < laneKeys.length; i++) {
            const startX = (canvas.width - laneAreaWidth) / 2;
            lanes.push(startX + laneWidth * i + laneWidth / 2);
        }
    }

    function bpmToInterval(bpm) {
        return 60000 / bpm;
    }

    function spawnNote() {
        if (!gameRunning) return;
        const laneIndex = Math.floor(Math.random() * lanes.length);
        notes.push({
            x: lanes[laneIndex],
            y: 0,
            laneIndex,
            hit: false,
            judgeResult: null,
        });
    }

    function startNoteSpawning() {
        const interval = bpmToInterval(selectedSong.bpm);
        spawnIntervalId = setInterval(() => {
            if (!gameRunning) return;
            spawnNote();
        }, interval);
    }

    function stopNoteSpawning() {
        clearInterval(spawnIntervalId);
    }

    function judgeNote(key) {
        if (!gameRunning) return;

        const laneIndex = laneKeys.indexOf(key);
        if (laneIndex === -1) return;

        tapEffects.push({ x: lanes[laneIndex], y: canvas.height - 150, frame: 0 });

        const judgeLineY = canvas.height - 150;
        let judged = false;

        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            if (note.laneIndex === laneIndex && !note.hit) {
                const dist = Math.abs(note.y - judgeLineY);

                if (dist <= 20) { handleHit(note, i, 'PERFECT'); judged = true; break; }
                else if (dist <= 40) { handleHit(note, i, 'GREAT'); judged = true; break; }
                else if (dist <= 60) { handleHit(note, i, 'GOOD'); judged = true; break; }
            }
        }

        if (!judged) {
            missSound.play();
            combo = 0;
        }
    }

    function handleHit(note, index, judge) {
        note.hit = true;
        note.judgeResult = judge;
        notes.splice(index, 1);

        switch (judge) {
            case 'PERFECT': score += 1000; combo++; perfectSound.play(); break;
            case 'GREAT': score += 700; combo++; greatSound.play(); break;
            case 'GOOD': score += 400; combo++; goodSound.play(); break;
        }

        if (combo > maxCombo) maxCombo = combo;

        judgeEffects.push({ x: note.x, y: canvas.height - 150, judge, frame: 0 });
    }

    function updateNotes() {
        for (let i = notes.length - 1; i >= 0; i--) {
            const note = notes[i];
            note.y += noteSpeed;

            if (!note.hit && note.y > canvas.height - 110) {
                notes.splice(i, 1);
                missSound.play();
                combo = 0;
            }
        }
    }

    function updateJudgeEffects() {
        for (let i = judgeEffects.length - 1; i >= 0; i--) {
            const e = judgeEffects[i];
            e.frame++;
            if (e.frame > 30) {
                judgeEffects.splice(i, 1);
            }
        }
    }

    function draw() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const laneAreaWidth = canvas.width * 0.5;
        const laneWidth = laneAreaWidth / laneKeys.length;
        const startX = (canvas.width - laneAreaWidth) / 2;

        for (let i = 0; i < laneKeys.length; i++) {
            const x = startX + laneWidth * i;
            ctx.fillStyle = '#222';
            ctx.fillRect(x, 0, laneWidth - 2, canvas.height);

            ctx.fillStyle = '#555';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(laneKeys[i], x + laneWidth / 2, canvas.height - 100);
        }

        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, canvas.height - 150);
        ctx.lineTo(startX + laneAreaWidth, canvas.height - 150);
        ctx.stroke();

        notes.forEach(note => {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(note.x, note.y, 15, 0, Math.PI * 2);
            ctx.fill();
        });

        judgeEffects.forEach(e => {
            ctx.fillStyle = e.judge === 'PERFECT' ? 'lime' : e.judge === 'GREAT' ? 'cyan' : 'orange';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.globalAlpha = 1 - e.frame / 30;
            ctx.fillText(e.judge, e.x, e.y - e.frame * 2);
            ctx.globalAlpha = 1;
        });

        tapEffects.forEach((e, idx) => {
            ctx.strokeStyle = `rgba(255,255,255,${1 - e.frame / 15})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 20 + e.frame * 3, 0, Math.PI * 2);
            ctx.stroke();

            e.frame++;
            if (e.frame > 15) tapEffects.splice(idx, 1);
        });

        ctx.fillStyle = 'white';
        ctx.font = '28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE: ' + score, 20, 40);
        ctx.fillText('COMBO: ' + combo, 20, 80);
    }

    function gameLoop() {
        if (!gameRunning) return;
        updateNotes();
        updateJudgeEffects();
        draw();
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        score = 0;
        combo = 0;
        maxCombo = 0;
        notes = [];
        judgeEffects = [];
        tapEffects = [];
        updateDifficulty();

        bgm.src = selectedSong.file;
        bgm.currentTime = 0;

        gameRunning = true;

       bgm.onloadedmetadata = () => {
    bgm.play();
    startNoteSpawning();
};

bgm.onended = () => {
    stopGame();
    showResult();
};


        gameLoop();
        showScreen('gameScreen');
    }

    function stopGame() {
        gameRunning = false;
        stopNoteSpawning();
        bgm.pause();
        bgm.currentTime = 0;
    }

    function showResult() {
        finalScoreDisplay.textContent = score;
        maxComboDisplay.textContent = maxCombo;
        showScreen('resultScreen');
    }

    function handleTouch(x, y) {
        const laneAreaWidth = canvas.width * 0.5;
        const laneWidth = laneAreaWidth / laneKeys.length;
        const laneStartX = (canvas.width - laneAreaWidth) / 2;

        if (y < canvas.height - 200) return;
        if (x < laneStartX || x > laneStartX + laneAreaWidth) return;

        const laneIndex = Math.floor((x - laneStartX) / laneWidth);
        if (laneIndex < 0 || laneIndex >= laneKeys.length) return;

        const laneKey = laneKeys[laneIndex];
        judgeNote(laneKey);

        tapSound.currentTime = 0;
        tapSound.play();

        tapEffects.push({ x: lanes[laneIndex], y: canvas.height - 150, frame: 0 });
    }

    init();
});
