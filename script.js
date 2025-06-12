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

    // --- ゲーム状態 ---
    let selectedSong = null;
    let lanes = [];
    let notes = [];
    let judgeEffects = [];
    let tapEffects = [];
    let hitEffects = [];

    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let gameRunning = false;
    let spawnInterval = null;
    let noteSpeed = 5;
    let noteSpawnRate = 400;  // ms
    let gameTimerTimeout = null;

    // 判定ラインの光りの強さ（0〜1）
    let judgeLineGlow = 0;

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

        const laneAreaWidth = canvas.width * 0.5;
        const laneWidth = laneAreaWidth / laneKeys.length;

        lanes = [];
        for (let i = 0; i < laneKeys.length; i++) {
            const startX = (canvas.width - laneAreaWidth) / 2;
            lanes.push(startX + laneWidth * i + laneWidth / 2);
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

        // タップエフェクト追加
        tapEffects.push({
            x: lanes[laneIndex],
            y: canvas.height - 150,
            frame: 0,
        });

        const judgeLineY = canvas.height - 150;
        let judged = false;

        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            if (note.laneIndex === laneIndex && !note.hit) {
                const dist = Math.abs(note.y - judgeLineY);

                if (dist <= 20) {
                    handleHit(note, i, 'PERFECT');
                    judged = true;
                    break;
                } else if (dist <= 40) {
                    handleHit(note, i, 'GREAT');
                    judged = true;
                    break;
                } else if (dist <= 60) {
                    handleHit(note, i, 'GOOD');
                    judged = true;
                    break;
                }
            }
        }

        if (!judged) {
            missSound.play();
            combo = 0;
        }
    }

    // --- ヒット処理 ---
    function handleHit(note, index, judge) {
        note.hit = true;
        note.judgeResult = judge;

        notes.splice(index, 1);

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

        // 判定ラインを光らせる
        judgeLineGlow = 1;

        // 爆発エフェクト追加
        hitEffects.push({
            x: note.x,
            y: canvas.height - 150,
            radius: 0,
            maxRadius: 50,
            alpha: 1,
        });
    }

    // --- ノーツ更新 ---
    function updateNotes() {
        for (let i = notes.length - 1; i >= 0; i--) {
            const note = notes[i];
            note.y += noteSpeed;
            if (note.y > canvas.height + 50) {
                notes.splice(i, 1);
                combo = 0;
                missSound.play();
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

    // --- タップエフェクト更新 ---
    function updateTapEffects() {
        for (let i = tapEffects.length - 1; i >= 0; i--) {
            const e = tapEffects[i];
            e.frame++;
            if (e.frame > 15) {
                tapEffects.splice(i, 1);
            }
        }
    }

    // --- 爆発エフェクト更新 ---
    function updateHitEffects() {
        for (let i = hitEffects.length - 1; i >= 0; i--) {
            const e = hitEffects[i];
            e.radius += 5;
            e.alpha -= 0.1;
            if (e.alpha <= 0) {
                hitEffects.splice(i, 1);
            }
        }
    }

    // --- 描画 ---
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 背景
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // レーン描画
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        lanes.forEach(x => {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        });

        // 判定ライン描画（光りの強さに応じて色と太さ変化）
        const judgeLineY = canvas.height - 150;
        const glowAlpha = judgeLineGlow;
        ctx.strokeStyle = `rgba(255, 255, 0, ${0.4 + glowAlpha * 0.6})`;
        ctx.lineWidth = 4 + glowAlpha * 4;
        ctx.beginPath();
        ctx.moveTo(lanes[0] - (lanes[1] - lanes[0]) / 2, judgeLineY);
        ctx.lineTo(lanes[lanes.length - 1] + (lanes[1] - lanes[0]) / 2, judgeLineY);
        ctx.stroke();

        // ノーツ描画
        notes.forEach(note => {
            ctx.fillStyle = '#0af';
            ctx.beginPath();
            ctx.arc(note.x, note.y, 20, 0, Math.PI * 2);
            ctx.fill();
        });

        // 判定エフェクト描画
        judgeEffects.forEach(e => {
            ctx.font = '24px Arial';
            ctx.fillStyle = `rgba(255, 255, 255, ${1 - e.frame / 30})`;
            ctx.textAlign = 'center';
            ctx.fillText(e.judge, e.x, e.y - e.frame * 2);
        });

        // タップエフェクト描画
        tapEffects.forEach(e => {
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - e.frame / 15})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 30 + e.frame * 2, 0, Math.PI * 2);
            ctx.stroke();
        });

        // 爆発エフェクト描画
        hitEffects.forEach(e => {
            ctx.save();
            ctx.globalAlpha = e.alpha;
            const gradient = ctx.createRadialGradient(e.x, e.y, e.radius * 0.3, e.x, e.y, e.radius);
            gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
            gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // スコア・コンボ表示
        ctx.fillStyle = '#fff';
        ctx.font = '28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 20, 40);
        ctx.fillText(`Combo: ${combo}`, 20, 80);

        // 判定ラインの光りを徐々に消す
        judgeLineGlow *= 0.9;
    }

    // --- ゲーム開始 ---
    function startGame() {
        resetGame();
        updateDifficulty();
        showScreen('gameScreen');

        bgm.src = selectedSong.file;
        bgm.currentTime = 0;
        bgm.play();

        gameRunning = true;

        spawnInterval = setInterval(spawnNote, noteSpawnRate);

        gameTimerTimeout = setTimeout(() => {
            endGame();
        }, 60000); // 60秒プレイ

        requestAnimationFrame(gameLoop);
    }

    // --- ゲーム終了 ---
    function endGame() {
        gameRunning = false;
        clearInterval(spawnInterval);
        clearTimeout(gameTimerTimeout);
        bgm.pause();
        showResult();
        showScreen('resultScreen');
    }

    // --- ゲームリセット ---
    function resetGame() {
        notes = [];
        judgeEffects = [];
        tapEffects = [];
        hitEffects = [];
        score = 0;
        combo = 0;
        maxCombo = 0;
        judgeLineGlow = 0;
    }

    // --- リザルト表示 ---
    function showResult() {
        const resultScore = document.getElementById('resultScore');
        const resultMaxCombo = document.getElementById('resultMaxCombo');
        resultScore.textContent = `スコア: ${score}`;
        resultMaxCombo.textContent = `最大コンボ: ${maxCombo}`;
    }

    // --- ゲームループ ---
    function gameLoop() {
        if (!gameRunning) return;
        updateNotes();
        updateJudgeEffects();
        updateTapEffects();
        updateHitEffects();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // --- キーボード入力 ---
    document.addEventListener('keydown', e => {
        const key = e.key.toUpperCase();
        judgeNote(key);
        tapSound.currentTime = 0;
        tapSound.play();
    });

    // --- 初期化実行 ---
    init();
});
