const RANDOM_PARAGRAPH_URL = '/get-paragraph';
const textDisplayElement = document.getElementById('textDisplay');
const textInputElement = document.getElementById('textInput');
const timerElement = document.getElementById('timer');
const accuracyElement = document.getElementById('accuracy');
const wpmElement = document.getElementById('wpm')

let timerInterval;
let startTime;
let maxDuration = 60;
let isTimerRunning = false;
let totalTyped = 0;
let correctTyped = 0;

document.querySelectorAll('.duration-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));

    button.classList.add('active');

    maxDuration = parseInt(button.getAttribute('data-duration'));
    textInputElement.disabled = false;
  });
});

document.querySelector('.duration-btn[data-duration="60"]').classList.add('active');

textInputElement.addEventListener('input', () => {
    const arrayText = textDisplayElement.querySelectorAll('span');
    const arrayValue = textInputElement.value.split('');

    if(!isTimerRunning) {
        isTimerRunning = true;
        startTime = new Date();
        startTimer();
    }

    let correctNow = 0;

    arrayText.forEach((characterSpan, index) => {
        const character = arrayValue[index];
        if (character == null) {
            characterSpan.classList.remove('correct', 'incorrect');
        } else if (character === characterSpan.innerText) {
            characterSpan.classList.add('correct');
            characterSpan.classList.remove('incorrect');
            correctNow++;
        } else {
            characterSpan.classList.add('incorrect');
            characterSpan.classList.remove('correct');
            // correct = false;
        }
    });

    totalTyped += arrayValue.length - (parseInt(textInputElement.dataset.prevLength) || 0);
    correctTyped += correctNow - (parseInt(textInputElement.dataset.prevCorrect) || 0);

    textInputElement.dataset.prevLength = arrayValue.length;
    textInputElement.dataset.prevCorrect = correctNow;

    const accuracy = totalTyped > 0 ? Math.round((correctTyped / totalTyped) * 100) : 0;
    accuracyElement.innerText = accuracy

    const elapsed = getTimerTime()
    const elapsedMinute = elapsed > 0 ? elapsed / 60 : 1 / 60;
    const wpm = totalTyped > 0 ? Math.round((correctTyped / 5) / elapsedMinute) : 0;
    wpmElement.innerText = wpm

    if (arrayValue.length === arrayText.length) {
        renderNewText();
    }
});

function getRandomText() {
    return fetch(RANDOM_PARAGRAPH_URL)
        .then(response => response.json())
        .then(data => data.content)
        .catch(() => {
            return "Error: Couldn't fetch Text"
        })
}

async function renderNewText() {
    const text = await getRandomText();
    textDisplayElement.innerHTML = '';
    text.split('').forEach(character => {
        const characterSpan = document.createElement('span');
        characterSpan.innerText = character;
        textDisplayElement.appendChild(characterSpan);
    });

    textInputElement.value = '';
    textInputElement.dataset.prevLength = 0;
    textInputElement.dataset.prevCorrect = 0;
    textInputElement.disabled = false;
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = getTimerTime();
        const remaining = maxDuration - elapsed;
        timerElement.innerText = remaining;

        if(remaining <= 0){
            endTest();
        }
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

    alert(`Test Complete! \nWPM: ${wpm}\tAccuracy: ${accuracy}%`)
}

document.addEventListener('DOMContentLoaded', () => {
  renderNewText();
});