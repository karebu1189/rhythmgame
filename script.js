// DOMContentLoaded イベント
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
    const missSound = document.getElementById('missSound');

    const retryButton = document.getElementById('retryButton');
    const backButton = document.getElementById('backButton');
    const backButtonResult = document.getElementById('backButtonResult');

    const songs = [
        { title: 'メデ', file: 'mede.mp3' },
        { title: '曲2', file: 'song2.mp3' }
    ];

    let selectedSong = songs[0];
    let lanes = [];
    const laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];
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

    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initializeLanes();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function refreshSongList() {
        songList.innerHTML = '';
        songs.forEach(song => {
            const songButton = document.createElement('div');
            songButton.className = 'songItem';
            songButton.innerText = song.title;
            if (song.title === selectedSong.title) {
                songButton.classList.add('selected');
            }
            songButton.onclick = () => {
                selectedSong = song;
                refreshSongList();
            };
            songList.appendChild(songButton);
        });
    }
    refreshSongList();

    startGameButton.onclick = () => {
        const difficulty = difficultySelector.value;
        noteSpeed = difficulties[difficulty].noteSpeed;
        noteSpawnRate = difficulties[difficulty].spawnRate;

        titleScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        startGame();
    };

    retryButton.onclick = () => {
        resultScreen.style.display = 'none';
        titleScreen.style.display = 'flex';
        score = 0;
        combo = 0;
        notes = [];
        judgeEffects = [];
    };

    backButton.onclick = () => {
        gameRunning = false;
        clearInterval(spawnInterval);
        bgm.pause();
        bgm.currentTime = 0;
        gameScreen.style.display = 'none';
        titleScreen.style.display = 'flex';
    };

    backButtonResult.onclick = () => {
        resultScreen.style.display = 'none';
        titleScreen.style.display = 'flex';
    };

    function initializeLanes() {
        lanes = [];
        let laneWidth = 60;
        let totalWidth = laneWidth * 8;
        let startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;

        for (let i = 0; i < 8; i++) {
            lanes.push(startX + i * laneWidth);
        }
    }

    function spawnNote() {
        let laneIndex = Math.floor(Math.random() * 8);
        notes.push(new Note(laneIndex));
    }

    class Note {
        constructor(laneIndex) {
            this.lane = laneIndex;
            this.x = lanes[laneIndex];
            this.y = -20;
            this.speed = noteSpeed;
            this.judged = false;
        }

        update() {
            this.y += this.speed;
            if (this.y > canvas.height + 20 && !this.judged) {
                this.miss();
                this.judged = true;
            }
        }

        draw() {
            ctx.fillStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, 2 * Math.PI);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00bfff';
            ctx.stroke();
        }

        miss() {
            combo = 0;
            missSound.play();
            judgeEffects.push(new JudgeEffect(this.x, this.y, 'MISS', 'red'));
        }
    }

    class JudgeEffect {
        constructor(x, y, text, color) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color;
            this.alpha = 1.0;
            this.duration = 60;
        }

        update() {
            this.y -= 1;
            this.alpha -= 1 / this.duration;
            if (this.alpha < 0) this.alpha = 0;
        }

        draw() {
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.font = '30px Arial Black';
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y);
            ctx.globalAlpha = 1.0;
        }
    }

    function startGame() {
        score = 0;
        combo = 0;
        notes = [];
        judgeEffects = [];
        initializeLanes();

        bgm.src = selectedSong.file;
        bgm.play();

        gameRunning = true;

        spawnInterval = setInterval(spawnNote, noteSpawnRate);

        requestAnimationFrame(gameLoop);
    }

    function endGame() {
        gameRunning = false;
        clearInterval(spawnInterval);
        bgm.pause();
        bgm.currentTime = 0;

        document.getElementById('finalScore').textContent = `スコア: ${score}`;
        document.getElementById('finalRank').textContent = `ランク: ${getRank(score)}`;

        gameScreen.style.display = 'none';
        resultScreen.style.display = 'flex';
    }

    function getRank(score) {
        if (score > 1500) return 'S';
        if (score > 1200) return 'A';
        if (score > 900) return 'B';
        if (score > 600) return 'C';
        return 'D';
    }

    function judgeNote(laneIndex) {
        for (let i = 0; i < notes.length; i++) {
            let note = notes[i];
            if (note.lane === laneIndex && !note.judged) {
                let distance = Math.abs(note.y - (canvas.height - 100));
                if (distance < 40) {
                    note.judged = true;
                    score += 100;
                    combo++;
                    perfectSound.play();
                    judgeEffects.push(new JudgeEffect(note.x, note.y, 'PERFECT', 'aqua'));
                    notes.splice(i, 1);
                    return;
                }
            }
        }
        combo = 0;
        missSound.play();
        judgeEffects.push(new JudgeEffect(lanes[laneIndex], canvas.height - 100, 'MISS', 'red'));
    }

    window.addEventListener('keydown', e => {
        let key = e.key.toUpperCase();
        let laneIndex = laneKeys.indexOf(key);
        if (laneIndex !== -1) {
            judgeNote(laneIndex);
            tapSound.play();
        }
    });

    function drawLanes() {
        ctx.strokeStyle = '#00bfff';
        ctx.lineWidth = 3;
        for (let i = 0; i < lanes.length; i++) {
            ctx.beginPath();
            ctx.moveTo(lanes[i], 0);
            ctx.lineTo(lanes[i], canvas.height);
            ctx.stroke();
        }

        ctx.lineWidth = 5;
        ctx.strokeStyle = '#00e0ff';
        ctx.beginPath();
        ctx.moveTo(lanes[0] - 30, canvas.height - 100);
        ctx.lineTo(lanes[lanes.length - 1] + 30, canvas.height - 100);
        ctx.stroke();
    }

    function drawScore() {
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText(`スコア: ${score}`, 20, 40);
        ctx.fillText(`コンボ: ${combo}`, 20, 80);
    }

    function gameLoop() {
        if (!gameRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawLanes();

        notes.forEach(note => {
            note.update();
            note.draw();
        });

        judgeEffects.forEach((effect, idx) => {
            effect.update();
            effect.draw();
        });

        judgeEffects = judgeEffects.filter(effect => effect.alpha > 0);

        drawScore();

        if (bgm.ended) {
            endGame();
            return;
        }

        requestAnimationFrame(gameLoop);
    }
});
