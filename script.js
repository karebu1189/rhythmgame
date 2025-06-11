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
    const gameBackButton = document.getElementById('gameBackButton');
    const resultBackButton = document.getElementById('resultBackButton');

    // レーンキー8個に拡張
    const laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];

    let lanes = [];
    let notes = [];
    let judgeEffects = [];
    let effects = [];

    let score = 0;
    let combo = 0;
    let gameRunning = false;
    let spawnInterval;

    // 難易度設定（速度・ノーツ生成間隔）
    const difficulties = {
        easy: { noteSpeed: 3, spawnRate: 900 },
        normal: { noteSpeed: 5, spawnRate: 600 },
        hard: { noteSpeed: 7, spawnRate: 400 }
    };

    let noteSpeed = difficulties.normal.noteSpeed;
    let noteSpawnRate = difficulties.normal.spawnRate;

    // 曲リスト（秒数追加）
    const songs = [
        { title: 'メデ', file: 'メデ.mp3', length: 60 },
        { title: '曲2', file: 'song2.mp3', length: 75 },
        { title: '曲3', file: 'song3.mp3', length: 90 }
    ];

    let selectedSong = songs[0];

    // 曲リスト表示
    songs.forEach((song, idx) => {
        const songButton = document.createElement('div');
        songButton.className = 'songItem';
        songButton.innerText = song.title;
        songButton.style.color = 'white';
        songButton.onclick = () => {
            selectedSong = song;
            Array.from(songList.children).forEach(child => child.style.color = 'white');
            songButton.style.color = 'yellow';
        };
        songList.appendChild(songButton);
    });
    songList.children[0].style.color = 'yellow';

    // 画面サイズ調整・レーン初期化
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initializeLanes();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 8レーンのx座標計算
    function initializeLanes() {
        lanes = [];
        const laneWidth = 50;
        const totalWidth = laneWidth * laneKeys.length;
        const startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;
        for (let i = 0; i < laneKeys.length; i++) {
            lanes.push(startX + i * laneWidth);
        }
    }

    // ゲーム開始
    function startGame() {
        initializeLanes();

        bgm.src = selectedSong.file;
        bgm.play();

        gameRunning = true;
        score = 0;
        combo = 0;
        notes = [];
        judgeEffects = [];
        effects = [];

        // 譜面自動生成の終了時間を決める
        const endTime = Date.now() + selectedSong.length * 1000;

        // ノーツ自動生成タイマー
        spawnInterval = setInterval(() => {
            if (!gameRunning) return;

            if (Date.now() > endTime) {
                // 譜面終了したら終了処理
                endGame();
                return;
            }

            // ランダムなレーンでノーツ追加
            let laneIndex = Math.floor(Math.random() * lanes.length);

            // 簡易的に難易度で出現頻度やノーツ速度を調整（spawnRateとnoteSpeedはdifficultyにより変化）

            notes.push({ x: lanes[laneIndex] - 25, y: 0, laneIndex: laneIndex });
        }, noteSpawnRate);

        bgm.onended = () => {
            endGame();
        };

        draw();
    }

    // 描画処理
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 背景
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 判定ライン
        ctx.fillStyle = 'cyan';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 5);

        // レーン線
        ctx.strokeStyle = 'white';
        lanes.forEach(x => {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        });

        // ノーツ描画
        ctx.fillStyle = 'white';
        notes.forEach(note => {
            ctx.fillRect(note.x, note.y, 50, 50);
            note.y += noteSpeed;
        });

        // キー文字表示
        ctx.fillStyle = 'yellow';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        lanes.forEach((x, i) => {
            ctx.fillText(laneKeys[i], x, canvas.height - 20);
        });

        // 判定エフェクト表示
        judgeEffects.forEach((effect, i) => {
            ctx.fillStyle = effect.color;
            ctx.font = '32px Arial';
            ctx.fillText(effect.text, effect.x + 25, effect.y);
            effect.timer--;
            if (effect.timer <= 0) judgeEffects.splice(i, 1);
        });

        // 円形エフェクト
        effects.forEach((effect, i) => {
            ctx.strokeStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(effect.x + 25, effect.y + 25, 30 - effect.timer, 0, Math.PI * 2);
            ctx.stroke();
            effect.timer--;
            if (effect.timer <= 0) effects.splice(i, 1);
        });

        // スコア・コンボ
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 20, 40);
        ctx.fillText('Combo: ' + combo, 20, 80);

        // ノーツが画面外へ行ったらMiss扱い
        for (let i = notes.length - 1; i >= 0; i--) {
            if (notes[i].y > canvas.height + 50) {
                notes.splice(i, 1);
                combo = 0;
                missSound.currentTime = 0;
                missSound.play();
                judgeEffects.push({ text: 'Miss', color: 'red', x: lanes[0], y: canvas.height - 120, timer: 30 });
            }
        }

        if (gameRunning) {
            requestAnimationFrame(draw);
        }
    }

    // 判定処理（判定範囲を大きく）
    function judge(key) {
        if (!gameRunning) return;

        const laneIndex = laneKeys.indexOf(key.toUpperCase());
        if (laneIndex === -1) return;

        // 判定ライン近くのノーツを検索
        for (let i = 0; i < notes.length; i++) {
            let note = notes[i];
            if (note.laneIndex === laneIndex) {
                let dist = Math.abs(note.y + 25 - (canvas.height - 100));
                // 判定範囲拡大: 60→90に
                if (dist < 90) {
                    if (dist < 30) {
                        score += 1000;
                        combo++;
                        perfectSound.currentTime = 0;
                        perfectSound.play();
                        judgeEffects.push({ text: 'Perfect', color: 'lime', x: note.x, y: canvas.height - 120, timer: 30 });
                    } else if (dist < 60) {
                        score += 600;
                        combo++;
                        greatSound.currentTime = 0;
                        greatSound.play();
                        judgeEffects.push({ text: 'Great', color: 'aqua', x: note.x, y: canvas.height - 120, timer: 30 });
                    } else {
                        score += 300;
                        combo++;
                        goodSound.currentTime = 0;
                        goodSound.play();
                        judgeEffects.push({ text: 'Good', color: 'yellow', x: note.x, y: canvas.height - 120, timer: 30 });
                    }
                    effects.push({ x: note.x, y: note.y, timer: 30 });
                    notes.splice(i, 1);
                    tapSound.currentTime = 0;
                    tapSound.play();
                    return;
                }
            }
        }

        // 判定なしはMiss
        combo = 0;
        missSound.currentTime = 0;
        missSound.play();
        judgeEffects.push({ text: 'Miss', color: 'red', x: lanes[laneIndex], y: canvas.height - 120, timer: 30 });
    }

    // ゲーム終了処理
    function endGame() {
        gameRunning = false;
        clearInterval(spawnInterval);
        bgm.pause();

        titleScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'flex';

        document.getElementById('finalScore').innerText = `スコア: ${score}`;
        let rank;
        if (score >= 90000) rank = 'S';
        else if (score >= 70000) rank = 'A';
        else if (score >= 50000) rank = 'B';
        else if (score >= 30000) rank = 'C';
        else rank = 'D';
        document.getElementById('finalRank').innerText = `ランク: ${rank}`;
    }

    // イベント登録
    startGameButton.onclick = () => {
        noteSpeed = difficulties[difficultySelector.value].noteSpeed;
        noteSpawnRate = difficulties[difficultySelector.value].spawnRate;

        titleScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        resultScreen.style.display = 'none';

        startGame();
    };

    retryButton.onclick = () => {
        location.reload();
    };

    gameBackButton.onclick = () => {
        location.reload();
    };

    resultBackButton.onclick = () => {
        location.reload();
    };

    // キーボード判定
    window.addEventListener('keydown', e => {
        if (!gameRunning) return;
        judge(e.key);
    });
});
