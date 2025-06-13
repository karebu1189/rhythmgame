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

    const bgVideo = document.getElementById('bgVideo');

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

    // --- 曲リスト（MV動画ファイル追加）---
    const songs = [
        { title: 'メデ', file: 'メデ.mp3', bpm: 172, mv: 'メデ.mp4' },
        { title: 'トンデモワンダーズ', file: 'トンデモワンダーズ.mp3', bpm: 172, mv: 'トンデモワンダーズ.mp4' },
        { title: 'テトリス', file: 'テトリス.mp3', bpm: 170, mv: 'テトリス.mp4' },
        { title: 'マーシャル・マキシマイザー', file: 'マーシャル・マキシマイザー.mp3', bpm: 135, mv: 'マーシャル・マキシマイザー.mp4' },
        { title: 'スマイル_シンフォニー', file: 'スマイル_シンフォニー.mp3', bpm: 150, mv: 'スマイル_シンフォニー.mp4' },
        { title: 'ロストアンブレラ', file: 'ロストアンブレラ.mp3', bpm: 102, mv: 'ロストアンブレラ.mp4' },
        { title: 'ラビットホール', file: 'ラビットホール.mp3', bpm: 173, mv: 'ラビットホール.mp4' },
        { title: 'ドラマツルギー', file: 'ドラマツルギー.mp3', bpm: 150, mv: 'ドラマツルギー.mp4' },
        { title: 'KING', file: 'KING.mp3', bpm: 166, mv: 'KING.mp4' },
        { title: 'ビターチョコデコレーション', file: 'ビターチョコデコレーション.mp3', bpm: 180, mv: 'ビターチョコデコレーション.mp4' },
        { title: 'ロウワー', file: 'ロウワー.mp3', bpm: 160, mv: 'ロウワー.mp4' },
        { title: '夜に駆ける', file: '夜に駆ける.mp3', bpm: 130, mv: '夜に駆ける.mp4' },
        { title: 'マリーゴールド', file: 'マリーゴールド.mp3', bpm: 130, mv: 'マリーゴールド.mp4' },
        { title: 'ドライフラワー', file: 'ドライフラワー.mp3', bpm: 125, mv: 'ドライフラワー.mp4' },
        { title: '香水', file: '香水.mp3', bpm: 140, mv: '香水.mp4' },
        { title: 'Pretender', file: 'Pretender.mp3', bpm: 140, mv: 'Pretender.mp4' }
    ];

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

        canvas.addEventListener('mousedown', (e) => {
            handleTouch(e.clientX, e.clientY);
        });

        document.addEventListener('keydown', (e) => {
            if (!gameRunning) return;
            const key = e.key.toUpperCase();
            if (laneKeys.includes(key)) {
                judgeNoteForKey(key);
            }
        });

        showScreen('titleScreen');
    }

    function selectSong(index) {
        selectedSong = songs[index];
        [...songList.children].forEach((btn, i) => {
            btn.classList.toggle('selected', i === index);
        });
        startGameButton.disabled = false;
    }

    function updateDifficulty() {
        // TODO: 難易度に合わせた譜面調整など
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // --- ゲーム開始 ---
    function startGame() {
        score = 0;
        combo = 0;
        maxCombo = 0;
        gameRunning = true;
        notes = [];
        judgeEffects = [];
        tapEffects = [];

        // BGM設定
        bgm.src = selectedSong.file;
        bgm.currentTime = 0;
        bgm.play();

        // MV動画設定・再生
        bgVideo.src = selectedSong.mv;
        bgVideo.currentTime = 0;
        bgVideo.style.display = 'block';
        bgVideo.play();

        showScreen('gameScreen');

        // ノーツ生成（例、単純に5秒に10個）
        if (spawnIntervalId) clearInterval(spawnIntervalId);
        spawnIntervalId = setInterval(() => {
            spawnNoteRandom();
        }, 60000 / selectedSong.bpm); // bpm連動

        requestAnimationFrame(gameLoop);
    }

    // --- ゲーム終了 ---
    function stopGame() {
        gameRunning = false;
        notes = [];
        if (spawnIntervalId) clearInterval(spawnIntervalId);

        bgm.pause();
        bgm.currentTime = 0;

        bgVideo.pause();
        bgVideo.currentTime = 0;
        bgVideo.style.display = 'none';

        showResult();
    }

    function showResult() {
        finalScoreDisplay.textContent = score;
        maxComboDisplay.textContent = maxCombo;
        showScreen('resultScreen');
    }

    function showScreen(screenId) {
        titleScreen.style.display = screenId === 'titleScreen' ? 'flex' : 'none';
        gameScreen.style.display = screenId === 'gameScreen' ? 'block' : 'none';
        resultScreen.style.display = screenId === 'resultScreen' ? 'flex' : 'none';
    }

    // --- ノーツ関連 ---
    function spawnNoteRandom() {
        if (!gameRunning) return;
        const laneIndex = Math.floor(Math.random() * laneKeys.length);
        notes.push({
            lane: laneIndex,
            y: 0,
            speed: noteSpeed,
            judged: false
        });
    }

    function gameLoop() {
        if (!gameRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawLanes();
        drawNotes();
        drawJudgeEffects();

        updateNotes();

        requestAnimationFrame(gameLoop);
    }

    function drawLanes() {
        const laneWidth = canvas.width / laneKeys.length;
        for (let i = 0; i < laneKeys.length; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#222' : '#333';
            ctx.fillRect(i * laneWidth, 0, laneWidth, canvas.height);

            // 判定ライン
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(i * laneWidth, canvas.height - 150);
            ctx.lineTo((i + 1) * laneWidth, canvas.height - 150);
            ctx.stroke();

            // キー表示
            ctx.fillStyle = '#aaa';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(laneKeys[i], i * laneWidth + laneWidth / 2, canvas.height - 100);
        }
    }

    function drawNotes() {
        const laneWidth = canvas.width / laneKeys.length;
        ctx.fillStyle = 'cyan';
        notes.forEach(note => {
            const x = note.lane * laneWidth + laneWidth / 2;
            const y = canvas.height - note.y;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    function updateNotes() {
        notes.forEach(note => {
            note.y += note.speed;
        });

        // 画面外のノーツをmiss扱いで削除
        notes = notes.filter(note => {
            if (note.y > canvas.height + 30 && !note.judged) {
                miss();
                note.judged = true;
                return false;
            }
            return !note.judged;
        });
    }

    function judgeNoteForKey(key) {
        const laneIndex = laneKeys.indexOf(key);
        if (laneIndex < 0) return;

        // 判定範囲内のノーツを探す
        // 判定ライン位置
        const judgeLineY = 150;
        const laneWidth = canvas.width / laneKeys.length;
        const candidateNotes = notes.filter(note =>
            note.lane === laneIndex && !note.judged
        );

        if (candidateNotes.length === 0) {
            miss();
            return;
        }

        // 1番近いノーツを判定
        let nearestNote = null;
        let nearestDist = Infinity;
        for (const note of candidateNotes) {
            const dist = Math.abs(note.y - (canvas.height - judgeLineY));
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestNote = note;
            }
        }

        if (nearestDist < 40) {
            perfect();
            nearestNote.judged = true;
            notes = notes.filter(n => n !== nearestNote);
        } else if (nearestDist < 80) {
            great();
            nearestNote.judged = true;
            notes = notes.filter(n => n !== nearestNote);
        } else if (nearestDist < 120) {
            good();
            nearestNote.judged = true;
            notes = notes.filter(n => n !== nearestNote);
        } else {
            miss();
        }
    }

    // --- 判定エフェクト ---
    function perfect() {
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        score += 1000;
        perfectSound.play();
    }
    function great() {
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        score += 500;
        greatSound.play();
    }
    function good() {
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        score += 250;
        goodSound.play();
    }
    function miss() {
        combo = 0;
        missSound.play();
    }

    function handleTouch(x, y) {
        // タッチ位置からレーン判定
        const laneWidth = canvas.width / laneKeys.length;
        const laneIndex = Math.floor(x / laneWidth);
        if (laneIndex >= 0 && laneIndex < laneKeys.length) {
            judgeNoteForKey(laneKeys[laneIndex]);
        }
    }

    init();
});
