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
    let tapEffects = [];
    let lineGlowAlpha = 0;

    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let noteSpeed = 5;
    let gameRunning = false;
    let spawnIntervalId = null;

    // 判定ごとのカウント
    let perfectCount = 0;
    let greatCount = 0;
    let goodCount = 0;
    let missCount = 0;

    // 判定ラインY座標（動的に計算）
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
    // 初期化
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

        // 初期レーンと速度設定
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
        // mv更新
        bgVideo.src = selectedSong.mv;
        bgVideo.load();
        // BGM準備
        bgm.src = selectedSong.file;
        bgm.load();
        updateDifficulty();
    }

    // ====================
    // 難易度切替
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
    // レーン作成
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
            this.y = -50; // スポーン位置
            this.hit = false;
            this.judged = false;
            this.time = time;  // 発生時間(ms)
        }
        update(deltaTime) {
            this.y += noteSpeed;
            if (this.y > canvas.height + 100 && !this.judged) {
                // MISS判定
                this.judged = true;
                missCount++;
                combo = 0;
                playMissSound();
            }
        }
        draw() {
            if (this.judged) return;
            const lane = lanes[this.laneIndex];
            ctx.fillStyle = 'cyan';
            ctx.fillRect(lane.x, this.y, lane.width, 20);
        }
    }

    // ====================
    // 譜面生成
    // ====================
    function generateNotes() {
        notes = [];
        // BPMから1秒あたりの拍数 = bpm/60
        const bpm = selectedSong.bpm;
        const beatInterval = 60000 / bpm; // ms
        const totalDuration = 60000; // 1分譜面

        for (let t = 0; t < totalDuration; t += beatInterval) {
            // ランダムに単押しノーツを生成（同時押しなし）
            const laneIndex = Math.floor(Math.random() * lanes.length);
            notes.push(new Note(laneIndex, t));
        }
    }

    // ====================
    // ゲーム開始
    // ====================
    function startGame() {
        resetGame();
        generateNotes();
        bgm.currentTime = 0;
        bgVideo.currentTime = 0;
        bgm.play();
        bgVideo.play();
        gameRunning = true;
        showScreen('gameScreen');
    }

    // ====================
    // ゲーム停止
    // ====================
    function stopGame() {
        gameRunning = false;
        bgm.pause();
        bgVideo.pause();
        notes = [];
    }

    // ====================
    // リセット
    // ====================
    function resetGame() {
        score = 0;
        combo = 0;
        maxCombo = 0;
        perfectCount = 0;
        greatCount = 0;
        goodCount = 0;
        missCount = 0;
        notes = [];
        judgeEffects = [];
        tapEffects = [];
        lineGlowAlpha = 0;
    }

    // ====================
    // ノーツ判定
    // ====================
    function judgeNote(laneIndex) {
        if (!gameRunning) return;
        const lane = lanes[laneIndex];
        // 判定範囲上下限
        const judgeY = judgeLineY;
        const rangePerfect = 15;
        const rangeGreat = 30;
        const rangeGood = 50;

        // 判定可能ノーツの中でY座標が判定ライン付近のものを探す
        let judged = false;
        for (const note of notes) {
            if (note.laneIndex !== laneIndex) continue;
            if (note.judged) continue;
            const diff = Math.abs(note.y - judgeY);

            if (diff <= rangePerfect) {
                note.judged = true;
                judged = true;
                perfectCount++;
                combo++;
                score += 1000 + combo * 10;
                playPerfectSound();
                showJudgeEffect('PERFECT', lane.x, judgeY);
                break;
            } else if (diff <= rangeGreat) {
                note.judged = true;
                judged = true;
                greatCount++;
                combo++;
                score += 800 + combo * 5;
                playGreatSound();
                showJudgeEffect('GREAT', lane.x, judgeY);
                break;
            } else if (diff <= rangeGood) {
                note.judged = true;
                judged = true;
                goodCount++;
                combo++;
                score += 500;
                playGoodSound();
                showJudgeEffect('GOOD', lane.x, judgeY);
                break;
            }
        }

        if (!judged) {
            // 判定できなかったらMISS
            missCount++;
            combo = 0;
            playMissSound();
            showJudgeEffect('MISS', lane.x, judgeY);
        }

        if (combo > maxCombo) maxCombo = combo;
    }

    // ====================
    // タップ判定（スマホ用）
    // ====================
    function handleTouch(x, y) {
        // レーンのX座標から判定
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
    // 判定ラインの光らせ演出
    // ====================
    function flashJudgeLine() {
        lineGlowAlpha = 1.0;
    }

    // ====================
    // 判定エフェクト表示
    // ====================
    function showJudgeEffect(text, x, y) {
        judgeEffects.push({ text, x, y, alpha: 1.0 });
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
    // ランク判定
    // ====================
    function getRank() {
        const totalNotes = perfectCount + greatCount + goodCount + missCount;
        if (totalNotes === 0) return 'F';

        const accuracy = (perfectCount * 1.0 + greatCount * 0.8 + goodCount * 0.5) / totalNotes;

        if (accuracy >= 0.95) return 'S';
        if (accuracy >= 0.90) return 'A';
        if (accuracy >= 0.80) return 'B';
        if (accuracy >= 0.70) return 'C';
        if (accuracy >= 0.60) return 'D';
        return 'F';
    }

    // ====================
    // リザルト画面表示
    // ====================
    function showResult() {
        finalScoreDisplay.textContent = score.toString();
        maxComboDisplay.textContent = maxCombo.toString();
        perfectCountDisplay.textContent = perfectCount.toString();
        greatCountDisplay.textContent = greatCount.toString();
        goodCountDisplay.textContent = goodCount.toString();
        missCountDisplay.textContent = missCount.toString();
        rankDisplay.textContent = getRank();
        showScreen('resultScreen');
    }

    // ====================
    // キャンバスサイズ調整
    // ====================
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        judgeLineY = canvas.height - 150;
    }

    // ====================
    // メインループ
    // ====================
    let lastTimestamp = 0;
    function gameLoop(timestamp = 0) {
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 判定ライン光演出
        if (lineGlowAlpha > 0) {
            ctx.fillStyle = `rgba(255,255,0,${lineGlowAlpha})`;
            ctx.fillRect(40, judgeLineY, lanes.length * 60, 10);
            lineGlowAlpha -= 0.03;
        } else {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(40, judgeLineY, lanes.length * 60, 10);
        }

        // レーン描画
        lanes.forEach(lane => {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(lane.x, 0, lane.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText(lane.key, lane.x + 15, canvas.height - 100);
        });

        if (gameRunning) {
            // ノーツ更新と描画
            notes.forEach(note => note.update(deltaTime));
            notes.forEach(note => note.draw());

            // 判定済みで画面外のノーツを削除
            notes = notes.filter(note => !note.judged || note.y <= canvas.height + 100);

            // 判定エフェクト表示
            judgeEffects.forEach(effect => {
                ctx.fillStyle = `rgba(255, 255, 255, ${effect.alpha})`;
                ctx.font = '30px Arial';
                ctx.fillText(effect.text, effect.x, effect.y);
                effect.alpha -= 0.02;
            });
            judgeEffects = judgeEffects.filter(effect => effect.alpha > 0);

            // スコアとコンボ表示
            ctx.fillStyle = 'white';
            ctx.font = '25px Arial';
            ctx.fillText(`Score: ${score}`, 20, 40);
            ctx.fillText(`Combo: ${combo}`, 20, 70);

            // ゲーム終了判定（BGM終了）
            if (bgm.ended) {
                gameRunning = false;
                showResult();
            }
        }

        requestAnimationFrame(gameLoop);
    }

    // ====================
    // 初期化呼び出し
    // ====================
    init();
});
