document.addEventListener('DOMContentLoaded', () => {

    // 要素取得
    const titleScreen = document.getElementById('titleScreen');
    const gameScreen = document.getElementById('gameScreen');
    const resultScreen = document.getElementById('resultScreen');

    const songList = document.getElementById('songList');
    const difficultySelector = document.getElementById('difficultySelector');
    const laneCountSelector = document.getElementById('laneCountSelector');
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
    const backToTitleButton = document.getElementById('backToTitleButton');

    // レーンキーセット候補（4〜8レーン）
    const laneKeySets = {
        4: ['D', 'F', 'J', 'K'],
        5: ['D', 'F', 'G', 'J', 'K'],
        6: ['D', 'F', 'G', 'H', 'J', 'K'],
        7: ['D', 'F', 'G', 'H', 'J', 'K', 'L'],
        8: ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';']
    };

    // 曲リスト（ファイルはローカルまたはURLで用意してください）
    const songs = [
        { title: 'メデ', file: 'medea.mp3' },
        { title: '曲2', file: 'song2.mp3' },
        { title: '曲3', file: 'song3.mp3' },
        { title: '新曲1', file: 'new_song1.mp3' },
        { title: '新曲2', file: 'new_song2.mp3' }
    ];

    // ゲーム変数
    let selectedSong = songs[0];
    let laneCount = Number(laneCountSelector.value);
    let laneKeys = laneKeySets[laneCount];
    let lanes = [];
    let notes = [];
    let judgeEffects = [];
    let effects = [];
    let score = 0;
    let combo = 0;
    let gameRunning = false;
    let spawnInterval = null;
    let noteSpeed = 5;
    let noteSpawnRate = 600;

    // 曲選択UIセットアップ
    function setupSongList(){
        songList.innerHTML = '';
        songs.forEach((song, i) => {
            const songBtn = document.createElement('div');
            songBtn.className = 'songItem';
            songBtn.textContent = song.title;
            songBtn.style.color = (song === selectedSong) ? 'yellow' : 'white';
            songBtn.onclick = () => {
                selectedSong = song;
                Array.from(songList.children).forEach(c => c.style.color = 'white');
                songBtn.style.color = 'yellow';
            };
            songList.appendChild(songBtn);
        });
    }

    setupSongList();

    // ウィンドウサイズに合わせてキャンバスを調整
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initializeLanes();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // レーン位置初期化
    function initializeLanes() {
        lanes = [];
        const laneWidth = 50;
        const totalWidth = laneWidth * laneCount;
        const startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;
        for (let i = 0; i < laneCount; i++) {
            lanes.push(startX + i * laneWidth);
        }
    }

    // 難易度設定反映
    function updateDifficulty() {
        const difficulty = difficultySelector.value;
        const difficulties = {
            easy: { noteSpeed: 3, spawnRate: 800 },
            normal: { noteSpeed: 5, spawnRate: 600 },
            hard: { noteSpeed: 7, spawnRate: 400 }
        };
        noteSpeed = difficulties[difficulty].noteSpeed;
        noteSpawnRate = difficulties[difficulty].spawnRate;
    }

    difficultySelector.onchange = updateDifficulty;
    laneCountSelector.onchange = () => {
        laneCount = Number(laneCountSelector.value);
        laneKeys = laneKeySets[laneCount];
        initializeLanes();
    };

    updateDifficulty();

    // ゲーム開始
    function startGame() {
        score = 0;
        combo = 0;
        notes = [];
        judgeEffects = [];
        effects = [];
        gameRunning = true;

        titleScreen.style.display = 'none';
        resultScreen.style.display = 'none';
        gameScreen.style.display = 'flex';

        initializeLanes();

        bgm.src = selectedSong.file;
        bgm.play();

        // ノーツ生成タイマー
        if(spawnInterval) clearInterval(spawnInterval);
        spawnInterval = setInterval(() => {
            if (!gameRunning) return;
            // ランダムにレーン選択しノーツ生成（自動譜面生成の簡易実装）
            let laneIndex = Math.floor(Math.random() * laneCount);
            notes.push({ x: lanes[laneIndex] - 25, y: 0, laneIndex: laneIndex });
        }, noteSpawnRate);

        bgm.onended = () => {
            endGame();
        };

        draw();
    }

    // ゲーム終了
    function endGame() {
        gameRunning = false;
        clearInterval(spawnInterval);
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'flex';

        document.getElementById('finalScore').textContent = `スコア: ${score}`;
        document.getElementById('finalRank').textContent = `ランク: ${getRank(score)}`;
    }

    // ランク計算
    function getRank(score) {
        if (score > 800) return 'S';
        if (score > 600) return 'A';
        if (score > 400) return 'B';
        if (score > 200) return 'C';
        return 'D';
    }

    // 描画処理
    function draw() {
        if (!gameRunning) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // レーン描画
        lanes.forEach(x => {
            ctx.fillStyle = '#222';
            ctx.fillRect(x - 25, 0, 50, canvas.height);
        });

        // 判定ライン
        const judgeY = canvas.height - 100;
        ctx.fillStyle = 'white';
        ctx.fillRect(lanes[0] - 25, judgeY, 50 * laneCount, 5);

        // ノーツ描画
        notes.forEach(note => {
            ctx.fillStyle = 'cyan';
            ctx.fillRect(note.x, note.y, 50, 20);
        });

        // ノーツ移動
        notes.forEach(note => {
            note.y += noteSpeed;
        });

        // 判定ラインを過ぎたノーツをmiss扱いで削除
        notes = notes.filter(note => {
            if (note.y > canvas.height) {
                missSound.play();
                combo = 0;
                return false;
            }
            return true;
        });

        // 判定エフェクトなど描画（省略可能）

        requestAnimationFrame(draw);
    }

    // 判定処理
    function judge(key) {
        if (!gameRunning) return;

        const laneIndex = laneKeys.indexOf(key.toUpperCase());
        if (laneIndex === -1) return;

        const judgeY = canvas.height - 100;
        let hitNoteIndex = -1;
        let closestDistance = 9999;

        // 判定範囲大きめ（±60ピクセル）
        const judgeRange = 60;

        notes.forEach((note, i) => {
            if (note.laneIndex !== laneIndex) return;
            const dist = Math.abs(note.y - judgeY);
            if (dist < judgeRange && dist < closestDistance) {
                closestDistance = dist;
                hitNoteIndex = i;
            }
        });

        if (hitNoteIndex !== -1) {
            // ヒット処理
            const dist = Math.abs(notes[hitNoteIndex].y - judgeY);
            if (dist < 15) {
                score += 100;
                combo++;
                perfectSound.play();
            } else if (dist < 30) {
                score += 70;
                combo++;
                greatSound.play();
            } else {
                score += 50;
                combo++;
                goodSound.play();
            }
            notes.splice(hitNoteIndex, 1);
        } else {
            // ミス
            missSound.play();
            combo = 0;
        }
    }

    // キー入力検知
    window.addEventListener('keydown', e => {
        judge(e.key);
        tapSound.play();
    });

    // ボタンイベント
    startGameButton.onclick = () => startGame();
    retryButton.onclick = () => startGame();
    backButton.onclick = () => {
        gameRunning = false;
        clearInterval(spawnInterval);
        gameScreen.style.display = 'none';
        titleScreen.style.display = 'flex';
    };
    backToTitleButton.onclick = () => {
        resultScreen.style.display = 'none';
        titleScreen.style.display = 'flex';
    };

});
