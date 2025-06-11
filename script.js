const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// レーン設定
const laneCount = 4;
const laneWidth = canvas.width / laneCount;
const lanes = [];
for(let i=0; i < laneCount; i++){
  lanes.push(laneWidth * i + laneWidth / 2);
}

// キー対応（A S D F）
const laneKeys = ['A', 'S', 'D', 'F'];

// ノーツ配列
let notes = [];

// 判定ラインのY座標
const judgeLineY = canvas.height - 100;

// 判定音
const perfectSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
const greatSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
const goodSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
const missSound = new Audio('https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum_hit.ogg');

// ゲーム状態
let gameRunning = false;
let score = 0;

// ノーツ速度（ピクセル/秒）
const noteSpeed = 300;

// 判定処理
function judgeNoteHit(laneIndex){
  if(notes.length === 0){
    miss();
    return;
  }

  let targetNoteIndex = -1;
  let minDistance = 1000;

  for(let i=0; i < notes.length; i++){
    if(notes[i].laneIndex !== laneIndex) continue;
    const distance = Math.abs(notes[i].y - judgeLineY);
    if(distance < minDistance){
      minDistance = distance;
      targetNoteIndex = i;
    }
  }

  if(targetNoteIndex === -1){
    miss();
    return;
  }

  if(minDistance < 10){
    perfect();
    notes.splice(targetNoteIndex, 1);
  } else if(minDistance < 25){
    great();
    notes.splice(targetNoteIndex, 1);
  } else if(minDistance < 40){
    good();
    notes.splice(targetNoteIndex, 1);
  } else {
    miss();
  }
}

// 判定結果の音とスコア加算
function perfect(){
  score += 1000;
  perfectSound.play();
  console.log("Perfect! Score: " + score);
}

function great(){
  score += 700;
  greatSound.play();
  console.log("Great! Score: " + score);
}

function good(){
  score += 300;
  goodSound.play();
  console.log("Good! Score: " + score);
}

function miss(){
  missSound.play();
  console.log("Miss!");
}

// キー押下イベント
document.addEventListener('keydown', e => {
  if(!gameRunning) return;
  const key = e.key.toUpperCase();
  const laneIndex = laneKeys.indexOf(key);
  if(laneIndex === -1 || laneIndex >= laneCount) return;
  judgeNoteHit(laneIndex);
});

// タッチイベント
canvas.addEventListener('touchstart', e => {
  if(!gameRunning) return;
  e.preventDefault();

  const touch = e.changedTouches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;

  let laneIndex = -1;
  for(let i = 0; i < lanes.length; i++){
    if(Math.abs(x - lanes[i]) < 30){
      laneIndex = i;
      break;
    }
  }

  if(laneIndex !== -1){
    judgeNoteHit(laneIndex);
  }
});

// ノーツ生成（デモ用）
function spawnNote(){
  const laneIndex = Math.floor(Math.random() * laneCount);
  notes.push({
    laneIndex: laneIndex,
    y: 0
  });
}

// ゲーム開始処理
function startGame(){
  gameRunning = true;
  score = 0;
  notes = [];

  // 音楽再生（ユーザー操作が必要）
  const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/03/03/audio_668d4eae14.mp3?filename=happy-upbeat-funk-13327.mp3');
  audio.loop = false;
  audio.play();

  // ノーツ生成を1秒ごとに実行
  setInterval(spawnNote, 1000);

  // ゲームループ開始
  requestAnimationFrame(gameLoop);
}

let lastTimestamp = null;
function gameLoop(timestamp){
  if(!lastTimestamp) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // 画面クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 判定ライン描画
  ctx.fillStyle = 'yellow';
  ctx.fillRect(0, judgeLineY, canvas.width, 5);

  // レーン線描画
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  for(let i=1; i < laneCount; i++){
    ctx.beginPath();
    ctx.moveTo(laneWidth * i, 0);
    ctx.lineTo(laneWidth * i, canvas.height);
    ctx.stroke();
  }

  // ノーツの移動と描画
  ctx.fillStyle = 'cyan';
  for(let i=0; i < notes.length; i++){
    notes[i].y += noteSpeed * delta;
    const x = lanes[notes[i].laneIndex];
    ctx.beginPath();
    ctx.arc(x, notes[i].y, 20, 0, Math.PI*2);
    ctx.fill();

    // 画面外に出たらmiss判定で削除
    if(notes[i].y > canvas.height){
      notes.splice(i, 1);
      i--;
      miss();
    }
  }

  // スコア表示
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText('Score: ' + score, 10, 30);

  if(gameRunning){
    requestAnimationFrame(gameLoop);
  }
}

// スタートボタンのクリックイベント
document.getElementById('startButton').addEventListener('click', () => {
  if(!gameRunning){
    startGame();
  }
});
