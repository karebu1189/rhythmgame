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

    // --- 定数 ---
    const laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];
    const BASE_LANE_WIDTH = 60;

    // --- ゲーム状態 ---
    let selectedSong = null;
    let lanes = [];
    let notes = [];
    let judgeEffects = [];
    let effects = [];

    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let gameRunning = false;
    let spawnInterval = null;
    let noteSpeed = 5;
    let noteSpawnRate = 400;  // ms
    let gameTimerTimeout = null; // タイマーID

    // --- 曲リスト ---
    const songs = [
        { title: 'メデ', file: 'メデ.mp3', bpm: 140 },
        { title: 'トンデモワンダーズ', file: 'トンデモワンダーズ.mp3', bpm: 150 },
        { title: 'テトリス', file: 'テトリス.mp3', bpm: 120 },
        { title: 'マーシャル・マキシマイザー', file: 'マーシャル・マキシマイザー.mp3', bpm: 160 },
        { title: 'ブリキノダンス', file: 'ブリキノダンス.mp3', bpm: 160 },
        { title: 'シャルル', file: 'シャルル.mp3', bpm: 145 },
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
        // 曲リスト表示
        songList.innerHTML = '';
        songs.forEach((song, i) => {
            const btn = document.createElement('button');
            btn.textContent = song.title;
            btn.className = 'songItem';
            btn.addEventListener('click', () => {
                selectSong(i);
            });
            songList.appendChild(btn);
        });

        selectSong(0);
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        backButton.addEventListener('click', () => {
            stopGame();
            showScreen('titleScreen');
        });
        backButtonResult.addEventListener('click', () => {
            showScreen('titleScreen');
        });
        retryButton.addEventListener('click', () => {
            startGame();
        });

        startGameButton.addEventListener('click', () => {
            if (!selectedSong) return;
            startGame();
        });

        difficultySelector.addEventListener('change', () => {
            updateDifficulty();
        });

        showScreen('titleScreen');
    }

    // --- 画面切り替え ---
    function showScreen(screenId) {
        [titleScreen, gameScreen, resultScreen].forEach(s => s.style.display = 'none');
        if (screenId === 'titleScreen') titleScreen.style.display = 'flex';
        else if (screenId === 'gameScreen') gameScreen.style.display = 'flex';
        else if (screenId === 'resultScreen') resultScreen.style.display = 'flex';
    }

    // --- 曲選択 ---
    function selectSong(index) {
        selectedSong = songs[index];
        Array.from(songList.children).forEach((btn, i) => {
            btn.classList.toggle('selected', i === index);
        });
        startGameButton.disabled = false;
    }

    // --- 難易度設定 ---
    function updateDifficulty() {
        const diff = difficultySelector.value;
        switch (diff) {
            case 'easy':
                noteSpeed = 3;
                noteSpawnRate = 600;
                break;
            case 'normal':
                noteSpeed = 5;
                noteSpawnRate = 400;
                break;
            case 'hard':
                noteSpeed = 8;
                noteSpawnRate = 300;
                break;
            default:
                noteSpeed = 5;
                noteSpawnRate = 400;
                break;
        }
    }

    // --- キャンバスリサイズ ---
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const laneCount = Math.min(laneKeys.length, 8);
        const laneWidth = canvas.width / laneCount;
        lanes = [];
        for (let i = 0; i < laneCount; i++) {
            lanes.push(laneWidth * i + laneWidth / 2);
        }
    }

    // --- ノーツ生成 ---
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

    // --- ノーツ判定 ---
    function judgeNote(key) {
        if (!gameRunning) return;

        const laneIndex = laneKeys.indexOf(key);
        if (laneIndex === -1) return;

        // 判定範囲は判定ラインY +-40
        const judgeLineY = canvas.height - 150;
        let judged = false;

        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            if (note.laneIndex === laneIndex && !note.hit) {
                const dist = Math.abs(note.y - judgeLineY);

                if (dist <= 20) {
                    // PERFECT
                    handleHit(note, i, 'PERFECT');
                    judged = true;
                    break;
                } else if (dist <= 40) {
                    // GREAT
                    handleHit(note, i, 'GREAT');
                    judged = true;
                    break;
                } else if (dist <= 60) {
                    // GOOD
                    handleHit(note, i, 'GOOD');
                    judged = true;
                    break;
                }
            }
        }

        if (!judged) {
            // MISS判定（押したけどノーツなかった）
            missSound.play();
            combo = 0;
        }
    }

    // --- ヒット処理 ---
    function handleHit(note, index, judge) {
        note.hit = true;
        note.judgeResult = judge;

        notes.splice(index, 1);

        // スコアとコンボ
        switch (judge) {
            case 'PERFECT':
                score += 1000;
                combo++;
                perfectSound.play();
                break;
            case 'GREAT':
                score += 700;
                combo++;
                greatSound.play();
                break;
            case 'GOOD':
                score += 400;
                combo++;
                goodSound.play();
                break;
        }
        if (combo > maxCombo) maxCombo = combo;

        judgeEffects.push({ x: note.x, y: canvas.height - 150, judge, frame: 0 });
    }

    // --- ノーツ更新 ---
    function updateNotes() {
        for (let i = notes.length - 1; i >= 0; i--) {
            const note = notes[i];
            note.y += noteSpeed;

            // 判定ラインを超えてMISS扱いに
            if (!note.hit && note.y > canvas.height - 110) {
                notes.splice(i, 1);
                missSound.play();
                combo = 0;
            }
        }
    }

    // --- 判定エフェクト更新 ---
    function updateJudgeEffects() {
        for (let i = judgeEffects.length - 1; i >= 0; i--) {
            const e = judgeEffects[i];
            e.frame++;
            if (e.frame > 30) {
                judgeEffects.splice(i, 1);
            }
        }
    }

    // --- 描画 ---
    function draw() {
        // 背景
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // レーン描画
        const laneWidth = canvas.width / lanes.length;
        for (let i = 0; i < lanes.length; i++) {
            const x = i * laneWidth;
            ctx.fillStyle = (i % 2 === 0) ? '#222' : '#333';
            ctx.fillRect(x, 0, laneWidth, canvas.height);

            // レーン境界線
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // 判定ライン
        const judgeLineY = canvas.height - 150;
        ctx.strokeStyle = '#f90';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, judgeLineY);
        ctx.lineTo(canvas.width, judgeLineY);
        ctx.stroke();

        // ノーツ描画（横長の四角形）
        notes.forEach(note => {
            ctx.fillStyle = '#ff6';
            const width = 60;  // 横長の幅
            const height = 30; // 高さは短め
            ctx.fillRect(note.x - width / 2, note.y - height / 2, width, height);

            ctx.strokeStyle = '#ffa';
            ctx.lineWidth = 3;
            ctx.strokeRect(note.x - width / 2, note.y - height / 2, width, height);
        });

        // 判定エフェクト描画
        judgeEffects.forEach(e => {
            let color = 'white';
            switch (e.judge) {
                case 'PERFECT': color = 'gold'; break;
                case 'GREAT': color = 'skyblue'; break;
                case 'GOOD': color = 'lightgreen'; break;
            }
            ctx.fillStyle = color;
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(e.judge, e.x, e.y - e.frame * 2);
        });

        // スコア・コンボ表示
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 20, 40);

        ctx.fillText(`Combo: ${combo}`, 20, 80);
    }

    // --- ゲームループ ---
    function gameLoop() {
        if (!gameRunning) return;

        updateNotes();
        updateJudgeEffects();

        draw();

        requestAnimationFrame(gameLoop);
    }

    // --- ゲーム開始 ---
    function startGame() {
        resetGame();
        showScreen('gameScreen');

        // BGM再生はcanplaythrough待ちで安定
        bgm.src = selectedSong.file;
        bgm.currentTime = 0;
        bgm.oncanplaythrough = () => {
            bgm.play();
        };

        gameRunning = true;
        spawnInterval = setInterval(spawnNote, noteSpawnRate);

        window.addEventListener('keydown', keydownHandler);

        gameLoop();

        gameTimer();
    }

    // --- ゲーム終了 ---
    function stopGame() {
        gameRunning = false;
        clearInterval(spawnInterval);
        clearTimeout(gameTimerTimeout);
        window.removeEventListener('keydown', keydownHandler);
        bgm.pause();
        bgm.currentTime = 0;
    }

    // --- ゲームリセット ---
    function resetGame() {
        notes = [];
        judgeEffects = [];
        score = 0;
        combo = 0;
        maxCombo = 0;
        updateDifficulty();
    }

    // --- キー入力 ---
    function keydownHandler(e) {
        const key = e.key.toUpperCase();
        judgeNote(key);
        tapSound.play();
    }

    // --- ゲームタイマー（曲の長さで終了） ---
    function gameTimer() {
        // とりあえず曲長めの60秒で終了設定（mp3の実際の長さに差し替え推奨）
        gameTimerTimeout = setTimeout(() => {
            stopGame();
            showResult();
        }, 60000);
    }

    // --- リザルト表示 ---
    function showResult() {
        showScreen('resultScreen');
        document.getElementById('resultScore').textContent = score;
        document.getElementById('resultCombo').textContent = maxCombo;
    }

    // --- 初期化呼び出し ---
    init();
});
