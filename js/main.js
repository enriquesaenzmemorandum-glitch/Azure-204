import { StorageManager } from './storage.js';
import { QuizEngine } from './engine.js';
import { SyncManager } from './sync.js';

let questions = [];
let engine = null;
let currentFilteredList = [];
let currentIndex = 0;

const state = {
    answers: {},
    settings: {
        currentTopic: 'all',
        currentFilter: 'all',
        examConfig: { count: 25, time: 60, topics: ['all'] }
    }
};

// DOM Elements
const elements = {
    container: document.getElementById('question-container'),
    progressBar: document.getElementById('progress-fill'),
    totalCount: document.getElementById('total-count'),
    answeredCount: document.getElementById('answered-count'),
    correctCount: document.getElementById('correct-count'),
    score: document.getElementById('score-value'),
    timerContainer: document.getElementById('timer-container'),
    timerValue: document.getElementById('timer-value'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    configModal: document.getElementById('exam-modal'),
    statsCanvas: document.getElementById('stats-canvas'),
    filterSelect: document.getElementById('filter-select'),
    topicSelect: document.getElementById('topic-select'),
    progressText: document.getElementById('progress-text'),
    userModal: document.getElementById('user-modal'),
    userIdInput: document.getElementById('user-id-input'),
    saveUserBtn: document.getElementById('save-user-btn'),
    skipUserBtn: document.getElementById('skip-user-btn'),
    syncIcon: document.getElementById('sync-icon'),
    syncText: document.getElementById('sync-text'),
    userBanner: document.getElementById('user-banner'),
    displayUserId: document.getElementById('display-user-id'),
    switchUserBtn: document.getElementById('switch-user-btn')
};

async function init() {
    try {
        const response = await fetch('data/questions.json');
        questions = await response.json();
        
        state.answers = StorageManager.getAnswers();
        state.settings = StorageManager.getSettings();
        
        // --- Cloud Sync: Identificación de Usuario ---
        const storedUserId = StorageManager.getUserId();
        if (!storedUserId) {
            elements.userBanner.style.display = 'none';
            elements.userModal.classList.add('active');
        } else {
            showWelcomeMessage(storedUserId);
            await performInitialSync(storedUserId);
        }
        
        engine = new QuizEngine(questions, state.answers, state.settings);
        
        setupEventListeners();
        applyFilters();
        updateUI();
    } catch (error) {
        console.error("Initialization failed:", error);
        alert("Error cargando datos. Asegúrate de ejecutar la app con un servidor local.");
    }
}

function setupEventListeners() {
    // Navigation
    elements.prevBtn.onclick = () => { if (currentIndex > 0) { currentIndex--; renderQuestion(); } };
    elements.nextBtn.onclick = () => { if (currentIndex < currentFilteredList.length - 1) { currentIndex++; renderQuestion(); } };
    
    // Filters (Dropdowns)
    elements.filterSelect.onchange = (e) => {
        state.settings.currentFilter = e.target.value;
        currentIndex = 0;
        applyFilters();
    };

    elements.topicSelect.onchange = (e) => {
        state.settings.currentTopic = e.target.value;
        currentIndex = 0;
        applyFilters();
    };

    // Backup
    document.getElementById('export-btn').onclick = () => StorageManager.exportData();
    document.getElementById('import-input').onchange = async (e) => {
        if (e.target.files.length > 0) {
            await StorageManager.importData(e.target.files[0]);
            window.location.reload();
        }
    };

    // Exam Mode
    document.getElementById('exam-start-btn').onclick = () => elements.configModal.classList.add('active');
    document.getElementById('cancel-exam').onclick = () => elements.configModal.classList.remove('active');
    document.getElementById('confirm-exam').onclick = startExamFlow;
    
    document.getElementById('reset-btn').onclick = () => {
        if (confirm('¿Reiniciar todo el progreso?')) StorageManager.resetAll();
    };

    // User Identity Events
    elements.saveUserBtn.onclick = async () => {
        const id = elements.userIdInput.value.trim();
        if (!id) return alert('Introduce un identificador');
        StorageManager.saveUserId(id);
        elements.userModal.classList.remove('active');
        await performInitialSync(id);
    };

    elements.skipUserBtn.onclick = () => {
        elements.userModal.classList.remove('active');
    };

    elements.switchUserBtn.onclick = () => {
        if (confirm('¿Quieres cambiar de usuario? Se cerrará la sesión actual y se limpiará el progreso local.')) {
            StorageManager.logoutUser();
            window.location.reload();
        }
    };

    // Listen to sync status
    window.addEventListener('syncStatus', (e) => {
        const { success } = e.detail;
        elements.syncIcon.innerText = success ? '✅' : '⚠️';
        elements.syncText.innerText = success ? 'Nube' : 'Error Sync';
    });
}

async function performInitialSync(userId) {
    elements.syncText.innerText = 'Sincronizando...';
    const cloudData = await SyncManager.fetchProgress(userId);
    if (cloudData) {
        // La nube manda según requerimiento del usuario
        state.answers = cloudData.answers || {};
        state.settings = cloudData.settings || state.settings;
        StorageManager.saveAnswers(state.answers, true); // suppressSync = true
        StorageManager.saveSettings(state.settings, true);
        elements.syncIcon.innerText = '✅';
        elements.syncText.innerText = 'Nube';
    } else {
        elements.syncText.innerText = 'Local';
    }
}

function showWelcomeMessage(userId) {
    if (userId) {
        elements.displayUserId.innerText = userId;
        elements.userBanner.style.display = 'flex';
    } else {
        elements.userBanner.style.display = 'none';
    }
}

function applyFilters() {
    currentFilteredList = engine.getFilteredQuestions(state.settings.currentFilter, state.settings.currentTopic);
    renderQuestion();
    updateUI();
}

function renderQuestion() {
    if (currentFilteredList.length === 0) {
        elements.container.innerHTML = `
            <div class="card" style="text-align:center">
                <h2>🎉 ¡Filtro completado!</h2>
                <p>No hay preguntas que coincidan con los criterios actuales.</p>
            </div>`;
        return;
    }

    const q = currentFilteredList[currentIndex];
    const userAnswer = state.answers[q.id];
    const isAnswered = !!userAnswer;

    let optionsHtml = q.options.map(opt => {
        const letter = opt.charAt(0);
        let statusClass = '';
        if (isAnswered) {
            if (letter === q.correct) statusClass = 'correct';
            else if (letter === userAnswer) statusClass = 'incorrect';
        } else if (state.selectedOption === letter) {
            statusClass = 'selected';
        }

        return `
            <div class="option-item ${statusClass}" onclick="handleOptionSelect(${q.id}, '${letter}')">
                ${opt}
            </div>
        `;
    }).join('');

    let feedbackHtml = '';
    if (isAnswered) {
        const isCorrect = userAnswer === q.correct;
        feedbackHtml = `
            <div class="feedback-box">
                <div class="feedback-title" style="color: ${isCorrect ? 'var(--success)' : 'var(--error)'}">
                    ${isCorrect ? '✨ ¡Correcto!' : '❌ Incorrecto'}
                </div>
                <p class="feedback-explanation">💡 ${q.explanation}</p>
                <div style="margin-top:10px; font-size: 0.8rem;">
                    Dificultad: <span style="text-transform: capitalize;">${q.difficulty}</span>
                </div>
                ${q.reference ? `<a href="${q.reference}" target="_blank" class="reference-link">🔗 Leer más en Microsoft Learn</a>` : '<span class="text-muted">No reference link available.</span>'}
            </div>
        `;
    }

    elements.container.innerHTML = `
        <div class="question-view">
            <div class="card">
                <span class="topic-tag">${q.topic}</span>
                <div class="question-text">${q.text}</div>
                <div class="options-list">${optionsHtml}</div>
                ${feedbackHtml}
            </div>
        </div>
    `;

    elements.prevBtn.disabled = currentIndex === 0;
    elements.nextBtn.disabled = currentIndex === currentFilteredList.length - 1;
}

window.handleOptionSelect = (qId, letter) => {
    if (state.answers[qId]) return; // Already answered
    state.answers[qId] = letter;
    StorageManager.saveAnswers(state.answers);
    updateUI();
    renderQuestion();
};

function updateUI() {
    const stats = engine.calculateStats();
    elements.totalCount.innerText = currentFilteredList.length;
    elements.answeredCount.innerText = stats.answered;
    elements.correctCount.innerText = stats.correct;
    elements.score.innerText = `${stats.score}%`;
    elements.progressBar.style.width = `${stats.progress}%`;
    elements.progressText.innerText = `Has respondido ${stats.answered} de ${stats.total} preguntas`;
}

function startExamFlow() {
    const config = {
        count: document.getElementById('exam-count').value,
        time: document.getElementById('exam-time').value,
        topics: ['all'] // Simplified
    };
    
    elements.configModal.classList.remove('active');
    currentFilteredList = engine.startExam(config);
    currentIndex = 0;
    
    if (config.time !== 'unlimited') {
        startTimer();
    }
    
    renderQuestion();
    updateUI();
}

function startTimer() {
    elements.timerContainer.style.display = 'block';
    if (engine.examTimer) clearInterval(engine.examTimer);
    
    engine.examTimer = setInterval(() => {
        engine.examTimeLeft--;
        if (engine.examTimeLeft <= 0) {
            clearInterval(engine.examTimer);
            alert("⏰ Tiempo agotado. Fin del examen.");
            engine.stopExam();
        }
        
        const mins = Math.floor(engine.examTimeLeft / 60);
        const secs = engine.examTimeLeft % 60;
        elements.timerValue.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

window.onload = init;
