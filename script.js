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
    const perfectCountDisplay = document.getElementById('perfectCount');
    const greatCountDisplay = document.getElementById('greatCount');
    const goodCountDisplay = document.getElementById('goodCount');
    const missCountDisplay = document.getElementById('missCount');
    const rankDisplay = document.getElementById('rankDisplay');

    const laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];

    // ====================
    // ゲームデータ
    // ====================
    let selectedSong = null;
    let lanes = [];
    let notes = [];
    let judgeEffects = [];
    let lineGlowAlpha = 0;

    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let noteSpeed = 5;
    let gameRunning = false;

    let perfectCount = 0;
    let greatCount = 0;
    let goodCount = 0;
    let missCount = 0;

    let judgeLineY = 0;

    // ====================
    // 曲データ
    // ====================
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
    // 初期化処理
    // ====================
    function init() {
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

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (const touch of e.touches) {
                handleTouch(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        window.addEventListener('keydown', e => {
            if (!gameRunning) return;
            const key = e.key.toUpperCase();
            const laneIndex = laneKeys.indexOf(key);
            if (laneIndex !== -1) {
                judgeNote(laneIndex);
                playTapSound();
                flashJudgeLine();
            }
        });

        createLanes(8);
        updateDifficulty();
        showScreen('titleScreen');
        requestAnimationFrame(gameLoop);
    }

    // ====================
    // 画面切り替え
    // ====================
    function showScreen(screenId) {
        titleScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'none';
        document.getElementById(screenId).style.display = 'block';
    }

    // ====================
    // 曲選択
    // ====================
    function selectSong(index) {
        selectedSong = songs[index];
        bgVideo.src = selectedSong.mv;
        bgVideo.load();
        bgm.src = selectedSong.file;
        bgm.load();
        updateDifficulty();
    }

    // ====================
    // 難易度更新
    // ====================
    function updateDifficulty() {
        const level = difficultySelector.value;
        switch(level) {
            case 'easy':
                noteSpeed = 3;
                break;
            case 'normal':
                noteSpeed = 5;
                break;
            case 'hard':
                noteSpeed = 7;
                break;
            default:
                noteSpeed = 5;
        }
    }

    // ====================
    // レーン生成
    // ====================
    function createLanes(count) {
        lanes = [];
        for (let i = 0; i < count; i++) {
            lanes.push({
                x: 50 + i * 60,
                width: 50,
                key: laneKeys[i],
            });
        }
    }

    // ====================
    // ノーツクラス
    // ====================
    class Note {
        constructor(laneIndex, time) {
            this.laneIndex = laneIndex;
            this.y = -50;
            this.hit = false;
            this.judged = false;
            this.time = time;
        }
        update(deltaTime) {
            this.y += noteSpeed;
            if (this.y > canvas.height + 50 && !this.judged) {
                this.judged = true;
                missCount++;
                combo = 0;
                addJudgeEffect(this.laneIndex, 'MISS');
                playMissSound();
            }
        }
        draw(ctx) {
            ctx.fillStyle = this.hit ? 'rgba(255,255,255,0.3)' : 'cyan';
            const lane = lanes[this.laneIndex];
            ctx.fillRect(lane.x, this.y, lane.width, 20);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(lane.x, this.y, lane.width, 20);
        }
    }

    // ====================
    // 判定エフェクトクラス
    // ====================
    class JudgeEffect {
        constructor(laneIndex, text) {
            this.laneIndex = laneIndex;
            this.text = text;
            this.alpha = 1;
            this.y = judgeLineY - 30;
        }
        update(deltaTime) {
            this.alpha -= 0.02;
            if (this.alpha < 0) this.alpha = 0;
        }
        draw(ctx) {
            if (this.alpha <= 0) return;
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = 'yellow';
            ctx.font = '20px Arial';
            const lane = lanes[this.laneIndex];
            ctx.fillText(this.text, lane.x + 10, this.y);
            ctx.globalAlpha = 1;
        }
    }

    // ====================
    // ゲーム開始
    // ====================
    function startGame() {
        resetGame();
        generateNotes();
        bgm.currentTime = 0;
        bgm.play();
        if (bgVideo) {
            bgVideo.currentTime = 0;
            bgVideo.play();
        }
        gameRunning = true;
        showScreen('gameScreen');
    }

    // ====================
    // ゲーム停止
    // ====================
    function stopGame() {
        gameRunning = false;
        bgm.pause();
        if (bgVideo) bgVideo.pause();
    }

    // ====================
    // ゲームリセット
    // ====================
    function resetGame() {
        notes = [];
        judgeEffects = [];
        score = 0;
        combo = 0;
        maxCombo = 0;
        perfectCount = 0;
        greatCount = 0;
        goodCount = 0;
        missCount = 0;
    }

    // ====================
    // ノーツ生成（ランダム生成例）
    // ====================
    function generateNotes() {
        // 30秒間で50ノーツをランダム配置（例）
        const totalNotes = 50;
        const totalLanes = lanes.length;
        for (let i = 0; i < totalNotes; i++) {
            const lane = Math.floor(Math.random() * totalLanes);
            const timeOffset = i * 500; // 0.5秒間隔
            notes.push(new Note(lane, timeOffset));
        }
    }

    // ====================
    // ノーツ判定
    // ====================
    function judgeNote(laneIndex) {
        // 判定許容範囲（px）
        const judgeLine = judgeLineY;
        const windowPerfect = 15;
        const windowGreat = 30;
        const windowGood = 50;

        let judged = false;

        for (const note of notes) {
            if (note.laneIndex === laneIndex && !note.judged) {
                const diff = Math.abs(note.y - judgeLine);
                if (diff <= windowGood) {
                    note.judged = true;
                    note.hit = true;
                    judged = true;

                    if (diff <= windowPerfect) {
                        perfectCount++;
                        score += 1000;
                        combo++;
                        addJudgeEffect(laneIndex, 'PERFECT');
                        playPerfectSound();
                    } else if (diff <= windowGreat) {
                        greatCount++;
                        score += 700;
                        combo++;
                        addJudgeEffect(laneIndex, 'GREAT');
                        playGreatSound();
                    } else {
                        goodCount++;
                        score += 400;
                        combo++;
                        addJudgeEffect(laneIndex, 'GOOD');
                        playGoodSound();
                    }
                    if (combo > maxCombo) maxCombo = combo;
                    flashJudgeLine();
                    break;
                }
            }
        }

        if (!judged) {
            // ミス扱い
            missCount++;
            combo = 0;
            addJudgeEffect(laneIndex, 'MISS');
            playMissSound();
            flashJudgeLine();
        }
    }

    // ====================
    // 判定ライン光らせる演出
    // ====================
    function flashJudgeLine() {
        lineGlowAlpha = 1;
    }

    // ====================
    // 判定エフェクト追加
    // ====================
    function addJudgeEffect(laneIndex, text) {
        judgeEffects.push(new JudgeEffect(laneIndex, text));
    }

    // ====================
    // タップ音再生
    // ====================
    function playTapSound() {
        tapSound.currentTime = 0;
        tapSound.play();
    }
    function playPerfectSound() {
        perfectSound.currentTime = 0;
        perfectSound.play();
    }
    function playGreatSound() {
        greatSound.currentTime = 0;
        greatSound.play();
    }
    function playGoodSound() {
        goodSound.currentTime = 0;
        goodSound.play();
    }
    function playMissSound() {
        missSound.currentTime = 0;
        missSound.play();
    }

    // ====================
    // タッチ判定処理
    // ====================
    function handleTouch(x, y) {
        // タッチx座標からレーン判定
        for (let i = 0; i < lanes.length; i++) {
            const lane = lanes[i];
            if (x >= lane.x && x <= lane.x + lane.width) {
                judgeNote(i);
                playTapSound();
                flashJudgeLine();
                break;
            }
        }
    }

    // ====================
    // ゲームループ
    // ====================
    let lastTimestamp = 0;
    function gameLoop(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        if (gameRunning) {
            update(deltaTime);
            draw();
        }

        requestAnimationFrame(gameLoop);
    }

    // ====================
    // 更新処理
    // ====================
    function update(deltaTime) {
        // ノーツ更新
        notes.forEach(note => note.update(deltaTime));

        // 判定エフェクト更新
        judgeEffects.forEach(effect => effect.update(deltaTime));
        judgeEffects = judgeEffects.filter(e => e.alpha > 0);

        // 判定ライン光演出減衰
        lineGlowAlpha -= 0.05;
        if (lineGlowAlpha < 0) lineGlowAlpha = 0;

        // 曲終了判定（bgm終了時）
        if (bgm.ended) {
            gameRunning = false;
            showResult();
            showScreen('resultScreen');
        }
    }

    // ====================
    // 描画処理
    // ====================
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 背景動画はvideoタグで表示済みなのでここはレーンとノーツ描画

        // レーン描画
        lanes.forEach(lane => {
            ctx.fillStyle = '#222';
            ctx.fillRect(lane.x, 0, lane.width, canvas.height);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(lane.x, 0, lane.width, canvas.height);

            // キー名表示
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText(lane.key, lane.x + 15, canvas.height - 20);
        });

        // 判定ライン描画
        judgeLineY = canvas.height - 100;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + lineGlowAlpha * 0.5})`;
        ctx.fillRect(40, judgeLineY, lanes.length * 60, 5);

        // ノーツ描画
        notes.forEach(note => {
            if (!note.judged) note.draw(ctx);
        });

        // 判定エフェクト描画
        judgeEffects.forEach(effect => effect.draw(ctx));

        // スコア表示
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${score}`, 20, 30);
        ctx.fillText(`Combo: ${combo}`, 20, 60);
    }

    // ====================
    // リザルト画面表示
    // ====================
    function showResult() {
        finalScoreDisplay.textContent = score;
        maxComboDisplay.textContent = maxCombo;
        perfectCountDisplay.textContent = perfectCount;
        greatCountDisplay.textContent = greatCount;
        goodCountDisplay.textContent = goodCount;
        missCountDisplay.textContent = missCount;

        // ランク判定（例）
        let rank = 'C';
        const accuracy = (perfectCount * 1 + greatCount * 0.8 + goodCount * 0.5) / (perfectCount + greatCount + goodCount + missCount);
        if (accuracy > 0.9) rank = 'S';
        else if (accuracy > 0.8) rank = 'A';
        else if (accuracy > 0.7) rank = 'B';
        else if (accuracy > 0.6) rank = 'C';
        else rank = 'D';
        rankDisplay.textContent = rank;
    }

    // ====================
    // キャンバスサイズ調整
    // ====================
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // 初期化実行
    init();
});
