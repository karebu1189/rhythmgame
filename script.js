const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const lanes = [50, 130, 210, 290, 370];
const judgeLineY = 550;

let chart = [];
let notes = [];
let effects = [];
let startTime = 0;
let gameRunning = false;
let combo = 0;

const bgm = new Audio(); // ※BGMファイルは各自追加してください

// 譜面を読み込む
async function loadChart() {
  const res = await fetch('mede_chart.json');
  chart = await res.json();
  chart.sort((a, b) => a.time - b.time);
}

// ゲーム開始
async function startGame() {
  await loadChart();

  notes = [];
  effects = [];
  combo = 0;
  gameRunning = true;
  startTime = performance.now();

  bgm.src = 'bgm.mp3';  // ご自身で用意してください
  bgm.play();

  bgm.onended = () => {
    gameRunning = false;
    alert('ゲーム終了！ コンボ: ' + combo);
  };

  requestAnimationFrame(gameLoop);
}

// ゲームループ
function gameLoop(timestamp) {
  if (!gameRunning) return;

  const elapsed = (timestamp - startTime) / 1000;

  // 1秒先読みで譜面からノーツ生成
  while (chart.length > 0 && chart[0].time <= elapsed + 1) {
    const noteData = chart.shift();
    const laneX = lanes[noteData.lane];
    notes.push({
      x: laneX - 25,
      y: 0,
      laneIndex: noteData.lane,
      type: noteData.type,
      duration: noteData.duration || 0,
      hit: false
    });
  }

  updateNotes();
  draw();

  requestAnimationFrame(gameLoop);
}

// ノーツ落下更新
function updateNotes() {
  for (let i = notes.length - 1; i >= 0; i--) {
    notes[i].y += 6; // 落下速度

    if (notes[i].y > judgeLineY + 50) {
      notes.splice(i, 1);
      combo = 0;
    }
  }
}

// 判定ヒット時の処理（スペースキーで判定）
function handleHit() {
  let closestIndex = -1;
  let closestDist = 999;
  for (let i = 0; i < notes.length; i++) {
    const dist = Math.abs(notes[i].y - judgeLineY);
    if (dist < 40 && dist < closestDist) {
      closestDist = dist;
      closestIndex = i;
    }
  }

  if (closestIndex !== -1) {
    combo++;
    createEffect(notes[closestIndex].x + 25, notes[closestIndex].y + 25);
    notes.splice(closestIndex, 1);
  } else {
    combo = 0;
  }
}

// 光る輪エフェクト追加
function createEffect(x, y) {
  effects.push({
    x: x,
    y: y,
    radius: 5,
    maxRadius: 50,
    alpha: 1
  });
}

// 描画処理
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 判定ライン（光る演出）
  let glowAlpha = 0.5 + 0.5 * Math.sin(performance.now() / 200);
  ctx.fillStyle = `rgba(255, 255, 0, ${glowAlpha})`;
  ctx.fillRect(0, judgeLineY - 5, canvas.width, 10);

  // ノーツ描画
  notes.forEach(note => {
    ctx.fillStyle = note.type === 'hold' ? 'orange' : 'cyan';
    ctx.fillRect(note.x, note.y, 50, 50);
  });

  // エフェクト描画
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    ctx.beginPath();
    ctx.strokeStyle = `rgba(0, 255, 255, ${e.alpha.toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.arc(e.x, e.y, e.radius, 0, 2 * Math.PI);
    ctx.stroke();

    e.radius += 2;
    e.alpha -= 0.04;
    if (e.alpha <= 0) effects.splice(i, 1);
  }

  // コンボ表示
  ctx.fillStyle = 'white';
  ctx.font = '28px sans-serif';
  ctx.fillText(`コンボ: ${combo}`, 20, 40);
}

// スペースキーで判定
window.addEventListener('keydown', e => {
  if (!gameRunning) return;
  if (e.code === 'Space') {
    handleHit();
  }
});

document.getElementById('startBtn').addEventListener('click', () => {
  if (!gameRunning) {
    startGame();
  }
});
