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

    const laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];

    // ====================
    // ゲームデータ
    // ====================
    let selectedSong = null;
    let lanes = [];
    let notes = [];
    let judgeEffects = [];
    let tapEffects = [];

    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let noteSpeed = 5;
    let gameRunning = false;
    let spawnIntervalId = null;

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
        // 曲リスト生成
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

        // ボタン処理
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

        // タッチ処理
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (const touch of e.touches) {
                handleTouch(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        // キー処理
        window.addEventListener('keydown', e => {
            if (!gameRunning) return;
            if (laneKeys.includes(e.key.toUpperCase())) {
                judgeNote(e.key.toUpperCase());
                tapSound.currentTime = 0;
                tapSound.play();
            }
        });

        showScreen('titleScreen');
    }

    // ====================
    // 画面表示切り替え
    // ====================
    function showScreen(screenId) {
        [titleScreen, gameScreen, resultScreen].forEach(s => s.style.display = 'none');
        document.getElementById(screenId).style.display = 'flex';
    }

    // ====================
    // 曲選択
    // ====================
    function selectSong(index) {
        selectedSong = songs[index];
        Array.from(songList.children).forEach((btn, i) => {
            btn.classList.toggle('selected', i === index);
        });
        startGameButton.disabled = false;
    }

    // ====================
    // 難易度変更
    // ====================
    function updateDifficulty() {
        const diff = difficultySelector.value;
        noteSpeed = diff === 'easy' ? 3 : diff === 'hard' ? 8 : 5;
    }

    // ====================
    // キャンバスリサイズ
    // ====================
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const laneAreaWidth = canvas.width * 0.5;
        const laneWidth = laneAreaWidth / laneKeys.length;

        lanes = [];
        for (let i = 0; i < laneKeys.length; i++) {
            const startX = (canvas.width - laneAreaWidth) / 2;
            lanes.push(startX + laneWidth * i + laneWidth / 2);
        }
    }

    // ====================
    // ゲーム開始
    // ====================
    function startGame() {
        score = 0;
        combo = 0;
        maxCombo = 0;
        notes = [];
        judgeEffects = [];
        tapEffects = [];
        updateDifficulty();

        bgm.src = selectedSong.file;
        bgm.currentTime = 0;

        bgVideo.src = selectedSong.mv;
        bgVideo.currentTime = 0;
        bgVideo.style.display = 'block';
        bgVideo.play();

        gameRunning = true;

        bgm.play().then(() => {
            startNoteSpawning();
        }).catch(err => console.error('再生エラー:', err));

        bgm.onended = () => {
            stopGame();
            showResult();
        };

        gameLoop();
        showScreen('gameScreen');
    }

    // ====================
    // ゲーム停止
    // ====================
    function stopGame() {
        gameRunning = false;
        clearInterval(spawnIntervalId);
        bgm.pause();
        bgm.currentTime = 0;

        bgVideo.pause();
        bgVideo.currentTime = 0;
        bgVideo.style.display = 'none';
    }

    // ====================
    // ノーツ生成
    // ====================
    function startNoteSpawning() {
        const interval = 60000 / selectedSong.bpm;
        spawnIntervalId = setInterval(() => {
            if (gameRunning) spawnNote();
        }, interval);
    }

    function spawnNote() {
        const laneIndex = Math.floor(Math.random() * lanes.length);
        notes.push({ x: lanes[laneIndex], y: 0, laneIndex, hit: false, judgeResult: null });
    }

    // ====================
    // 判定処理
    // ====================
    function judgeNote(key) {
        if (!gameRunning) return;

        const laneIndex = laneKeys.indexOf(key);
        if (laneIndex === -1) return;

        tapEffects.push({ x: lanes[laneIndex], y: canvas.height - 150, frame: 0 });

        const judgeLineY = canvas.height - 150;
        let judged = false;

        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            if (note.laneIndex === laneIndex && !note.hit) {
                const dist = Math.abs(note.y - judgeLineY);

                if (dist <= 20) { handleHit(note, i, 'PERFECT'); judged = true; break; }
                else if (dist <= 40) { handleHit(note, i, 'GREAT'); judged = true; break; }
                else if (dist <= 60) { handleHit(note, i, 'GOOD'); judged = true; break; }
            }
        }

        if (!judged) {
            missSound.play();
            combo = 0;
        }
    }

    function handleHit(note, index, judge) {
        note.hit = true;
        notes.splice(index, 1);

        switch (judge) {
            case 'PERFECT': score += 1000; combo++; perfectSound.play(); break;
            case 'GREAT': score += 700; combo++; greatSound.play(); break;
            case 'GOOD': score += 400; combo++; goodSound.play(); break;
        }

        if (combo > maxCombo) maxCombo = combo;

        judgeEffects.push({ x: note.x, y: canvas.height - 150, judge, frame: 0 });
    }

    // ====================
    // ゲームループ
    // ====================
    function gameLoop() {
        if (!gameRunning) return;

        updateNotes();
        updateJudgeEffects();
        draw();

        requestAnimationFrame(gameLoop);
    }

    function updateNotes() {
        for (let i = notes.length - 1; i >= 0; i--) {
            const note = notes[i];
            note.y += noteSpeed;

            if (!note.hit && note.y > canvas.height - 110) {
                notes.splice(i, 1);
                missSound.play();
                combo = 0;
            }
        }
    }

    function updateJudgeEffects() {
        for (let i = judgeEffects.length - 1; i >= 0; i--) {
            const e = judgeEffects[i];
            e.frame++;
            if (e.frame > 30) judgeEffects.splice(i, 1);
        }
    }

    function draw() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const laneAreaWidth = canvas.width * 0.5;
        const laneWidth = laneAreaWidth / laneKeys.length;
        const startX = (canvas.width - laneAreaWidth) / 2;

        for (let i = 0; i < laneKeys.length; i++) {
            const x = startX + laneWidth * i;
            ctx.fillStyle = '#222';
            ctx.fillRect(x, 0, laneWidth - 2, canvas.height);

            ctx.fillStyle = '#555';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(laneKeys[i], x + laneWidth / 2, canvas.height - 100);
        }

        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startX, canvas.height - 150);
        ctx.lineTo(startX + laneAreaWidth, canvas.height - 150);
        ctx.stroke();

        notes.forEach(note => {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(note.x, note.y, 15, 0, Math.PI * 2);
            ctx.fill();
        });

        judgeEffects.forEach(e => {
            ctx.fillStyle = e.judge === 'PERFECT' ? 'lime' : e.judge === 'GREAT' ? 'cyan' : 'orange';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.globalAlpha = 1 - e.frame / 30;
            ctx.fillText(e.judge, e.x, e.y - e.frame * 2);
            ctx.globalAlpha = 1;
        });

        tapEffects.forEach((e, idx) => {
            ctx.strokeStyle = `rgba(255,255,255,${1 - e.frame / 15})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 20 + e.frame * 3, 0, Math.PI * 2);
            ctx.stroke();

            e.frame++;
            if (e.frame > 15) tapEffects.splice(idx, 1);
        });

        ctx.fillStyle = 'white';
        ctx.font = '28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('SCORE: ' + score, 20, 40);
        ctx.fillText('COMBO: ' + combo, 20, 80);
    }

    function showResult() {
        finalScoreDisplay.textContent = score;
        maxComboDisplay.textContent = maxCombo;
        showScreen('resultScreen');
    }

    function handleTouch(x, y) {
        const laneAreaWidth = canvas.width * 0.5;
        const laneWidth = laneAreaWidth / laneKeys.length;
        const laneStartX = (canvas.width - laneAreaWidth) / 2;

        if (y < canvas.height - 200) return;
        if (x < laneStartX || x > laneStartX + laneAreaWidth) return;

        const laneIndex = Math.floor((x - laneStartX) / laneWidth);
        if (laneIndex < 0 || laneIndex >= laneKeys.length) return;

        const laneKey = laneKeys[laneIndex];
        judgeNote(laneKey);

        tapSound.currentTime = 0;
        tapSound.play();

        tapEffects.push({ x: lanes[laneIndex], y: canvas.height - 150, frame: 0 });
    }

    init();
});
