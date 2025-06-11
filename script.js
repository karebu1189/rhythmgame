// 完全プロセカ風 判定強化版

document.addEventListener('DOMContentLoaded', () => {
    // 画面要素
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

    // 曲データ
    const songs = [
        { title: 'メデ', file: 'メデ.mp3' },
        { title: '曲2', file: 'song2.mp3' },
        { title: '曲3', file: 'song3.mp3' }
    ];

    let selectedSong = songs[0];

    // ゲームデータ
    let lanes = [];
    let laneKeys = ['D', 'F', 'G', 'J', 'K', 'L'];
    let notes = [];
    let effects = [];
    let judgeEffects = [];
    let score = 0;
    let combo = 0;
    let gameRunning = false;
    let spawnInterval;

    const difficulties = {
        easy: { noteSpeed: 3, spawnRate: 800 },
        normal: { noteSpeed: 5, spawnRate: 600 },
        hard: { noteSpeed: 7, spawnRate: 400 }
    };

    let noteSpeed = difficulties.normal.noteSpeed;
    let noteSpawnRate = difficulties.normal.spawnRate;

    let judgeLineFlashTimer = 0;
    let judgeLineFlashColor = 'transparent';

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
        gameScreen.style.display = 'block';
        startGame();
    };

    retryButton.onclick = () => {
        clearInterval(spawnInterval);
        location.reload();
    };

    backButton.onclick = () => {
        location.reload();
    };

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function initializeLanes() {
        lanes = [];
        let laneWidth = 60;
        let totalWidth = laneWidth * 6;
        let startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;

        for (let i = 0; i < 6; i++) {
            lanes.push(startX + i * laneWidth);
        }
    }

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
                notes.push({ x: lane - 25, y: 0, laneIndex: laneIndex });
            }
        }, noteSpawnRate);

        draw();
    }

    function draw() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 判定ライン（光る演出）
        if (judgeLineFlashTimer > 0) {
            ctx.fillStyle = judgeLineFlashColor;
            judgeLineFlashTimer--;
        } else {
            ctx.fillStyle = 'cyan';
        }
        ctx.fillRect(0, canvas.height - 100, canvas.width, 10);

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
        lanes.forEach((lane, index) => {
            ctx.fillText(laneKeys[index], lane - 5, canvas.height - 10);
        });

        // 判定エフェクト
        judgeEffects.forEach((effect, index) => {
            ctx.fillStyle = effect.color;
            ctx.font = '30px Arial';
            ctx.fillText(effect.text, effect.x, effect.y);
            effect.timer--;
            if (effect.timer <= 0) judgeEffects.splice(index, 1);
        });

        // ノーツエフェクト
        effects.forEach((effect, index) => {
            ctx.strokeStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(effect.x + 25, effect.y + 25, 30 - effect.timer, 0, 2 * Math.PI);
            ctx.stroke();
            effect.timer--;
            if (effect.timer <= 0) effects.splice(index, 1);
        });

        // スコアとコンボ表示
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Score: ' + score, 20, 40);
        ctx.fillText('Combo: ' + combo, 20, 80);

        notes = notes.filter(note => note.y <= canvas.height + 50);

        if (gameRunning) {
            requestAnimationFrame(draw);
        }
    }

    function endGame() {
        gameRunning = false;
        clearInterval(spawnInterval);
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'block';

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

        if (diff <= 15) return { text: 'Perfect', color: 'gold', sound: perfectSound };
        else if (diff <= 40) return { text: 'Great', color: 'deepskyblue', sound: greatSound };
        else if (diff <= 75) return { text: 'Good', color: 'lime', sound: goodSound };
        else return { text: 'Miss', color: 'red', sound: missSound };
    }

    function handleHit(note, index) {
        let judge = getJudge(note.y);
        notes.splice(index, 1);

        switch (judge.text) {
            case 'Perfect':
                score += 300;
                combo++;
                break;
            case 'Great':
                score += 200;
                combo++;
                break;
            case 'Good':
                score += 100;
                combo++;
                break;
            case 'Miss':
                combo = 0;
                break;
        }

        judge.sound.currentTime = 0;
        judge.sound.play();

        judgeEffects.push({ text: judge.text, color: judge.color, x: note.x, y: note.y, timer: 30 });
        effects.push({ x: note.x, y: note.y, timer: 15 });

        flashJudgeLine(judge.color);
    }

    function flashJudgeLine(color) {
        judgeLineFlashTimer = 10;
        judgeLineFlashColor = color;
    }

    canvas.addEventListener('click', function (event) {
        if (!gameRunning) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        for (let i = 0; i < notes.length; i++) {
            let note = notes[i];
            if (clickX >= note.x && clickX <= note.x + 50 && clickY >= note.y && clickY <= note.y + 50) {
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
                if (note.laneIndex === keyIndex && note.y >= canvas.height - 120 && note.y <= canvas.height - 20) {
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
            if (touchX >= note.x && touchX <= note.x + 50 && touchY >= note.y && touchY <= note.y + 50) {
                handleHit(note, i);
                break;
            }
        }
    });
});
