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
    // 判定エフェクト
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
            this.y -= 0.5;
        }
        draw(ctx) {
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = getJudgeColor(this.text);
            ctx.font = '20px Arial Black';
            const lane = lanes[this.laneIndex];
            ctx.fillText(this.text, lane.x + 10, this.y);
            ctx.globalAlpha = 1;
        }
    }

    // 判定結果の色付け
    function getJudgeColor(judge) {
        switch (judge) {
            case 'PERFECT': return 'gold';
            case 'GREAT': return 'lime';
            case 'GOOD': return 'cyan';
            case 'MISS': return 'red';
            default: return 'white';
        }
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
    // 判定ラインの光演出
    // ====================
    function flashJudgeLine() {
        lineGlowAlpha = 1;
    }

    // ====================
    // 判定処理
    // ====================
    function judgeNote(laneIndex) {
        for (const note of notes) {
            if (note.laneIndex === laneIndex && !note.judged) {
                const diff = Math.abs(note.y - judgeLineY);
                if (diff < 10) {
                    note.judged = true;
                    note.hit = true;

                    if (diff < 5) {
                        score += 1000;
                        combo++;
                        perfectCount++;
                        playPerfectSound();
                        addJudgeEffect(laneIndex, 'PERFECT');
                    } else if (diff < 8) {
                        score += 700;
                        combo++;
                        greatCount++;
                        playGreatSound();
                        addJudgeEffect(laneIndex, 'GREAT');
                    } else {
                        score += 400;
                        combo++;
                        goodCount++;
                        playGoodSound();
                        addJudgeEffect(laneIndex, 'GOOD');
                    }

                    maxCombo = Math.max(maxCombo, combo);
                    return;
                }
            }
        }
        // 判定できなかった場合MISS扱い
        combo = 0;
        missCount++;
        addJudgeEffect(laneIndex, 'MISS');
        playMissSound();
    }

    // ====================
    // 判定エフェクト追加
    // ====================
    function addJudgeEffect(laneIndex, text) {
        judgeEffects.push(new JudgeEffect(laneIndex, text));
    }

    // ====================
    // ノーツ生成（サンプル簡易自動生成）
    // ====================
    function generateNotes() {
        notes = [];
        // ノーツ間隔＝BPM基準でノーツ生成
        // 例としてBPMに応じて約4分音符ごとにノーツ配置
        const interval = 60000 / selectedSong.bpm;
        const noteCount = 100;
        for (let i = 0; i < noteCount; i++) {
            const laneIndex = Math.floor(Math.random() * lanes.length);
            notes.push(new Note(laneIndex, i * interval));
        }
    }

    // ====================
    // ゲーム開始
    // ====================
    function startGame() {
        score = 0;
        combo = 0;
        maxCombo = 0;
        perfectCount = 0;
        greatCount = 0;
        goodCount = 0;
        missCount = 0;
        judgeEffects = [];
        notes = [];
        gameRunning = true;

        generateNotes();

        bgm.currentTime = 0;
        bgm.play();
        bgVideo.currentTime = 0;
        bgVideo.play();

        showScreen('gameScreen');
    }

    // ====================
    // ゲーム停止
    // ====================
    function stopGame() {
        gameRunning = false;
        bgm.pause();
        bgVideo.pause();
    }

    // ====================
    // タッチ判定
    // ====================
    function handleTouch(x, y) {
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
    // メインループ
    // ====================
    let lastTime = 0;
    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 背景描画
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 判定ライン位置
        judgeLineY = canvas.height - 100;

        // 判定ライン光演出
        if (lineGlowAlpha > 0) {
            ctx.fillStyle = `rgba(255,255,0,${lineGlowAlpha})`;
            ctx.fillRect(0, judgeLineY, canvas.width, 5);
            lineGlowAlpha -= 0.05;
        } else {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, judgeLineY, canvas.width, 5);
        }

        // レーン描画
        lanes.forEach(lane => {
            ctx.fillStyle = 'gray';
            ctx.fillRect(lane.x, 0, lane.width, canvas.height);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(lane.x, 0, lane.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText(lane.key, lane.x + 15, canvas.height - 50);
        });

        // ノーツ更新描画
        if (gameRunning) {
            notes.forEach(note => {
                if (!note.judged) note.update(deltaTime);
                note.draw(ctx);
            });
        }

        // 判定エフェクト更新描画
        judgeEffects.forEach((effect, idx) => {
            effect.update(deltaTime);
            effect.draw(ctx);
            if (effect.alpha <= 0) {
                judgeEffects.splice(idx, 1);
            }
        });

        // スコアとコンボ表示
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial Black';
        ctx.fillText(`Score: ${score}`, 10, 30);
        ctx.fillText(`Combo: ${combo}`, 10, 60);
        ctx.fillText(`Max Combo: ${maxCombo}`, 10, 90);

        // 曲終了判定
        if (gameRunning && bgm.ended) {
            stopGame();
            showResult();
        }

        requestAnimationFrame(gameLoop);
    }

    // ====================
    // 結果表示
    // ====================
    function showResult() {
        finalScoreDisplay.textContent = score;
        maxComboDisplay.textContent = maxCombo;
        perfectCountDisplay.textContent = perfectCount;
        greatCountDisplay.textContent = greatCount;
        goodCountDisplay.textContent = goodCount;
        missCountDisplay.textContent = missCount;

        // ランク計算（例）
        const accuracy = (perfectCount * 1 + greatCount * 0.8 + goodCount * 0.5) / (perfectCount + greatCount + goodCount + missCount);
        if (accuracy > 0.9) {
            rankDisplay.textContent = 'S';
        } else if (accuracy > 0.8) {
            rankDisplay.textContent = 'A';
        } else if (accuracy > 0.7) {
            rankDisplay.textContent = 'B';
        } else if (accuracy > 0.6) {
            rankDisplay.textContent = 'C';
        } else {
            rankDisplay.textContent = 'D';
        }

        showScreen('resultScreen');
    }

    // ====================
    // キャンバスリサイズ
    // ====================
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight * 0.7;
    }

    // 初期化呼び出し
    init();
});
