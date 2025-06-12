// 完全統合版プロセカ風音ゲーコード

// HTML 側で必要な要素（例）:
// <div id="titleScreen">...</div>
// <div id="gameScreen">...</div>
// <div id="resultScreen">...</div>
// <select id="difficultySelector">...</select>
// <select id="laneSelector">...</select>
// <div id="songList"></div>
// <button id="startGameButton"></button>
// <audio id="bgm"></audio>
// (他の必要な要素は既存の構造を参照)

// JavaScript

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
        easy: { noteSpeed: 3 },
        normal: { noteSpeed: 5 },
        hard: { noteSpeed: 7 }
    };

    let noteSpeed = difficulties.normal.noteSpeed;
    let noteSpawnRate = 400;
    let LANE_COUNT = 8;

    const songs = [
        { title: 'メデ', file: 'メデ.mp3' },
        { title: 'トンデモワンダーズ', file: 'トンデモワンダーズ.mp3' },
        { title: 'テトリス', file: 'テトリス.mp3' },
        { title: 'マーシャル・マキシマイザー', file: 'マーシャル・マキシマイザー.mp3' },
        { title: 'ブリキノダンス', file: 'ブリキノダンス.mp3' },
        { title: 'シャルル', file: 'シャルル.mp3' },
        { title: 'グッバイ宣言', file: 'グッバイ宣言.mp3' },
        { title: 'ドラマツルギー', file: 'ドラマツルギー.mp3' },
        { title: 'KING', file: 'KING.mp3' },
        { title: 'ビターチョコデコレーション', file: 'ビターチョコデコレーション.mp3' },
        { title: 'ロウワー', file: 'ロウワー.mp3' },
        { title: '夜に駆ける', file: '夜に駆ける.mp3' },
        { title: 'マトリョシカ', file: 'マトリョシカ.mp3' },
        { title: '千本桜', file: '千本桜.mp3' },
        { title: 'ヒバナ', file: 'ヒバナ.mp3' },
        { title: '命に嫌われている', file: '命に嫌われている.mp3' },
        { title: 'エンヴィーベイビー', file: 'エンヴィーベイビー.mp3' },
        { title: 'ベノム', file: 'ベノム.mp3' },
        { title: '乙女解剖', file: '乙女解剖.mp3' },
        { title: 'ゴーストルール', file: 'ゴーストルール.mp3' }
    ];

    const songBPM = {
        'メデ': 140,
        'トンデモワンダーズ': 150,
        'テトリス': 120,
        'マーシャル・マキシマイザー': 160,
        'ブリキノダンス': 160,
        'シャルル': 145,
        'グッバイ宣言': 160,
        'ドラマツルギー': 150,
        'KING': 166,
        'ビターチョコデコレーション': 180,
        'ロウワー': 160,
        '夜に駆ける': 130,
        'マトリョシカ': 205,
        '千本桜': 150,
        'ヒバナ': 180,
        '命に嫌われている': 170,
        'エンヴィーベイビー': 130,
        'ベノム': 180,
        '乙女解剖': 130,
        'ゴーストルール': 210
    };

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

        LANE_COUNT = parseInt(laneSelector.value);
        resizeCanvasAndLanes();

        let bpm = songBPM[selectedSong.title] || 120;
        noteSpawnRate = (60000 / bpm) / 2;

        titleScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        startGame();
    };

    retryButton.onclick = () => location.reload();
    backButton.onclick = () => location.reload();
    backButtonResult.onclick = () => location.reload();

    const BASE_LANE_WIDTH = 60;
    let noteSize = 50;

    function resizeCanvasAndLanes() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

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

    window.addEventListener('resize', resizeCanvasAndLanes);
    resizeCanvasAndLanes();

    function startGame() {
        bgm.src = selectedSong.file;
        bgm.play();
        gameRunning = true;
        score = 0;
        combo = 0;
        notes = [];

        bgm.onended = endGame;

        spawnInterval = setInterval(() => {
            if (gameRunning) {
                let laneIndex = Math.floor(Math.random() * lanes.length);
                let lane = lanes[laneIndex];
                notes.push({ x: lane - noteSize / 2, y: 0, laneIndex: laneIndex });
            }
        }, noteSpawnRate);

        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'cyan';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 5);

        ctx.strokeStyle = 'white';
        lanes.forEach(lane => {
            ctx.beginPath();
            ctx.moveTo(lane, 0);
            ctx.lineTo(lane, canvas.height);
            ctx.stroke();
        });

        ctx.fillStyle = 'white';
        notes.forEach(note => {
            ctx.fillRect(note.x, note.y, noteSize, noteSize);
            note.y += noteSpeed;
        });

        ctx.fillStyle = 'yellow';
        ctx.font = `${noteSize * 0.5}px Arial`;
        lanes.forEach((lane, index) => {
            ctx.fillText(laneKeys[index], lane - noteSize / 4, canvas.height - 10);
        });

        judgeEffects.forEach((effect, index) => {
            ctx.fillStyle = effect.color;
            ctx.font = '30px Arial';
            ctx.fillText(effect.text, effect.x, effect.y);
            effect.timer--;
            if (effect.timer <= 0) judgeEffects.splice(index, 1);
        });

        effects.forEach((effect, index) => {
            ctx.strokeStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(effect.x + noteSize / 2, effect.y + noteSize / 2, 30 - effect.timer, 0, 2 * Math.PI);
            ctx.stroke();
            effect.timer--;
            if (effect.timer <= 0) effects.splice(index, 1);
        });

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

        const finalScoreElement = document.getElementById('finalScore');
        const finalRankElement = document.getElementById('finalRank');

        finalScoreElement.innerText = 'スコア: ' + score;

        const rank = getRank(score);
        finalRankElement.innerText = 'ランク: ' + rank;

        finalRankElement.className = '';
        if (rank === 'SS') finalRankElement.classList.add('rank-SS');
        else if (rank === 'S') finalRankElement.classList.add('rank-S');
        else if (rank === 'A') finalRankElement.classList.add('rank-A');
        else if (rank === 'B') finalRankElement.classList.add('rank-B');
        else finalRankElement.classList.add('rank-C');
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
        if (keyIndex !== -1 && keyIndex < LANE_COUNT) {
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
