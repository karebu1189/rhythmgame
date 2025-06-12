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
    const backButton = document.getElementById('backButton');
    const backButtonResult = document.getElementById('backButtonResult');

    let selectedSong = { title: 'メデ', file: 'メデ.mp3' };

    let lanes = [];
    const laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];
    let notes = [];
    let effects = [];
    let judgeEffects = [];
    let score = 0;
    let combo = 0;
    let gameRunning = false;
    let spawnInterval;

    const difficulties = {
        easy: { noteSpeed: 3, spawnRate: 500 },
        normal: { noteSpeed: 5, spawnRate: 400 },
        hard: { noteSpeed: 7, spawnRate: 300 }
    };

    let noteSpeed = difficulties.normal.noteSpeed;
    let noteSpawnRate = difficulties.normal.spawnRate;

    const songs = [
        { title: 'メデ', file: 'メデ.mp3' },
        { title: 'トンデモワンダーズ', file: 'トンデモワンダーズ.mp3' }
    ];

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

    startGameButton.onclick = () => {
        const difficulty = difficultySelector.value;
        noteSpeed = difficulties[difficulty].noteSpeed;
        noteSpawnRate = difficulties[difficulty].spawnRate;

        titleScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        startGame();
    };

    retryButton.onclick = () => location.reload();
    backButton.onclick = () => location.reload();
    backButtonResult.onclick = () => location.reload();

    // 基準サイズ
    const BASE_LANE_WIDTH = 60;
    const BASE_NOTE_SIZE = 50;
    const LANE_COUNT = 8;

    // 可変ノーツサイズ
    let noteSize = BASE_NOTE_SIZE;

    function resizeCanvasAndLanes() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // レーン幅は画面幅の80%以内に収める
        const maxTotalWidth = canvas.width * 0.8;
        let laneWidth = Math.min(BASE_LANE_WIDTH, maxTotalWidth / LANE_COUNT);

        const totalWidth = laneWidth * LANE_COUNT;
        const startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;

        lanes = [];
        for (let i = 0; i < LANE_COUNT; i++) {
            lanes.push(startX + i * laneWidth);
        }

        noteSize = laneWidth * 0.8;
    }

    window.addEventListener('resize', () => {
        resizeCanvasAndLanes();
    });

    resizeCanvasAndLanes();

    function startGame() {
        initializeLanes();
        bgm.src = selectedSong.file;
        bgm.play();
        gameRunning = true;
        score = 0;
        combo = 0;
        notes = [];

        bgm.onended = () => {
            endGame();
        };

        spawnInterval = setInterval(() => {
            if (gameRunning) {
                let laneIndex = Math.floor(Math.random() * lanes.length);
                let lane = lanes[laneIndex];
                notes.push({ x: lane - noteSize / 2, y: 0, laneIndex: laneIndex });
            }
        }, noteSpawnRate);

        draw();
    }

    // initializeLanesはレーン位置初期化だが、resizeで代用できるので中身は空でもOK
    function initializeLanes() {
        // 今はresizeCanvasAndLanesで処理済み
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 判定ライン
        ctx.fillStyle = 'cyan';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 5);

        // レーン線
        ctx.strokeStyle = 'white';
        lanes.forEach(lane => {
            ctx.beginPath();
            ctx.moveTo(lane, 0);
            ctx.lineTo(lane, canvas.height);
            ctx.stroke();
        });

        // ノーツ
        ctx.fillStyle = 'white';
        notes.forEach(note => {
            ctx.fillRect(note.x, note.y, noteSize, noteSize);
            note.y += noteSpeed;
        });

        // キー表示
        ctx.fillStyle = 'yellow';
        ctx.font = `${noteSize * 0.5}px Arial`;
        lanes.forEach((lane, index) => {
            ctx.fillText(laneKeys[index], lane - noteSize / 4, canvas.height - 10);
        });

        // 判定エフェクト表示
        judgeEffects.forEach((effect, index) => {
            ctx.fillStyle = effect.color;
            ctx.font = '30px Arial';
            ctx.fillText(effect.text, effect.x, effect.y);
            effect.timer--;
            if (effect.timer <= 0) judgeEffects.splice(index, 1);
        });

        // 円形エフェクト
        effects.forEach((effect, index) => {
            ctx.strokeStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(effect.x + noteSize / 2, effect.y + noteSize / 2, 30 - effect.timer, 0, 2 * Math.PI);
            ctx.stroke();
            effect.timer--;
            if (effect.timer <= 0) effects.splice(index, 1);
        });

        // スコア・コンボ表示
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Score: ' + score, 20, 40);
        ctx.fillText('Combo: ' + combo, 20, 80);

        notes = notes.filter(note => note.y <= canvas.height + noteSize);

        if (gameRunning) {
            requestAnimationFrame(draw);
        }
    }

    function endGame() {
        gameRunning = false;
        clearInterval(spawnInterval);
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'flex';

        document.getElementById('finalScore').innerText = 'スコア: ' + score;
        document.getElementById('finalRank').innerText = 'ランク: ' + getRank(score);
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

        if (diff <= 40) return { text: 'Perfect', color: 'gold', sound: perfectSound };
        else if (diff <= 80) return { text: 'Great', color: 'blue', sound: greatSound };
        else if (diff <= 120) return { text: 'Good', color: 'green', sound: goodSound };
        else return { text: 'Miss', color: 'red', sound: missSound };
    }

    function handleHit(note, index) {
        let judge = getJudge(note.y);
        notes.splice(index, 1);

        if (judge.text !== 'Miss') {
            score += 100;
            combo++;
            tapSound.currentTime = 0;
            tapSound.play();
        } else {
            combo = 0;
        }

        judge.sound.currentTime = 0;
        judge.sound.play();

        judgeEffects.push({ text: judge.text, color: judge.color, x: note.x, y: note.y, timer: 30 });
        effects.push({ x: note.x, y: note.y, timer: 15 });
    }

    canvas.addEventListener('click', function (event) {
        if (!gameRunning) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        for (let i = 0; i < notes.length; i++) {
            let note = notes[i];
            if (clickX >= note.x && clickX <= note.x + noteSize && clickY >= note.y && clickY <= note.y + noteSize) {
                handleHit(note, i);
                break;
            }
        }
    });

    window.addEventListener('keydown', function (event) {
        if (!gameRunning) return;

        const keyIndex = laneKeys.indexOf(event.key.toUpperCase());
        if (keyIndex !== -1) {
            for (let i = 0; i < notes.length; i++) {
                let note = notes[i];
                if (note.laneIndex === keyIndex && note.y >= canvas.height - 150 && note.y <= canvas.height - 20) {
                    handleHit(note, i);
                    break;
                }
            }
        }
    });

    canvas.addEventListener('touchstart', function (event) {
        if (!gameRunning) return;

        const rect = canvas.getBoundingClientRect();
        const touchX = event.touches[0].clientX - rect.left;
        const touchY = event.touches[0].clientY - rect.top;

        for (let i = 0; i < notes.length; i++) {
            let note = notes[i];
            if (touchX >= note.x && touchX <= note.x + noteSize && touchY >= note.y && touchY <= note.y + noteSize) {
                handleHit(note, i);
                break;
            }
        }
    });
});
