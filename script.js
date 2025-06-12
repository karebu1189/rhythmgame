document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
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
  const tapSoundPerfect = document.getElementById('perfectSound');
  const tapSoundGreat = document.getElementById('greatSound');
  const tapSoundGood = document.getElementById('goodSound');
  const tapSoundMiss = document.getElementById('missSound');
  const tapSound = document.getElementById('tapSound');

  const finalScoreDisplay = document.getElementById('finalScore');
  const maxComboDisplay = document.getElementById('maxCombo');

  // --- Constants ---
  const laneKeys = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';'];
  const NOTE_TYPES = { TAP: 'tap', HOLD: 'hold', SLIDE: 'slide' };
  const JUDGE_TIMINGS = {
    PERFECT: 0.05,  // 秒以内
    GREAT: 0.1,
    GOOD: 0.15,
    MISS: 0.2
  };
  const JUDGE_SCORE = {
    PERFECT: 1000,
    GREAT: 700,
    GOOD: 400,
    MISS: 0
  };

  // --- State ---
  let selectedSong = null;
  let lanes = [];
  let notes = [];
  let holdNotesActive = {};
  let judgeEffects = [];
  let tapEffects = [];

  let score = 0;
  let combo = 0;
  let maxCombo = 0;

  let gameRunning = false;

  let canvasWidth = window.innerWidth;
  let canvasHeight = window.innerHeight;

  // 譜面読み込み用（簡易サンプル、秒単位でタイミング指定）
  // ここは曲ごとに差し替え可能。typeは'TAP','HOLD','SLIDE'
  const sampleChart = [
    { time: 1.0, lane: 0, type: NOTE_TYPES.TAP },
    { time: 1.5, lane: 1, type: NOTE_TYPES.TAP },
    { time: 2.0, lane: 2, type: NOTE_TYPES.HOLD, duration: 1.5 },
    { time: 3.8, lane: 3, type: NOTE_TYPES.SLIDE, targetLane: 4, duration: 1.0 },
    { time: 5.0, lane: 5, type: NOTE_TYPES.TAP },
    { time: 6.0, lane: 6, type: NOTE_TYPES.TAP },
    { time: 7.0, lane: 7, type: NOTE_TYPES.TAP },
    { time: 8.0, lane: 0, type: NOTE_TYPES.TAP }
  ];

  // 曲リスト（fileは実際の音源ファイルパスに変えてね）
  const songs = [
  { title: 'メデ', file: 'メデ.mp3', bpm: 140, chart: sampleChart },
  { title: 'トンデモワンダーズ', file: 'トンデモワンダーズ.mp3', bpm: 150, chart: sampleChart },
  { title: 'テトリス', file: 'テトリス.mp3', bpm: 120, chart: sampleChart },
  { title: 'マーシャル・マキシマイザー', file: 'マーシャル・マキシマイザー.mp3', bpm: 160, chart: sampleChart },
  { title: 'ブリキノダンス', file: 'ブリキノダンス.mp3', bpm: 160, chart: sampleChart },
  { title: 'シャルル', file: 'シャルル.mp3', bpm: 145, chart: sampleChart },
  { title: 'グッバイ宣言', file: 'グッバイ宣言.mp3', bpm: 160, chart: sampleChart },
  { title: 'ドラマツルギー', file: 'ドラマツルギー.mp3', bpm: 150, chart: sampleChart },
  { title: 'KING', file: 'KING.mp3', bpm: 166, chart: sampleChart },
  { title: 'ビターチョコデコレーション', file: 'ビターチョコデコレーション.mp3', bpm: 180, chart: sampleChart },
  { title: 'ロウワー', file: 'ロウワー.mp3', bpm: 160, chart: sampleChart },
  { title: '夜に駆ける', file: '夜に駆ける.mp3', bpm: 130, chart: sampleChart },
  { title: 'マリーゴールド', file: 'マリーゴールド.mp3', bpm: 130, chart: sampleChart },
  { title: 'ドライフラワー', file: 'ドライフラワー.mp3', bpm: 125, chart: sampleChart },
  { title: '香水', file: '香水.mp3', bpm: 140, chart: sampleChart },
  { title: 'Pretender', file: 'Pretender.mp3', bpm: 140, chart: sampleChart },
  { title: '新曲１', file: 'new01.mp3', bpm: 150, chart: sampleChart },
  { title: '新曲２', file: 'new02.mp3', bpm: 155, chart: sampleChart },
  { title: '新曲３', file: 'new03.mp3', bpm: 160, chart: sampleChart },
  { title: '新曲４', file: 'new04.mp3', bpm: 165, chart: sampleChart },
];


  // --- 初期化 ---
  function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 曲リスト生成
    songList.innerHTML = '';
    songs.forEach((song, i) => {
      const btn = document.createElement('button');
      btn.textContent = song.title;
      btn.className = 'songItem';
      btn.addEventListener('click', () => {
        selectSong(i);
      });
      songList.appendChild(btn);
    });

    backButton.addEventListener('click', () => {
      stopGame();
      showScreen('titleScreen');
    });
    backButtonResult.addEventListener('click', () => {
      showScreen('titleScreen');
    });
    retryButton.addEventListener('click', () => {
      startGame();
    });

    startGameButton.addEventListener('click', () => {
      if (!selectedSong) return;
      startGame();
    });

    difficultySelector.addEventListener('change', () => {
      // 難易度別で譜面や速度変えたいならここに
    });

    // キーボード判定
    window.addEventListener('keydown', e => {
      if (!gameRunning) return;
      const key = e.key.toUpperCase();
      if (laneKeys.includes(key)) {
        judgeNoteInput(key);
      }
    });

    // タッチ対応（スマホ・マルチタッチ）
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const touch of e.touches) {
        handleTouch(touch.clientX, touch.clientY);
      }
    }, { passive: false });

    selectSong(0);
    showScreen('titleScreen');
  }

  // --- 画面切り替え ---
  function showScreen(screenId) {
    [titleScreen, gameScreen, resultScreen].forEach(s => s.style.display = 'none');
    if (screenId === 'titleScreen') titleScreen.style.display = 'flex';
    else if (screenId === 'gameScreen') gameScreen.style.display = 'flex';
    else if (screenId === 'resultScreen') resultScreen.style.display = 'flex';
  }

  // --- 曲選択 ---
  function selectSong(index) {
    selectedSong = songs[index];
    Array.from(songList.children).forEach((btn, i) => {
      btn.classList.toggle('selected', i === index);
    });
    startGameButton.disabled = false;
  }

  // --- キャンバスリサイズ ---
  function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const laneAreaWidth = canvasWidth * 0.5;
    const laneWidth = laneAreaWidth / laneKeys.length;
    lanes = [];
    for (let i = 0; i < laneKeys.length; i++) {
      const startX = (canvasWidth - laneAreaWidth) / 2;
      lanes.push(startX + laneWidth * i + laneWidth / 2);
    }
  }

  // --- ゲーム開始 ---
  function startGame() {
    score = 0;
    combo = 0;
    maxCombo = 0;
    notes = [];
    judgeEffects = [];
    tapEffects = [];
    holdNotesActive = {};
    gameRunning = true;

    bgm.src = selectedSong.file;
    bgm.currentTime = 0;
    bgm.play();

    startTime = performance.now() / 1000;
    noteIndex = 0;

    // BGM終わり検知してゲーム終了
    bgm.onended = () => {
      stopGame();
      showResult();
    };

    // 譜面データコピー
    notes = selectedSong.chart.map(note => ({ ...note, judged: false }));

    showScreen('gameScreen');
    requestAnimationFrame(gameLoop);
  }

  // --- ゲーム停止 ---
  function stopGame() {
    gameRunning = false;
    bgm.pause();
  }

  // --- ゲームループ ---
  let startTime = 0;
  let noteIndex = 0;

  function gameLoop() {
    if (!gameRunning) return;

    const currentTime = performance.now() / 1000 - startTime;
    update(currentTime);
    draw(currentTime);
    requestAnimationFrame(gameLoop);
  }

  // --- 更新処理 ---
  function update(time) {
    // ノーツのY座標計算: 判定ラインは画面下100pxぐらい
    // ノーツは出現タイミングの1.5秒前に上から降ってくる（落下時間一定）

    const fallDuration = 1.5;
    const judgeLineY = canvasHeight - 150;

    // ノーツの状態更新
    for (let note of notes) {
      note.y = (time - (note.time - fallDuration)) / fallDuration * judgeLineY;
    }

    // 自動MISS処理（判定時間超えたノーツはMISS）
    for (let note of notes) {
      if (note.judged) continue;
      if (time - note.time > JUDGE_TIMINGS.MISS) {
        note.judged = true;
        processJudge('MISS', note);
        combo = 0;
      }
    }

    // エフェクトの寿命管理
    judgeEffects = judgeEffects.filter(e => e.life > 0);
    judgeEffects.forEach(e => e.life -= 0.016);

    tapEffects = tapEffects.filter(e => e.life > 0);
    tapEffects.forEach(e => e.life -= 0.016);
  }

  // --- 描画処理 ---
  function draw(time) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 背景グラデーション（プロセカ風ブルーグラデ）
    const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    grad.addColorStop(0, '#0a1f5e');
    grad.addColorStop(1, '#112f8c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // レーン描画
    const laneWidth = (canvasWidth * 0.5) / laneKeys.length;
    const laneStartX = (canvasWidth - canvasWidth * 0.5) / 2;

    for (let i = 0; i < laneKeys.length; i++) {
      const x = laneStartX + laneWidth * i;
      // レーンの背景色をグラデーション
      const laneGrad = ctx.createLinearGradient(x, 0, x + laneWidth, 0);
      laneGrad.addColorStop(0, '#244aa8');
      laneGrad.addColorStop(1, '#2b54bb');
      ctx.fillStyle = laneGrad;
      ctx.fillRect(x, 0, laneWidth, canvasHeight);

      // レーン区切り線
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();

      // キー表示
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(laneKeys[i], x + laneWidth / 2, canvasHeight - 40);
    }

    // 判定ライン描画（画面下150px）
    ctx.strokeStyle = '#f0f0ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#99ccff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(laneStartX, canvasHeight - 150);
    ctx.lineTo(laneStartX + laneWidth * laneKeys.length, canvasHeight - 150);
    ctx.stroke();

    // ノーツ描画
    for (let note of notes) {
      if (note.judged) continue;
      const x = lanes[note.lane];
      const y = note.y;

      if (y < 0 || y > canvasHeight) continue;

      ctx.save();

      // ノーツ形状・色
      if (note.type === NOTE_TYPES.TAP) {
        // 円形ノーツ
        ctx.fillStyle = '#89c9f4';
        ctx.shadowColor = '#50aaff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();

        // 内側光
        const radGrad = ctx.createRadialGradient(x, y, 5, x, y, 20);
        radGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
        radGrad.addColorStop(1, 'rgba(137,201,244,0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
      } else if (note.type === NOTE_TYPES.HOLD) {
        // ホールドノーツは縦長の楕円形＋線で持続を表現
        const holdLength = (note.duration / 1.5) * (canvasHeight - 150);
        ctx.fillStyle = '#8efcfc';
        ctx.shadowColor = '#33ffff';
        ctx.shadowBlur = 20;

        // ホールド線
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#33ffff';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + holdLength);
        ctx.stroke();

        // ホールド終端ノーツ
        ctx.beginPath();
        ctx.ellipse(x, y, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (note.type === NOTE_TYPES.SLIDE) {
        // スライドノーツは矢印形で簡易表現
        ctx.fillStyle = '#f4a589';
        ctx.shadowColor = '#ff7750';
        ctx.shadowBlur = 20;

        // 矢印の形
        ctx.beginPath();
        ctx.moveTo(x - 15, y - 10);
        ctx.lineTo(x + 15, y);
        ctx.lineTo(x - 15, y + 10);
        ctx.closePath();
        ctx.fill();

        // 矢印の軌跡線（スライド先まで直線）
        const targetX = lanes[note.targetLane];
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffbb88';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(targetX, y + (note.duration / 1.5) * (canvasHeight - 150));
        ctx.stroke();
      }

      ctx.restore();
    }

    // エフェクト描画
    judgeEffects.forEach(e => {
      ctx.save();
      ctx.globalAlpha = e.life;
      ctx.fillStyle = e.color;
      ctx.font = `bold ${40 + (1 - e.life) * 20}px Arial`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.fillText(e.text, e.x, e.y - (1 - e.life) * 50);
      ctx.restore();
    });

    tapEffects.forEach(e => {
      ctx.save();
      ctx.globalAlpha = e.life;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 20 + (1 - e.life) * 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // スコア・コンボ表示
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 30, 50);

    if (combo > 1) {
      ctx.fillStyle = '#66ccff';
      ctx.font = `bold ${30 + combo}px Arial`;
      ctx.textAlign = 'right';
      ctx.fillText(`COMBO: ${combo}`, canvasWidth - 30, 50);
    }
  }

  // --- 入力判定 ---
  function judgeNoteInput(key) {
    const lane = laneKeys.indexOf(key);
    if (lane < 0) return;

    // 判定ラインのタイミング判定を探す
    const currentTime = performance.now() / 1000 - startTime;
    const fallDuration = 1.5;
    const judgeLineY = canvasHeight - 150;

    // 判定対象ノーツ探し
    let candidate = null;
    let candidateJudge = 'MISS';
    let candidateOffset = 999;

    for (let note of notes) {
      if (note.judged) continue;
      if (note.lane !== lane) continue;

      const offset = Math.abs(note.time - currentTime);

      if (offset < JUDGE_TIMINGS.MISS && offset < candidateOffset) {
        candidate = note;

        if (offset < JUDGE_TIMINGS.PERFECT) candidateJudge = 'PERFECT';
        else if (offset < JUDGE_TIMINGS.GREAT) candidateJudge = 'GREAT';
        else if (offset < JUDGE_TIMINGS.GOOD) candidateJudge = 'GOOD';
        else candidateJudge = 'MISS';

        candidateOffset = offset;
      }
    }

    if (!candidate) {
      playTapSound('MISS');
      processJudge('MISS', null);
      combo = 0;
      return;
    }

    // ホールド判定の場合は長押し開始フラグを立てる
    if (candidate.type === NOTE_TYPES.HOLD) {
      holdNotesActive[lane] = {
        note: candidate,
        startTime: currentTime
      };
      candidate.judged = true;
      processJudge(candidateJudge, candidate);
      return;
    }

    // スライド判定は簡易化で同じく判定
    if (candidate.type === NOTE_TYPES.SLIDE) {
      candidate.judged = true;
      processJudge(candidateJudge, candidate);
      return;
    }

    // タップノーツ判定
    if (candidate.type === NOTE_TYPES.TAP) {
      candidate.judged = true;
      processJudge(candidateJudge, candidate);
      return;
    }
  }

  // --- ホールドノーツリリース判定 ---
  window.addEventListener('keyup', e => {
    if (!gameRunning) return;
    const key = e.key.toUpperCase();
    if (!laneKeys.includes(key)) return;
    const lane = laneKeys.indexOf(key);

    if (holdNotesActive[lane]) {
      const hold = holdNotesActive[lane];
      const holdNote = hold.note;
      const currentTime = performance.now() / 1000 - startTime;

      const holdTime = currentTime - hold.startTime;
      const requiredHoldTime = holdNote.duration;

      // 十分長押しできていればGOOD以上判定
      if (holdTime >= requiredHoldTime - 0.1) {
        processJudge('PERFECT', holdNote);
        score += 500; // ボーナス点
        combo++;
        maxCombo = Math.max(maxCombo, combo);
      } else {
        processJudge('MISS', holdNote);
        combo = 0;
      }

      delete holdNotesActive[lane];
    }
  });

  // --- タッチ判定 ---
  function handleTouch(x, y) {
    // 画面下半分にあるレーン内のx座標から判定
    const laneAreaWidth = canvasWidth * 0.5;
    const laneStartX = (canvasWidth - laneAreaWidth) / 2;
    if (y < canvasHeight / 2) return; // 下半分のみ判定

    if (x < laneStartX || x > laneStartX + laneAreaWidth) return;

    const laneWidth = laneAreaWidth / laneKeys.length;
    const lane = Math.floor((x - laneStartX) / laneWidth);
    if (lane < 0 || lane >= laneKeys.length) return;

    judgeNoteInput(laneKeys[lane]);
  }

  // --- 判定処理 ---
  function processJudge(judge, note) {
    if (judge === 'MISS') {
      playTapSound('MISS');
      addJudgeEffect('MISS', note);
      combo = 0;
      return;
    }

    // スコア計算
    score += JUDGE_SCORE[judge];
    combo++;
    maxCombo = Math.max(maxCombo, combo);

    playTapSound(judge);
    addJudgeEffect(judge, note);
  }

  // --- 判定エフェクト追加 ---
  function addJudgeEffect(judge, note) {
    const judgeColors = {
      PERFECT: '#88ff88',
      GREAT: '#66ccff',
      GOOD: '#ffee88',
      MISS: '#ff6666'
    };

    const text = judge;
    let x = canvasWidth / 2;
    let y = canvasHeight / 2;

    if (note) {
      x = lanes[note.lane];
      y = note.y;
    }

    judgeEffects.push({
      text,
      x,
      y,
      color: judgeColors[judge] || '#ffffff',
      life: 1
    });

    // タップエフェクトも追加
    tapEffects.push({
      x,
      y,
      color: judgeColors[judge] || '#ffffff',
      life: 1
    });
  }

  // --- 判定音再生 ---
  function playTapSound(judge) {
    // 判定別に音を変える
    if (judge === 'PERFECT') tapSoundPerfect.play();
    else if (judge === 'GREAT') tapSoundGreat.play();
    else if (judge === 'GOOD') tapSoundGood.play();
    else tapSoundMiss.play();
  }

  // --- 結果画面表示 ---
  function showResult() {
    finalScoreDisplay.textContent = score;
    maxComboDisplay.textContent = maxCombo;
    showScreen('resultScreen');
  }

  // --- 初期化呼び出し ---
  init();
});
