document.addEventListener('DOMContentLoaded', () => {

  // --- DOM ---
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
  const resultBackButton = document.getElementById('resultBackButton');

  const newSongTitleInput = document.getElementById('newSongTitle');
  const newSongFileInput = document.getElementById('newSongFile');
  const addSongButton = document.getElementById('addSongButton');

  // --- ゲーム変数 ---
  let selectedSong = null;
  let lanes = [];
  let laneKeysFull = ['D', 'F', 'G', 'H', 'J', 'K', 'L', ';']; // 最大8レーン用キー設定
  let laneKeys = [];  // 実際のゲームで使うキー
  let notes = [];
  let score = 0;
  let combo = 0;
  let gameRunning = false;
  let spawnInterval;

  const difficulties = {
    easy: { noteSpeed: 3, spawnRate: 900 },
    normal: { noteSpeed: 5, spawnRate: 600 },
    hard: { noteSpeed: 7, spawnRate: 400 }
  };

  let noteSpeed = difficulties.normal.noteSpeed;
  let noteSpawnRate = difficulties.normal.spawnRate;
  let laneCount = 8;

  // --- 曲リスト ---
  const songs = [
    { title: 'メデ', file: 'med.mp3' },
    { title: 'トンデモワンダーズ', file: 'https://www.youtube.com/watch?v=dBQg24mx45Y' },
    { title: '曲3', file: 'song3.mp3' }
  ];

  // 曲リスト表示と選択処理
  function setupSongList(){
    songList.innerHTML = '';
    songs.forEach((song, i) => {
      const songButton = document.createElement('div');
      songButton.className = 'songItem';
      songButton.innerText = song.title;
      songButton.style.color = (selectedSong === song) ? 'yellow' : 'white';
      songButton.onclick = () => {
        selectedSong = song;
        setupSongList();
      };
      songList.appendChild(songButton);
    });
    if(!selectedSong && songs.length > 0){
      selectedSong = songs[0];
      setupSongList();
    }
  }

  // 曲追加処理
  addSongButton.onclick = () => {
    const title = newSongTitleInput.value.trim();
    const file = newSongFileInput.value.trim();
    if(title === '' || file === ''){
      alert('曲名とファイルパスを両方入力してください');
      return;
    }
    songs.push({ title, file });
    setupSongList();
    newSongTitleInput.value = '';
    newSongFileInput.value = '';
    alert(`曲「${title}」を追加しました`);
  };

  // --- ウィンドウ＆キャンバス設定 ---
  function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // レーン初期化
  function initializeLanes(){
    lanes = [];
    laneKeys = laneKeysFull.slice(0, laneCount);
    const laneWidth = 60;
    const totalWidth = laneWidth * laneCount;
    const startX = (canvas.width - totalWidth) / 2 + laneWidth / 2;

    for(let i=0; i < laneCount; i++){
      lanes.push(startX + i * laneWidth);
    }
  }

  // 譜面自動生成
  function spawnNote(){
    const laneIndex = Math.floor(Math.random() * laneCount);
    const laneX = lanes[laneIndex];
    notes.push({ x: laneX - 25, y: 0, laneIndex });
  }

  // ゲーム開始
  function startGame(){
    laneCount = parseInt(laneCountSelector.value, 10);
    initializeLanes();
    notes = [];
    score = 0;
    combo = 0;
    noteSpeed = difficulties[difficultySelector.value].noteSpeed;
    noteSpawnRate = difficulties[difficultySelector.value].spawnRate;

    if(!selectedSong) selectedSong = songs[0];
    bgm.src = selectedSong.file;
    bgm.currentTime = 0;

    gameRunning = true;

    titleScreen.style.display = 'none';
    resultScreen.style.display = 'none';
    gameScreen.style.display = 'flex';

    clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
      spawnNote();
    }, noteSpawnRate);

    bgm.play();

    gameLoop();
  }

  // 判定判定用
  function getJudge(distance){
    if(distance < 20) return 'Perfect';
    if(distance < 40) return 'Great';
    if(distance < 60) return 'Good';
    return 'Miss';
  }

  // ゲームループ
  function gameLoop(){
    if(!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const judgeLineY = canvas.height - 150;
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, judgeLineY);
    ctx.lineTo(canvas.width, judgeLineY);
    ctx.stroke();

    lanes.forEach((x, i) => {
      ctx.fillStyle = 'rgba(100,100,100,0.5)';
      ctx.fillRect(x - 25, 0, 50, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(laneKeys[i], x, canvas.height - 100);
    });

    for(let i = notes.length - 1; i >= 0; i--){
      notes[i].y += noteSpeed;
      ctx.fillStyle = 'cyan';
      ctx.fillRect(notes[i].x, notes[i].y, 50, 20);

      if(notes[i].y > judgeLineY + 30){
        notes.splice(i, 1);
        combo = 0;
        missSound.play();
      }
    }

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 50, 50);
    ctx.fillText(`Combo: ${combo}`, 50, 80);

    requestAnimationFrame(gameLoop);
  }

  // キー入力判定
  window.addEventListener('keydown', e => {
    if(!gameRunning) return;

    const key = e.key.toUpperCase();
    const laneIndex = laneKeys.indexOf(key);
    if(laneIndex === -1) return;

    const judgeLineY = canvas.height - 150;

    let nearestNoteIndex = -1;
    let nearestDistance = 9999;
    for(let i=0; i < notes.length; i++){
      if(notes[i].laneIndex !== laneIndex) continue;
      const dist = Math.abs(notes[i].y + 10 - judgeLineY);
      if(dist < nearestDistance){
        nearestDistance = dist;
        nearestNoteIndex = i;
      }
    }

    if(nearestNoteIndex === -1){
      combo = 0;
      missSound.play();
      return;
    }

    const judge = getJudge(nearestDistance);

    if(judge === 'Miss'){
      combo = 0;
      missSound.play();
      return;
    }

    notes.splice(nearestNoteIndex, 1);
    combo++;
    score += (judge === 'Perfect' ? 300 : judge === 'Great' ? 200 : 100);

    if(judge === 'Perfect'){
      perfectSound.play();
    } else if(judge === 'Great'){
      greatSound.play();
    } else if(judge === 'Good'){
      goodSound.play();
    }

    tapSound.play();
  });

  // 曲終了時処理
  bgm.addEventListener('ended', () => {
    gameRunning = false;
    clearInterval(spawnInterval);
    gameScreen.style.display = 'none';
    resultScreen.style.display = 'flex';

    document.getElementById('finalScore').innerText = `スコア: ${score}`;
    let rank;
    if(score > 2500) rank = 'S';
    else if(score > 1500) rank = 'A';
    else if(score > 800) rank = 'B';
    else rank = 'C';
    document.getElementById('finalRank').innerText = `ランク: ${rank}`;
  });

  // リトライ
  retryButton.onclick = () => {
    resultScreen.style.display = 'none';
    startGame();
  };

  // タイトル戻る
  backButton.onclick = () => {
    gameRunning = false;
    clearInterval(spawnInterval);
    bgm.pause();
    gameScreen.style.display = 'none';
    titleScreen.style.display = 'flex';
  };

  resultBackButton.onclick = () => {
    resultScreen.style.display = 'none';
    titleScreen.style.display = 'flex';
  };

  // スタートボタン押下
  startGameButton.onclick = () => {
    startGame();
  };

  // 初期セットアップ
  setupSongList();
});
