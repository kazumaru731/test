// 参加者リスト
let participants = [];
let assignments = [];
let horizontalLinesData = [];
let canvasConfig = {};

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
const choiceButtonsDiv = document.getElementById('choice-buttons');
const selectInstruction = document.querySelector('.select-instruction');

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

// あみだくじをたどって結果を計算
function traceAmidakuji(startCol, lines, numCols) {
    let currentCol = startCol;

    for (const line of lines) {
        if (currentCol === line.startCol) {
            currentCol = line.endCol;
        } else if (currentCol === line.endCol) {
            currentCol = line.startCol;
        }
    }

    return currentCol;
}

// 完全順列になるあみだくじを生成
function generateDerangementAmidakuji(n) {
    const maxAttempts = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        // 横線をランダムに生成
        const lines = [];
        const horizontalLinesCount = Math.max(10, n * 2);

        for (let i = 0; i < horizontalLinesCount; i++) {
            const startCol = Math.floor(Math.random() * (n - 1));
            lines.push({
                startCol,
                endCol: startCol + 1
            });
        }

        // 各列からたどった結果を計算
        const results = [];
        for (let i = 0; i < n; i++) {
            results[i] = traceAmidakuji(i, lines, n);
        }

        // 完全順列かチェック（誰も自分自身に当たっていない）
        let isDerangement = true;
        for (let i = 0; i < n; i++) {
            if (i === results[i]) {
                isDerangement = false;
                break;
            }
        }

        if (isDerangement) {
            // 完全順列が見つかった
            return { lines, results };
        }

        attempts++;
    }

    return null;
}

// レスポンシブ対応のキャンバスサイズを計算
function calculateCanvasSize(n) {
    const containerWidth = document.querySelector('.container').offsetWidth;
    const maxWidth = Math.min(containerWidth - 40, 900);

    // スマホ対応
    const isMobile = window.innerWidth <= 768;
    const canvasWidth = isMobile ? maxWidth : Math.max(600, n * 120);
    const canvasHeight = isMobile ? 400 : 500;

    return { width: canvasWidth, height: canvasHeight };
}

// あみだくじを開始
function startAmidakuji() {
    if (participants.length < 2) {
        alert('参加者は2人以上必要です');
        return;
    }

    const amidakujiData = generateDerangementAmidakuji(participants.length);

    if (!amidakujiData) {
        alert('あみだくじの生成に失敗しました。もう一度お試しください。');
        return;
    }

    // 結果のマッピングを保存
    assignments = amidakujiData.results;

    document.querySelector('.input-section').style.display = 'none';
    canvasSection.style.display = 'block';

    drawAmidakuji(participants, amidakujiData.lines);
    createChoiceButtons();
}

// 選択ボタンを生成
function createChoiceButtons() {
    choiceButtonsDiv.innerHTML = '';
    selectInstruction.style.display = 'block';
    resultsDiv.style.display = 'none';

    participants.forEach((name, index) => {
        const button = document.createElement('button');
        button.className = 'choice-button';
        button.textContent = name;
        button.onclick = () => startAnimation(index);
        choiceButtonsDiv.appendChild(button);
    });
}

// あみだくじを描画
function drawAmidakuji(start, lines) {
    const n = start.length;
    const size = calculateCanvasSize(n);
    canvas.width = size.width;
    canvas.height = size.height;

    const padding = 60;
    const lineSpacing = (size.width - 2 * padding) / (n - 1);
    const verticalStart = 60;
    const verticalEnd = size.height - 60;

    // 設定を保存
    canvasConfig = {
        n,
        padding,
        lineSpacing,
        verticalStart,
        verticalEnd
    };

    // 横線にY座標を割り当て
    horizontalLinesData = [];
    const horizontalSpacing = (verticalEnd - verticalStart) / (lines.length + 1);

    lines.forEach((line, index) => {
        horizontalLinesData.push({
            y: verticalStart + (index + 1) * horizontalSpacing,
            startCol: line.startCol,
            endCol: line.endCol
        });
    });

    // 描画
    redrawCanvas(start);
}

// キャンバスを再描画
function redrawCanvas(start, highlightCol = -1, currentY = -1) {
    const { n, padding, lineSpacing, verticalStart, verticalEnd } = canvasConfig;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, verticalStart);
        ctx.lineTo(x, verticalEnd);
        ctx.stroke();

        // 下部の名前（上部と同じ順序）
        ctx.fillStyle = '#764ba2';
        ctx.fillText(start[i], x, verticalEnd + 30);
    }

    // 横線を描画
    horizontalLinesData.forEach(line => {
        const x1 = padding + line.startCol * lineSpacing;
        const x2 = padding + line.endCol * lineSpacing;

        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, line.y);
        ctx.lineTo(x2, line.y);
        ctx.stroke();
    });

    // 現在の位置をハイライト
    if (highlightCol >= 0 && currentY >= 0) {
        const x = padding + highlightCol * lineSpacing;
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(x, currentY, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// アニメーション開始
function startAnimation(startIndex) {
    // ボタンを無効化
    const buttons = document.querySelectorAll('.choice-button');
    buttons.forEach(btn => btn.disabled = true);
    selectInstruction.style.display = 'none';

    let currentCol = startIndex;
    let currentY = canvasConfig.verticalStart;
    const speed = 3;
    let lineIndex = 0;

    function animate() {
        const { padding, lineSpacing, verticalStart, verticalEnd } = canvasConfig;

        // 現在の位置を更新
        currentY += speed;

        // 横線との交差チェック
        while (lineIndex < horizontalLinesData.length) {
            const line = horizontalLinesData[lineIndex];

            if (Math.abs(currentY - line.y) < speed) {
                // 横線に到達
                if (currentCol === line.startCol) {
                    currentCol = line.endCol;
                } else if (currentCol === line.endCol) {
                    currentCol = line.startCol;
                }
                lineIndex++;
                break;
            } else if (currentY < line.y) {
                break;
            } else {
                lineIndex++;
            }
        }

        // 再描画
        redrawCanvas(participants, currentCol, currentY);

        // アニメーション継続判定
        if (currentY < verticalEnd) {
            requestAnimationFrame(animate);
        } else {
            // アニメーション終了
            showResult(startIndex, currentCol);
        }
    }

    animate();
}

// 結果を表示
function showResult(startIndex, endIndex) {
    resultsDiv.style.display = 'block';
    const resultName = participants[endIndex];
    resultsDiv.innerHTML = `
        <h3>結果</h3>
        <div class="result-item" style="font-size: 24px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            ${participants[startIndex]} → ${resultName}
        </div>
    `;

    // 検証
    if (participants[startIndex] === resultName) {
        resultsDiv.innerHTML += `
            <div class="error">エラー: 同じ人に当たっています。もう一度やり直してください。</div>
        `;
    }

    // ボタンを有効化
    const buttons = document.querySelectorAll('.choice-button');
    buttons.forEach(btn => btn.disabled = false);
    selectInstruction.style.display = 'block';
    selectInstruction.textContent = 'もう一度選ぶ、またはやり直してください';
}

// リセット
function reset() {
    document.querySelector('.input-section').style.display = 'block';
    canvasSection.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resultsDiv.innerHTML = '';
    choiceButtonsDiv.innerHTML = '';
    selectInstruction.style.display = 'block';
    selectInstruction.textContent = 'クジを選んでください';
    horizontalLinesData = [];
    assignments = [];
}
