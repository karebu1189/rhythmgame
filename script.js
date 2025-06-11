document.addEventListener('DOMContentLoaded', () => {

    // DOM要素取得
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

    // ゲーム変数
    let selectedSong = { title: 'メデ', file: 'メデ.mp3' };
    let lanes = [];
    const laneKeys = ['D', 'F', 'G', 'J', 'K', 'L'];
    let notes = [];
    let effects = [];
    let judgeEffects = [];
    let score = 0;
    let combo = 0;
    let gameRunning = false;
    let spawnInterval;

    // 難易度設定
    const difficulties = {
        easy: { noteSpeed: 3, spawnRate: 800 },
        normal: { noteSpeed: 5, spawnRate: 600 },
        hard: { noteSpeed: 7, spawnRate: 400 }
    };

    let noteSpeed = difficulties.normal.noteSpeed;
    let noteSpawnRate = difficulties.normal.spawnRate;

    // 曲リスト
    const songs = [
        { title: 'メデ', file: 'メデ.mp3' },
        { title: '曲2', file: 'song2.mp3' },
        { title: '曲3', file: 'song3.mp3' }
    ];

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
    // 初期選択色をセット
    songList.children[0].style.color = 'yellow';

    // 画面サイズ設定・レーン初期化
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initializeLanes();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // レーン配置
    function initializeLanes() {
        lanes = [];
        const laneWidth = 60;
        const totalWidth = laneWidth * 6;
        const startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;
        for (let i = 0; i < 6; i++) {
            lanes.push(startX + i * laneWidth);
        }
    }

    // ゲーム開始処理
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

    // 描画処理
    function draw() {
        // 背景クリア
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 判定ライン
        ctx.fillStyle = 'cyan';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 5);

        // レーン描画
        ctx.strokeStyle = 'white';
        lanes.forEach(lane => {
            ctx.beginPath();
            ctx.moveTo(lane, 0);
            ctx.lineTo(lane, canvas.height);
            ctx.stroke();
        });

        // ノーツ描画と移動
        ctx.fillStyle = 'white';
        notes.forEach(note => {
            ctx.fillRect(note.x, note.y, 50, 50);
            note.y += noteSpeed;
        });

        // キー表示
        ctx.fillStyle = 'yellow';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        lanes.forEach((lane, index) => {
            ctx.fillText(laneKeys[index], lane, canvas.height - 20);
        });

        // 判定エフェクト描画
        judgeEffects.forEach((effect, index) => {
            ctx.fillStyle = effect.color;
            ctx.font = '30px Arial';
            ctx.fillText(effect.text, effect.x + 25, effect.y);
            effect.timer--;
            if (effect.timer <= 0) judgeEffects.splice(index, 1);
        });

        // 円形エフェクト描画
        effects.forEach((effect, index) => {
            ctx.strokeStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(effect.x + 25, effect.y + 25, 30 - effect.timer, 0, 2 * Math.PI);
            ctx.stroke();
            effect.timer--;
            if (effect.timer <= 0) effects.splice(index, 1);
        });

        // スコア・コンボ表示
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 20, 40);
        ctx.fillText('Combo: ' + combo, 20, 80);

        // 画面外のノーツ除去とミス判定
        for (let i = notes.length - 1; i >= 0; i--) {
            if (notes[i].y > canvas.height + 50) {
                notes.splice(i, 1);
                combo = 0;
                missSound.currentTime = 0;
                missSound.play();
                judgeEffects.push({ text: 'Miss', color: 'red', x: notes[i]?.x || 0, y: canvas.height - 120, timer: 30 });
            }
        }

        if (gameRunning) {
            requestAnimationFrame(draw);
        }
    }

    //
