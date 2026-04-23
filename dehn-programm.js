const STRETCH_PROGRAMS = [
    {
        id: "unterkoerper-fokus",
        name: "Unterkörper Fokus",
        exercises: [
            { name: "Nacken & Schulter Kreisen", type: "bilateral" },
            { name: "Katze Kuh", type: "bilateral" },
            { name: "Vorbeuge im Stehen", type: "bilateral" },
            { name: "Tiefer Ausfallschritt", type: "unilateral" },
            { name: "Stehender Quadrizeps", type: "unilateral" },
            { name: "Vorbeuge im Sitzen", type: "bilateral" },
            { name: "Nadelöhr", type: "unilateral" },
            { name: "Baby/Käfer Haltung", type: "bilateral" },
            { name: "Kindes Haltung", type: "bilateral" },
        ],
    },
    // Weitere Programme einfach hier ergänzen
    // {
    //     id: "oberkoerper-fokus",
    //     name: "Oberkörper Fokus",
    //     exercises: [
    //         { name: "Brustdehnung", type: "bilateral" },
    //     ],
    // },
];

const DEFAULT_SETTINGS = {
    restSeconds: 6,
    bilateralSeconds: 50,
    unilateralSeconds: 45,
};

const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;
const currentTheme = localStorage.getItem("theme") || "dark";
if (currentTheme === "dark") {
    htmlElement.classList.add("dark");
} else {
    htmlElement.classList.remove("dark");
}

if (themeToggle) {
    themeToggle.addEventListener("click", function () {
        htmlElement.classList.toggle("dark");
        const theme = htmlElement.classList.contains("dark") ? "dark" : "light";
        localStorage.setItem("theme", theme);
    });
}

const programSelect = document.getElementById("programSelect");
const restInput = document.getElementById("restSeconds");
const bilateralInput = document.getElementById("bilateralSeconds");
const unilateralInput = document.getElementById("unilateralSeconds");

const totalDurationEl = document.getElementById("totalDuration");
const modalTotalDurationEl = document.getElementById("modalTotalDuration");
const modalTitleEl = document.getElementById("modalTitle");
const planListEl = document.getElementById("planList");

const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const resetButton = document.getElementById("resetButton");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const openPlanButton = document.getElementById("openPlanButton");
const statusPill = document.getElementById("statusPill");

const currentPhaseEl = document.getElementById("currentPhase");
const countdownEl = document.getElementById("countdown");
const progressBarEl = document.getElementById("progressBar");
const stepCounterEl = document.getElementById("stepCounter");

const planModal = document.getElementById("planModal");
const closeModalButton = document.getElementById("closeModalButton");
const modalBackdrop = document.getElementById("modalBackdrop");

let timerId = null;
let timeline = [];
let currentStepIndex = 0;
let secondsLeft = 0;
let isRunning = false;
let audioContext = null;
let controlsLocked = false;
let hasCompleted = false;

function sanitizeSeconds(value, fallback, min) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < min) {
        return fallback;
    }
    return parsed;
}

function getCurrentSettings() {
    return {
        restSeconds: sanitizeSeconds(restInput.value, DEFAULT_SETTINGS.restSeconds, 0),
        bilateralSeconds: sanitizeSeconds(bilateralInput.value, DEFAULT_SETTINGS.bilateralSeconds, 1),
        unilateralSeconds: sanitizeSeconds(unilateralInput.value, DEFAULT_SETTINGS.unilateralSeconds, 1),
    };
}

function getSelectedProgram() {
    return STRETCH_PROGRAMS.find((program) => program.id === programSelect.value) || STRETCH_PROGRAMS[0];
}

function buildTimeline(program, settings) {
    const steps = [];

    program.exercises.forEach((exercise, index) => {
        if (exercise.type === "unilateral") {
            const sideDuration = exercise.seconds || settings.unilateralSeconds;
            steps.push({
                type: "exercise",
                label: `${exercise.name} (Links)`,
                seconds: sideDuration,
                source: exercise.name,
            });
            if (settings.restSeconds > 0) {
                steps.push({
                    type: "pause",
                    label: "Pause",
                    seconds: settings.restSeconds,
                    source: "Pause",
                });
            }
            steps.push({
                type: "exercise",
                label: `${exercise.name} (Rechts)`,
                seconds: sideDuration,
                source: exercise.name,
            });
        } else {
            steps.push({
                type: "exercise",
                label: exercise.name,
                seconds: exercise.seconds || settings.bilateralSeconds,
                source: exercise.name,
            });
        }

        if (index < program.exercises.length - 1 && settings.restSeconds > 0) {
            steps.push({
                type: "pause",
                label: "Pause",
                seconds: settings.restSeconds,
                source: "Pause",
            });
        }
    });

    return steps;
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDurationCompact(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatSecondsBadge(seconds) {
    return `${seconds}s`;
}

function getTotalTimelineSeconds(steps) {
    return steps.reduce((sum, step) => sum + step.seconds, 0);
}

function playBeep() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        return;
    }

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.001;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    const now = audioContext.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    oscillator.start(now);
    oscillator.stop(now + 0.26);

}

function renderPlan(program, steps) {
    modalTitleEl.textContent = `Übungsplan: ${program.name}`;
    planListEl.innerHTML = "";

    const rows = [];
    for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index];
        if (step.type !== "exercise") {
            continue;
        }

        const nextStep = steps[index + 1];
        const pauseAfterSeconds = nextStep && nextStep.type === "pause" ? nextStep.seconds : null;
        rows.push({
            label: step.label,
            seconds: step.seconds,
            pauseAfterSeconds,
        });
    }

    rows.forEach((row, index) => {
        const item = document.createElement("li");
        item.className = "p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40";
        item.innerHTML = `
            <div class="flex items-center justify-between gap-4">
                <div>
                    <p class="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Übung</p>
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-base font-semibold text-gray-900 dark:text-gray-100">${index + 1}. ${row.label}</p>
                        ${row.pauseAfterSeconds ? `<span class="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Pause danach: ${formatSecondsBadge(row.pauseAfterSeconds)}</span>` : ""}
                    </div>
                </div>
                <p class="text-base font-bold text-cyan-700 dark:text-cyan-400">${formatTime(row.seconds)}</p>
            </div>
        `;
        planListEl.appendChild(item);
    });

    const totalSeconds = getTotalTimelineSeconds(steps);
    totalDurationEl.textContent = formatDurationCompact(totalSeconds);
    modalTotalDurationEl.textContent = formatDurationCompact(totalSeconds);
}

function updateProgress() {
    const totalSteps = timeline.length;
    const currentStep = timeline[currentStepIndex];

    if (!currentStep) {
        currentPhaseEl.textContent = "Noch nicht gestartet";
        countdownEl.textContent = "00:00";
        progressBarEl.style.width = "0%";
        stepCounterEl.textContent = `0 / ${totalSteps} Schritte`;
        return;
    }

    currentPhaseEl.textContent = currentStep.label;
    countdownEl.textContent = formatTime(secondsLeft);
    stepCounterEl.textContent = `${currentStepIndex + 1} / ${totalSteps} Schritte`;

    const stepProgress = ((currentStep.seconds - secondsLeft) / currentStep.seconds) * 100;
    progressBarEl.style.width = `${Math.max(0, Math.min(100, stepProgress))}%`;
}

function findNearestExerciseIndex(fromIndex, direction) {
    let index = fromIndex + direction;
    while (index >= 0 && index < timeline.length) {
        if (timeline[index].type === "exercise") {
            return index;
        }
        index += direction;
    }
    return -1;
}

function setInputsDisabled(disabled) {
    programSelect.disabled = disabled;
    restInput.disabled = disabled;
    bilateralInput.disabled = disabled;
    unilateralInput.disabled = disabled;

    [programSelect, restInput, bilateralInput, unilateralInput].forEach((element) => {
        if (disabled) {
            element.classList.add("opacity-60", "cursor-not-allowed");
        } else {
            element.classList.remove("opacity-60", "cursor-not-allowed");
        }
    });

}

function updateControlButtons() {
    const prevExerciseIndex = findNearestExerciseIndex(currentStepIndex, -1);
    const nextExerciseIndex = findNearestExerciseIndex(currentStepIndex, 1);

    stopButton.disabled = !isRunning;
    prevButton.disabled = isRunning || timeline.length === 0 || prevExerciseIndex === -1;
    nextButton.disabled = isRunning || timeline.length === 0 || nextExerciseIndex === -1;
    startButton.disabled = isRunning || timeline.length === 0;
    resetButton.disabled = false;
}

function stopTimer(statusText, unlockControls) {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }

    isRunning = false;
    statusPill.textContent = statusText;
    statusPill.className = "px-3 py-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium";
    if (unlockControls) {
        controlsLocked = false;
        setInputsDisabled(false);
    }
    updateControlButtons();
}

function resetTimelineState() {
    const settings = getCurrentSettings();
    const program = getSelectedProgram();
    timeline = buildTimeline(program, settings);
    currentStepIndex = 0;
    secondsLeft = timeline[0] ? timeline[0].seconds : 0;
    hasCompleted = false;
    renderPlan(program, timeline);
    updateProgress();
    updateControlButtons();
}

function advanceStep() {
    const finishedStep = timeline[currentStepIndex];
    if (finishedStep) {
        playBeep();
    }

    if (currentStepIndex >= timeline.length - 1) {
        hasCompleted = true;
        stopTimer("Fertig", true);
        currentPhaseEl.textContent = "Training abgeschlossen";
        countdownEl.textContent = "00:00";
        progressBarEl.style.width = "100%";
        stepCounterEl.textContent = `${timeline.length} / ${timeline.length} Schritte`;
        return;
    }

    currentStepIndex += 1;
    secondsLeft = timeline[currentStepIndex].seconds;
    updateProgress();
}

function startTimer() {
    if (isRunning || timeline.length === 0) {
        return;
    }

    const isFreshStart = !controlsLocked || hasCompleted;
    if (isFreshStart) {
        resetTimelineState();
    }

    controlsLocked = true;
    setInputsDisabled(true);
    isRunning = true;
    statusPill.textContent = "Läuft";
    statusPill.className = "px-3 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium";

    playBeep();
    updateProgress();
    updateControlButtons();

    timerId = setInterval(() => {
        secondsLeft -= 1;

        if (secondsLeft <= 0) {
            advanceStep();
            return;
        }

        updateProgress();
    }, 1000);
}

function pauseWorkout() {
    stopTimer("Pausiert", false);
}

function resetWorkout() {
    stopTimer("Bereit", true);
    resetTimelineState();
}

function moveStep(delta) {
    if (isRunning || timeline.length === 0) {
        return;
    }

    const direction = delta < 0 ? -1 : 1;
    const target = findNearestExerciseIndex(currentStepIndex, direction);
    if (target === -1 || target === currentStepIndex) {
        return;
    }

    currentStepIndex = target;
    secondsLeft = timeline[currentStepIndex].seconds;
    hasCompleted = false;
    controlsLocked = true;
    setInputsDisabled(true);
    statusPill.textContent = "Pausiert";
    statusPill.className = "px-3 py-2 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-sm font-medium";
    updateProgress();
    updateControlButtons();
}

function syncSettingsFromInputs() {
    const settings = getCurrentSettings();
    restInput.value = settings.restSeconds;
    bilateralInput.value = settings.bilateralSeconds;
    unilateralInput.value = settings.unilateralSeconds;
}

function openModal() {
    planModal.classList.remove("hidden");
}

function closeModal() {
    planModal.classList.add("hidden");
}

function initializeProgramOptions() {
    STRETCH_PROGRAMS.forEach((program) => {
        const option = document.createElement("option");
        option.value = program.id;
        option.textContent = program.name;
        programSelect.appendChild(option);
    });
}

function refreshConfiguration() {
    if (isRunning || controlsLocked) {
        return;
    }
    syncSettingsFromInputs();
    resetTimelineState();
}

initializeProgramOptions();
programSelect.value = STRETCH_PROGRAMS[0].id;
restInput.value = DEFAULT_SETTINGS.restSeconds;
bilateralInput.value = DEFAULT_SETTINGS.bilateralSeconds;
unilateralInput.value = DEFAULT_SETTINGS.unilateralSeconds;
resetTimelineState();
updateControlButtons();

startButton.addEventListener("click", startTimer);
stopButton.addEventListener("click", pauseWorkout);
resetButton.addEventListener("click", resetWorkout);
prevButton.addEventListener("click", () => moveStep(-1));
nextButton.addEventListener("click", () => moveStep(1));
openPlanButton.addEventListener("click", openModal);
closeModalButton.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

[programSelect, restInput, bilateralInput, unilateralInput].forEach((element) => {
    element.addEventListener("input", refreshConfiguration);
    element.addEventListener("change", refreshConfiguration);
});

window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeModal();
    }
});
