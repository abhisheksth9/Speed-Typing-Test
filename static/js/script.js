// Typing Test Logic
const RANDOM_PARAGRAPH_URL = '/get-paragraph';
const textDisplayElement = document.getElementById('textDisplay');
const textInputElement = document.getElementById('textInput');
const timerElement = document.getElementById('timer');
const accuracyElement = document.getElementById('accuracy');
const wpmElement = document.getElementById('wpm');

let timerInterval, startTime;
let maxDuration = 60;
let isTimerRunning = false;
let totalTyped = 0;
let correctTyped = 0;

// Duration Button Setup
document.querySelectorAll('.duration-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        maxDuration = parseInt(button.getAttribute('data-duration'));
        textInputElement.disabled = false;
    });
});
document.querySelector('.duration-btn[data-duration="60"]')?.classList.add('active');

// Typing Input Handling
textInputElement?.addEventListener('input', () => {
    const arrayText = textDisplayElement.querySelectorAll('span');
    const arrayValue = textInputElement.value.split('');

    if (!isTimerRunning) {
        isTimerRunning = true;
        startTime = new Date();
        startTimer();
    }

    let correctNow = 0;
    arrayText.forEach((characterSpan, index) => {
        const char = arrayValue[index];
        if (char == null) {
            characterSpan.classList.remove('correct', 'incorrect');
        } else if (char === characterSpan.innerText) {
            characterSpan.classList.add('correct');
            characterSpan.classList.remove('incorrect');
            correctNow++;
        } else {
            characterSpan.classList.add('incorrect');
            characterSpan.classList.remove('correct');
        }
    });

    const prevLen = parseInt(textInputElement.dataset.prevLength) || 0;
    const prevCorrect = parseInt(textInputElement.dataset.prevCorrect) || 0;

    totalTyped += arrayValue.length - prevLen;
    correctTyped += correctNow - prevCorrect;

    textInputElement.dataset.prevLength = arrayValue.length;
    textInputElement.dataset.prevCorrect = correctNow;

    const accuracy = totalTyped > 0 ? Math.round((correctTyped / totalTyped) * 100) : 0;
    accuracyElement.innerText = accuracy;

    const elapsed = getTimerTime();
    const elapsedMinute = elapsed > 0 ? elapsed / 60 : 1 / 60;
    const wpm = totalTyped > 0 ? Math.round((correctTyped / 5) / elapsedMinute) : 0;
    wpmElement.innerText = wpm;

    if (arrayValue.length === arrayText.length) {
        renderNewText();
    }
});

// Fetch Random Text
function getRandomText() {
    return fetch(RANDOM_PARAGRAPH_URL)
        .then(res => res.json())
        .then(data => data.content)
        .catch(() => "Error: Couldn't fetch text");
}

// Render New Text
async function renderNewText() {
    const text = await getRandomText();
    textDisplayElement.innerHTML = '';
    text.split('').forEach(char => {
        const span = document.createElement('span');
        span.innerText = char;
        textDisplayElement.appendChild(span);
    });

    textInputElement.value = '';
    textInputElement.dataset.prevLength = 0;
    textInputElement.dataset.prevCorrect = 0;
    textInputElement.disabled = false;
}

// Save WPM to Server
function saveScoreToServer(score) {
    fetch('/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `score=${encodeURIComponent(score)}`
    })
        .then(res => res.json())
        .then(data => console.log(data.message))
        .catch(err => console.error('Error saving score:', err));
}

// Timer
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = getTimerTime();
        const remaining = maxDuration - elapsed;
        timerElement.innerText = remaining;

        if (remaining <= 0) endTest();
    }, 1000);
}
function getTimerTime() {
    return Math.floor((new Date() - startTime) / 1000);
}
function endTest() {
    clearInterval(timerInterval);
    textInputElement.disabled = true;

    const elapsedMinute = maxDuration / 60;
    const wpm = totalTyped > 0 ? Math.round((correctTyped / 5) / elapsedMinute) : 0;
    const accuracy = totalTyped > 0 ? Math.round((correctTyped / totalTyped) * 100) : 0;

    timerElement.innerText = '0';
    wpmElement.innerText = wpm;
    accuracyElement.innerText = accuracy;

    saveScoreToServer(wpm);

    const modalContainer = document.getElementById('modal-container');
    const closeBtn = document.getElementById('close-btn')

    document.getElementById('modal-wpm').innerText = `WPM: ${wpm}`;
    document.getElementById('modal-accuracy').innerText = `Accuracy: ${accuracy}%`;

    modalContainer.style.display = 'flex';
    
    closeBtn.addEventListener('click', function(){
        modalContainer.style.display = 'none';
        window.location.reload();
    })

    window.addEventListener('click', function(e){
        if (e.target === modalContainer){
            modalContainer.style.display = 'none';
            window.location.reload();
        }
    })
}

// Chart Rendering Logic
let chartInstance = null;

function renderWpmChart() {
    const canvas = document.getElementById('wpmChart');
    if (!canvas) return;

    fetch('/user/wpm-scores')
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) return;

            const ctx = canvas.getContext('2d');
            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map((_, i) => `${i + 1}`),
                    datasets: [{
                        label: 'WPM Progress',
                        data: data.map(point => point.y),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'WPM'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Attempts'
                            }
                        }
                    }
                }
            });
        })
        .catch(err => console.error("Error loading WPM data:", err));
}

document.addEventListener('DOMContentLoaded', () => {
    renderNewText();
    renderWpmChart();
});