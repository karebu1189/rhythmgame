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
    let laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];
    let notes = [];
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

    const songs = [
        { title: 'メデ', file: 'メデ.mp3' },
        { title: '曲2', file: 'df327b38-4181-4d81-b13f-a4490a28cbf1.mp3' }
    ];

    // パーティクル用配列
    let particles = [];

    // Canvasサイズ調整関数
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initializeLanes();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 曲リスト表示
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

    function initializeLanes() {
        lanes = [];
        let laneWidth = 60;
        let totalWidth = laneWidth * 8;
        let startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;

        for (let i = 0; i < 8; i++) {
            lanes.push(startX + i * laneWidth);
        }
    }

    // パーティクル初期化・生成
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.1,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            color: `rgba(0, 200, 255, ${Math.random() * 0.5 + 0.3})`
        };
    }

    function initParticles(count = 100) {
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(createParticle());
        }
    }
    initParticles();

    function updateParticles() {
        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0) p.x = canvas.width;
            else if (p.x > canvas.width) p.x = 0;

            if (p.y < 0) p.y = canvas.height;
            else if (p.y > canvas.height) p.y = 0;
        });
    }

    function drawParticles() {
        particles.forEach(p => {
            ctx.beginPath();
            let gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
            gradient.addColorStop(0, p.color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.arc(p.x, p.y, p.radius * 3, 0, 2 * Math.PI);
            ctx.fill();
        });
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
        judgeEffects.length = 0;

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

        requestAnimationFrame(draw);
    }

    // 描画関数（ゲームループ）
    function draw() {
        // まず背景クリア＆描画（黒＋パーティクル）
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawParticles();
        updateParticles();

        // 判定ライン
        ctx.fillStyle = 'cyan';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 5);

        // レーン縦線
        ctx.strokeStyle = 'white';
        lanes.forEach(lane => {
            ctx.beginPath();
            ctx.moveTo(lane, 0);
            ctx.lineTo(lane, canvas.height);
            ctx.stroke();
        });

        // ノーツ描画＆移動
        ctx.fillStyle = 'white';
        notes.forEach(note => {
            ctx.fillRect(note.x, note.y, 50, 50);
            note.y += noteSpeed;
        });

        // レーンキー表示
        ctx.fillStyle = 'yellow';
        lanes.forEach((lane, index) => {
            ctx.font = '20px Arial';
            ctx.fillText(laneKeys[index], lane - 5, canvas.height - 10);
        });

        // 判定エフェクト表示
        judgeEffects.forEach((effect, index) => {
            ctx.fillStyle = effect.color;
            ctx.font = '30px Arial';
            ctx.fillText(effect.text, effect.x, effect.y);
            effect.timer--;
            if (effect.timer <= 0) judgeEffects.splice(index, 1);
        });

        // スコア・コンボ表示
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Score: ' + score, 20, 40);
        ctx.fillText('Combo: ' + combo, 20, 80);

        // 画面外のノーツは削除
        notes = notes.filter(note => note.y <= canvas.height + 50);

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
        else if (diff <= 80) return { text: 'Great', color: 'lime', sound: greatSound };
        else if (diff <= 120) return { text: 'Good', color: 'orange', sound: goodSound };
        else return { text: 'Miss', color: 'red', sound: missSound };
    }

    window.addEventListener('keydown', (e) => {
        if (!gameRunning) return;

        let keyIndex = laneKeys.indexOf(e.key.toUpperCase());
        if (keyIndex === -1) return;

        // 一番近いノーツで判定
        let hitNoteIndex = -1;
        let bestDiff = Infinity;

        for (let i = 0; i < notes.length; i++) {
            if (notes[i].laneIndex === keyIndex) {
                let diff = Math.abs(notes[i].y - (canvas.height - 100));
                if (diff < bestDiff) {
                    bestDiff = diff;
                    hitNoteIndex = i;
                }
            }
        }

        if (hitNoteIndex !== -1) {
            const judge = getJudge(notes[hitNoteIndex].y);
            judgeEffects.push({
                text: judge.text,
                color: judge.color,
                x: lanes[keyIndex] - 20,
                y: canvas.height - 120,
                timer: 30
            });

            judge.sound.currentTime = 0;
            judge.sound.play();

            if (judge.text === 'Miss') {
                combo = 0;
            } else {
                combo++;
                score += (judge.text === 'Perfect' ? 3000 : judge.text === 'Great' ? 1500 : 500);
            }

            notes.splice(hitNoteIndex, 1);
        } else {
            combo = 0;
        }

        tapSound.currentTime = 0;
        tapSound.play();
    });
});
