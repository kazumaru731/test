// 参加者リスト
let participants = [];

// DOM要素
const participantNameInput = document.getElementById('participant-name');
const addParticipantBtn = document.getElementById('add-participant');
const participantsList = document.getElementById('participants-list');
const startBtn = document.getElementById('start-amidakuji');
const canvasSection = document.getElementById('canvas-section');
const canvas = document.getElementById('amidakuji-canvas');
const ctx = canvas.getContext('2d');
const resultsDiv = document.getElementById('results');
const resetBtn = document.getElementById('reset');

// イベントリスナー
addParticipantBtn.addEventListener('click', addParticipant);
participantNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addParticipant();
});
startBtn.addEventListener('click', startAmidakuji);
resetBtn.addEventListener('click', reset);

// 参加者を追加
function addParticipant() {
    const name = participantNameInput.value.trim();
    if (name && !participants.includes(name)) {
        participants.push(name);
        participantNameInput.value = '';
        renderParticipants();
    }
}

// 参加者リストを描画
function renderParticipants() {
    participantsList.innerHTML = '';
    participants.forEach((name, index) => {
        const tag = document.createElement('div');
        tag.className = 'participant-tag';
        tag.innerHTML = `
            <span>${name}</span>
            <span class="remove" onclick="removeParticipant(${index})">×</span>
        `;
        participantsList.appendChild(tag);
    });
}

// 参加者を削除
function removeParticipant(index) {
    participants.splice(index, 1);
    renderParticipants();
}

// 完全順列（derangement）を生成：自分以外の人に必ず当たる
function generateDerangement(arr) {
    if (arr.length < 2) {
        return null; // 2人未満では完全順列は不可能
    }

    let attempts = 0;
    const maxAttempts = 1000;

    while (attempts < maxAttempts) {
        // Fisher-Yatesシャッフル
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // 完全順列かチェック（誰も自分自身に当たっていない）
        let isDerangement = true;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === shuffled[i]) {
                isDerangement = false;
                break;
            }
        }

        if (isDerangement) {
            return shuffled;
        }

        attempts++;
    }

    return null; // 完全順列が見つからなかった場合
}

// あみだくじを開始
function startAmidakuji() {
    if (participants.length < 2) {
        alert('参加者は2人以上必要です');
        return;
    }

    // 完全順列を生成
    const assignments = generateDerangement(participants);

    if (!assignments) {
        alert('割り当ての生成に失敗しました。もう一度お試しください。');
        return;
    }

    // キャンバスセクションを表示
    document.querySelector('.input-section').style.display = 'none';
    canvasSection.style.display = 'block';

    // あみだくじを描画
    drawAmidakuji(participants, assignments);

    // 結果を表示
    displayResults(participants, assignments);
}

// あみだくじを描画
function drawAmidakuji(start, end) {
    const n = start.length;
    const canvasWidth = Math.max(600, n * 120);
    const canvasHeight = 500;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const padding = 80;
    const lineSpacing = (canvasWidth - 2 * padding) / (n - 1);
    const verticalStart = 80;
    const verticalEnd = canvasHeight - 80;
    const horizontalLines = 8; // 横線の数

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';

    // 縦線を描画
    for (let i = 0; i < n; i++) {
        const x = padding + i * lineSpacing;

        // 上部の名前
        ctx.fillStyle = '#667eea';
        ctx.fillText(start[i], x, verticalStart - 30);

        // 縦線
        ctx.beginPath();
        ctx.moveTo(x, verticalStart);
        ctx.lineTo(x, verticalEnd);
        ctx.stroke();

        // 下部の名前
        ctx.fillStyle = '#764ba2';
        ctx.fillText(end[i], x, verticalEnd + 30);
    }

    // 横線をランダムに描画
    const horizontalSpacing = (verticalEnd - verticalStart) / (horizontalLines + 1);

    for (let i = 1; i <= horizontalLines; i++) {
        const y = verticalStart + i * horizontalSpacing;

        // ランダムに横線を配置
        const startCol = Math.floor(Math.random() * (n - 1));
        const x1 = padding + startCol * lineSpacing;
        const x2 = padding + (startCol + 1) * lineSpacing;

        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
    }

    // 追加の横線でより複雑に
    for (let i = 1; i <= horizontalLines; i++) {
        const y = verticalStart + i * horizontalSpacing + horizontalSpacing / 2;

        const startCol = Math.floor(Math.random() * (n - 1));
        const x1 = padding + startCol * lineSpacing;
        const x2 = padding + (startCol + 1) * lineSpacing;

        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
    }
}

// 結果を表示
function displayResults(start, end) {
    resultsDiv.innerHTML = '<h3>結果</h3>';

    for (let i = 0; i < start.length; i++) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.textContent = `${start[i]} → ${end[i]}`;
        resultsDiv.appendChild(resultItem);
    }

    // 検証メッセージ
    const verification = document.createElement('p');
    verification.style.marginTop = '20px';
    verification.style.color = '#2ecc71';
    verification.style.fontWeight = 'bold';
    verification.textContent = '✓ 全員が自分以外の人に当たりました！';
    resultsDiv.appendChild(verification);
}

// リセット
function reset() {
    document.querySelector('.input-section').style.display = 'block';
    canvasSection.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resultsDiv.innerHTML = '';
}
