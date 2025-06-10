const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let noteY = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ノーツ（白い四角）を描画
    ctx.fillStyle = 'white';
    ctx.fillRect(canvas.width / 2 - 25, noteY, 50, 50);

    // ノーツを落とす
    noteY += 5;
    if (noteY > canvas.height) {
        noteY = 0; // 画面下まで行ったらリセット
    }

    requestAnimationFrame(draw);
}

draw();
