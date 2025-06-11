document.addEventListener('DOMContentLoaded', () => {

    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultScreen = document.getElementById('resultScreen');

    const songList = document.getElementById('songList');
    const difficultySelector = document.getElementById('difficultySelector');
    const laneSelector = document.getElementById('laneSelector');
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
    const backButton = document.getElementById('backButton');

    const songs = [
        { title: 'メデ', file: 'メデ.mp3' },
        { title: '曲2', file: 'song2.mp3' },
        { title: '曲3', file: 'song3.mp3' }
    ];

    let selectedSong = songs[0];

    let lanes = [];
    const laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];
    let notes = [];
    let effects = [];
    let judgeEffects = [];
    let score = 0;
    let combo = 0;
    let gameRunning = false;
    let spawnInterval;
    let animationId;

    const difficulties = {
        easy: { noteSpeed: 3, spawnRate: 800 },
        normal: { noteSpeed: 5, spawnRate: 600 },
        hard: { noteSpeed: 7, spawnRate: 400 }
    };

    let noteSpeed = difficulties.normal.noteSpeed;
    let noteSpawnRate = difficulties.normal.spawnRate;
    let laneCount = 6;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initializeLanes();
    }
    window.addEventListener('resize', resizeCanvas);

    function initializeLanes() {
        lanes = [];
        let laneWidth = 60;
        let totalWidth = laneWidth * laneCount;
        let startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;

        for (let i = 0; i < laneCount; i++) {
            lanes.push(startX + i * laneWidth);
        }
    }

    songs.forEach(song => {
        const songButton = document.createElement('div');
        songButton.className = 'songItem';
        songButton.innerText = song.title;
        songButton.onclick = () => {
            selectedSong = song;
            Array.from(songList.children).forEach(child => child.style.color = 'white');
            songButton.style.color = 'yellow';
        };
        songList.appendChild(songButton);
    });

    function startGame() {
        score = 0;
        combo = 0;
        notes = [];
        effects = [];
        judgeEffects = [];

        gameRunning = true;
        noteSpeed = difficulties[difficultySelector.value].noteSpeed;
        noteSpawnRate = difficulties[difficultySelector.value].spawnRate;
        laneCount = parseInt(laneSelector.value);

        resizeCanvas();

        titleScreen.style.display = 'none';
        resultScreen.style.display = 'none';
        gameScreen.style.display = 'block';

        bgm.src = selectedSong.file;

        // 音声再生はユーザーアクションが必要な場合あるので、play()の後にcatchで対処
        bgm.play().catch(() => {
            // iOS等で再生できなかった場合、ユーザーの次の操作で再生開始
            document.body.addEventListener('touchstart', function playOnTouch() {
                bgm.play();
                document.body.removeEventListener('touchstart', playOnTouch);
            });
        });

        bgm.onended = () => {
            endGame();
        };

        spawnInterval = setInterval(() => {
            if (!gameRunning) return;
            const laneIndex = Math.floor(Math.random() * laneCount);
            const lane = lanes[laneIndex];
            notes.push({ x: lane - 25, y: 0, laneIndex: laneIndex });
        }, noteSpawnRate);

        if(animationId) cancelAnimationFrame(animationId);
        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 判定ライン
        ctx.fillStyle = 'cyan';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 5);

        // レーン表示
        ctx.strokeStyle = 'white';
        lanes.forEach(lane => {
            ctx.beginPath();
            ctx.moveTo(lane, 0);
            ctx.lineTo(lane, canvas.height);
            ctx.stroke();
        });

        // ノーツ表示
        ctx.fillStyle = 'white';
        notes.forEach(note => {
            ctx.fillRect(note.x, note.y, 50, 50);
            note.y += noteSpeed;
        });

        // キー表示
        ctx.fillStyle = 'yellow';
        ctx.font = '24px Arial';
        lanes.forEach((lane, index) => {
            if(index < laneCount){
                ctx.fillText(laneKeys[index], lane - 5, canvas.height - 10);
            }
        });

        // 判定エフェクト
        judgeEffects.forEach((effect, index) => {
            ctx.fillStyle = effect.color;
            ctx.font = '30px Arial';
            ctx.fillText(effect.text, effect.x, effect.y);
            effect.timer--;
            if(effect.timer <= 0) judgeEffects.splice(index, 1);
        });

        // ノーツエフェクト
        effects.forEach((effect, index) => {
            ctx.strokeStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(effect.x + 25, effect.y + 25, 30 - effect.timer, 0, 2 * Math.PI);
            ctx.stroke();
            effect.timer--;
            if(effect.timer <= 0) effects.splice(index, 1);
        });

        // スコアとコンボ表示
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Score: ' + score, 20, 40);
        ctx.fillText('Combo: ' + combo, 20, 80);

        // ノーツ画面外の削除
        notes = notes.filter(note => note.y <= canvas.height + 50);

        if (gameRunning) {
            animationId = requestAnimationFrame(draw);
        }
    }

    function endGame() {
        gameRunning = false;
        clearInterval(spawnInterval);
        if(animationId) cancelAnimationFrame(animationId);

        gameScreen.style.display = 'none';
        resultScreen.style.display = 'block';

        document.getElementById('finalScore').innerText = 'スコア: ' + score;
        document.getElementById('finalRank').innerText = 'ランク: ' + getRank(score);

        bgm.pause();
        bgm.currentTime = 0;
    }

    function getRank(score) {
        if (score >= 30000) return 'SS';
        else if (score >= 20000) return 'S';
        else if (score >= 15000) return 'A';
        else if (score >= 10000) return 'B';
        else return 'C';
    }

    function getJudge(noteY) {
        let hitLine = canvas.height - 100;
        let diff = Math.abs(noteY - hitLine);

        if (diff <= 22.5) return { text: 'Perfect', color: 'gold', sound: perfectSound };
        else if (diff <= 50) return { text: 'Great', color: 'blue', sound: greatSound };
        else if (diff <= 80) return { text: 'Good', color: 'green', sound: goodSound };
        else return { text: 'Miss', color: 'red', sound: missSound };
    }

    function handleHit(note, index) {
        let judge = getJudge(note.y);
        notes.splice(index, 1);
        if (judge.text !== 'Miss') {
         <canvas id="gameCanvas" style="background:#222;"></canvas>
<button id="startButton">スタート</button>
  
