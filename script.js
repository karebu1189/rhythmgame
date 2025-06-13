document.addEventListener('DOMContentLoaded', () => {
    // ====================
    // DOM要素取得
    // ====================
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
    const bgVideo = document.getElementById('bgVideo');

    const tapSound = document.getElementById('tapSound');
    const perfectSound = document.getElementById('perfectSound');
    const greatSound = document.getElementById('greatSound');
    const goodSound = document.getElementById('goodSound');
    const missSound = document.getElementById('missSound');

    const finalScoreDisplay = document.getElementById('finalScore');
    const maxComboDisplay = document.getElementById('maxCombo');

    const laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];

    // ====================
    // ゲームデータ
    // ====================
    let selectedSong = null;
    let lanes = [];
    let notes = [];
    let judgeEffects = [];
    let tapEffects = [];

    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let noteSpeed = 5;
    let gameRunning = false;
    let spawnIntervalId = null;

    const songs = [
        { title: 'メデ', file: 'メデ.mp3', bpm: 172, mv: 'メデ.mp4' },
        { title: 'トンデモワンダーズ', file: 'トンデモワンダーズ.mp3', bpm: 172, mv: 'tondemo.mp4' },
        { title: 'テトリス', file: 'テトリス.mp3', bpm: 170, mv: 'tetris.mp4' },
        { title: 'マーシャル・マキシマイザー', file: 'マーシャル・マキシマイザー.mp3', bpm: 135, mv: 'maximizer.mp4' },
        { title: 'スマイル_シンフォニー', file: 'スマイル_シンフォニー.mp3', bpm: 150, mv: 'smile.mp4' },
        { title: 'ロストアンブレラ', file: 'ロストアンブレラ.mp3', bpm: 102, mv: 'umbrella.mp4' },
        { title: 'ラビットホール', file: 'ラビットホール.mp3', bpm: 173, mv: 'rabbit.mp4' },
        { title: 'ドラマツルギー', file: 'ドラマツルギー.mp3', bpm: 150, mv: 'drama.mp4' },
        { title: 'KING', file: 'KING.mp3', bpm: 166, mv: 'king.mp4' },
        { title: 'ビターチョコデコレーション', file: 'ビターチョコデコレーション.mp3', bpm: 180, mv: 'choco.mp4' },
        { title: 'ロウワー', file: 'ロウワー.mp3', bpm: 160, mv: 'lower.mp4' },
        { title: '夜に駆ける', file: '夜に駆ける.mp3', bpm: 130, mv: 'yoru.mp4' },
        { title: 'マリーゴールド', file: 'マリーゴールド.mp3', bpm: 130, mv: 'marigold.mp4' },
        { title: 'ドライフラワー', file: 'ドライフラワー.mp3', bpm: 125, mv: 'dryflower.mp4' },
        { title: '香水', file: '香水.mp3', bpm: 140, mv: 'perfume.mp4' },
        { title: 'Pretender', file: 'Pretender.mp3', bpm: 140, mv: 'pretender.mp4' }
    ];

    // ====================
    // 初期化
    // ====================
    function init() {
        // 曲リスト生成
        songList.innerHTML = '';
        songs.forEach((song, index) => {
            const btn = document.createElement('button');
            btn.textContent = song.title;
            btn.className = 'songItem';
            btn.addEventListener('click', () => selectSong(index));
            songList.appendChild(btn);
        });

        selectSong(0);
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // ボタン処理
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

        difficultySelector.addEventListener('change', updateDifficulty);

        // タッチ処理
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (const touch of e.touches) {
                handleTouch(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        // キー処理
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

    // ====================
    // 画面表示切り替え
    // ====================
    function showScreen(screenId) {
        [titleScreen, gameScreen, resultScreen].forEach(s => s.style.display = 'none');
        document.getElementById(screenId).style.display = 'flex';
    }

    // ====================
    // 曲選択
    // ====================
    function selectSong(index) {
        selectedSong = songs[index];
        Array.from(songList.children).forEach((btn, i) => {
            btn.classList.toggle('selected', i === index);
        });
        startGameButton.disabled = false;
    }

    // ====================
    // 難易度変更
    // ====================
    function updateDifficulty() {
        const diff = difficultySelector.value;
        noteSpeed = diff === 'easy' ? 3 : diff === 'hard' ? 8 : 5;
    }

    // ====================
    // キャンバスリサイズ
    // ====================
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

    // ====================
    // ゲーム開始
    // ====================
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

        bgVideo.src = selectedSong.mv;
        bgVideo.currentTime = 0;
        bgVideo.style.display = 'block';
        bgVideo.play();

        gameRunning = true;

        bgm.play().then(() => {
            startNoteSpawning();
        }).catch(err => console.error('再生エラー:', err));

        bgm.onended = () => {
            stopGame();
            showResult();
        };

        gameLoop();
        showScreen('gameScreen');
    }

    // ====================
    // ゲーム停止
    // ====================
    function stopGame() {
        gameRunning = false;
        clearInterval(spawnIntervalId);
        bgm.pause();
        bgm.currentTime = 0;

        bgVideo.pause();
        bgVideo.currentTime = 0;
        bgVideo.style.display = 'none';
    }

    // ====================
    // ノーツ生成
    // ====================
    function startNoteSpawning() {
        const interval = 60000 / selectedSong.bpm;
        spawnIntervalId = setInterval(() => {
            if (gameRunning) spawnNote();
        }, interval);
    }

    function spawnNote() {
        const laneIndex = Math.floor(Math.random() * lanes.length);
        notes.push({ x: lanes[laneIndex], y: 0, laneIndex, hit: false, judgeResult: null });
    }

    // ====================
    // 判定処理
    // ====================
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

                if (dist <= 20) {
                    note.hit = true;

                    // 判定ランク判定
                    let result = '';
                    if (dist <= 8) {
                        score += 1000;
                        combo++;
                        result = 'PERFECT';
                        perfectSound.currentTime = 0;
                        perfectSound.play();
                    } else if (dist <= 15) {
                        score += 700;
                        combo++;
                        result = 'GREAT';
                        greatSound.currentTime = 0;
                        greatSound.play();
                    } else {
                        score += 300;
                        combo++;
                        result = 'GOOD';
                        goodSound.currentTime = 0;
                        goodSound.play();
                    }
                    note.judgeResult = result;

                    maxCombo = Math.max(maxCombo, combo);

                    judgeEffects.push({ x: note.x, y: note.y, result, frame: 0 });

                    judged = true;
                    break;
                }
            }
        }

        if (!judged) {
            combo = 0;
            missSound.currentTime = 0;
            missSound.play();
        }
    }

    // ====================
    // タッチ判定
    // ====================
    function handleTouch(x, y) {
        const laneAreaWidth = canvas.width * 0.5;
        const laneWidth = laneAreaWidth / laneKeys.length;
        const startX = (canvas.width - laneAreaWidth) / 2;

        for (let i = 0; i < laneKeys.length; i++) {
            const laneXStart = startX + laneWidth * i;
            const laneXEnd = laneXStart + laneWidth;
            if (x >= laneXStart && x <= laneXEnd) {
                judgeNote(laneKeys[i]);
                break;
            }
        }
    }

    // ====================
    // ゲームループ（描画・更新）
    // ====================
    function gameLoop() {
        if (!gameRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawLanes();
        updateAndDrawNotes();
        updateAndDrawJudgeEffects();
        updateAndDrawTapEffects();
        drawScore();

        requestAnimationFrame(gameLoop);
    }

    // ====================
    // レーン描画
    // ====================
    function drawLanes() {
        const laneAreaWidth = canvas.width * 0.5;
        const laneWidth = laneAreaWidth / lanes.length;
        const startX = (canvas.width - laneAreaWidth) / 2;

        // レーン背景
        ctx.fillStyle = '#111';
        ctx.fillRect(startX, 0, laneAreaWidth, canvas.height);

        // レーン区切り線
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        for (let i = 0; i <= lanes.length; i++) {
            const x = startX + laneWidth * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // 判定ライン
        const judgeLineY = canvas.height - 150;
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, judgeLineY);
        ctx.lineTo(startX + laneAreaWidth, judgeLineY);
        ctx.stroke();
    }

    // ====================
    // ノーツ更新・描画
    // ====================
    function updateAndDrawNotes() {
        const judgeLineY = canvas.height - 150;

        for (let i = notes.length - 1; i >= 0; i--) {
            const note = notes[i];
            if (!note.hit) {
                note.y += noteSpeed;
                if (note.y > canvas.height) {
                    // ミス判定
                    notes.splice(i, 1);
                    combo = 0;
                    missSound.currentTime = 0;
                    missSound.play();
                }
            }

            // ノーツ描画
            if (!note.hit) {
                ctx.fillStyle = 'deepskyblue';
                ctx.beginPath();
                ctx.arc(note.x, note.y, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ====================
    // 判定エフェクト描画
    // ====================
    function updateAndDrawJudgeEffects() {
        for (let i = judgeEffects.length - 1; i >= 0; i--) {
            const effect = judgeEffects[i];
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';

            switch (effect.result) {
                case 'PERFECT':
                    ctx.fillStyle = 'lime';
                    break;
                case 'GREAT':
                    ctx.fillStyle = 'deepskyblue';
                    break;
                case 'GOOD':
                    ctx.fillStyle = 'yellow';
                    break;
                case 'MISS':
                    ctx.fillStyle = 'red';
                    break;
                default:
                    ctx.fillStyle = 'white';
            }

            ctx.fillText(effect.result, effect.x, effect.y - effect.frame * 2);

            effect.frame++;
            if (effect.frame > 30) judgeEffects.splice(i, 1);
        }
    }

    // ====================
    // タップエフェクト描画
    // ====================
    function updateAndDrawTapEffects() {
        for (let i = tapEffects.length - 1; i >= 0; i--) {
            const effect = tapEffects[i];
            const alpha = 1 - effect.frame / 20;
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.arc(effect.x, effect.y, 20 + effect.frame * 2, 0, Math.PI * 2);
            ctx.stroke();

            effect.frame++;
            if (effect.frame > 20) tapEffects.splice(i, 1);
        }
    }

    // ====================
    // スコア描画
    // ====================
    function drawScore() {
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, 20, 40);
        ctx.fillText(`Combo: ${combo}`, 20, 70);
    }

    // ====================
    // リザルト表示
    // ====================
    function showResult() {
        finalScoreDisplay.textContent = score;
        maxComboDisplay.textContent = maxCombo;
        showScreen('resultScreen');
    }

    // ====================
    // 初期化実行
    // ====================
    init();
});
