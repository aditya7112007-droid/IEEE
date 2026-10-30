/* DOM events and rendering are kept separate from the timer state machine. */
'use strict';
(() => {
  const T = window.FocusTimer;
  const KEY = 'focusroom.v1';
  const $ = id => document.getElementById(id);
  let storageAvailable = true;
  let state;
  try { state = T.restore(JSON.parse(localStorage.getItem(KEY))); }
  catch (_) { state = T.fresh(); /* A malformed saved value is safe to discard. */ }
  let audioContext;
  let toastTimeout;
  let lastDay = '';
  let lastClock = '';
  const labels = { focus: 'Focus', short: 'Short break', long: 'Long break' };
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
    catch (_) { storageAvailable = false; }
    $('storageWarning').hidden = storageAvailable;
  }
  function toast(message, duration = 5000) {
    clearTimeout(toastTimeout);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimeout = setTimeout(() => { $('toast').hidden = true; }, duration);
  }
  function unlockAudio() {
    if (!state.settings.sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext ||= new Audio();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch (_) { /* The visual session alert always remains available. */ }
  }
  function chime() {
    if (!state.settings.sound || !audioContext || audioContext.state !== 'running') return;
    try {
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const at = audioContext.currentTime + index * .18;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(.12, at + .03);
        gain.gain.exponentialRampToValueAtTime(.001, at + .75);
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.start(at); oscillator.stop(at + .8);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch (_) { /* Autoplay policies may block audio after a restored tab. */ }
  }
  function updateClock() {
    const text = T.format(T.remaining(state));
    if (lastClock !== text) {
      const [minutes, seconds] = text.split(':');
      $('clock').innerHTML = `${minutes}<span>:</span>${seconds}`;
      $('clock').setAttribute('aria-label', `${Number(minutes)} minutes ${Number(seconds)} seconds remaining`);
      lastClock = text;
    }
    document.title = `${text} · ${labels[state.mode]} — Focusroom`;
  }
  function renderStats() {
    const key = T.dayKey(); lastDay = key;
    const today = state.history[key] || { sessions: 0, minutes: 0 };
    $('dateLabel').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase() + ' · MAKE TIME FOR YOU';
    $('sessionsStat').textContent = today.sessions;
    $('minutesStat').textContent = today.minutes;
    $('sessionsCaption').textContent = today.sessions ? 'Look at you, showing up.' : 'Your first win is waiting.';
    $('goalFraction').textContent = `${today.sessions} / ${state.settings.goal}`;
    const percentage = Math.min(100, Math.round(today.sessions / state.settings.goal * 100));
    $('goalPercent').innerHTML = `${percentage}<span>%</span>`;
    $('goalFill').style.width = percentage + '%';
    $('goalTrack').setAttribute('aria-valuenow', percentage);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - i);
      days.push({ date, count: state.history[T.dayKey(date)]?.sessions || 0 });
    }
    const max = Math.max(state.settings.goal, ...days.map(d => d.count));
    $('weekChart').replaceChildren();
    for (const { date, count } of days) {
      const column = document.createElement('div');
      const isToday = T.dayKey(date) === key;
      column.className = 'day-bar' + (isToday ? ' today' : '');
      const description = `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}: ${count} completed focus sessions`;
      column.title = description; column.setAttribute('aria-label', description);
      const bar = document.createElement('div'); bar.className = 'bar';
      bar.style.height = `${Math.max(3, count / max * 55)}px`;
      const label = document.createElement('span');
      label.textContent = date.toLocaleDateString(undefined, { weekday: 'narrow' });
      column.append(bar, label); $('weekChart').append(column);
    }
  }
  function renderTasks() {
    $('taskList').replaceChildren();
    for (const task of state.tasks) {
      const row = document.createElement('li');
      row.className = 'task-row' + (task.done ? ' completed' : '') + (state.activeTaskId === task.id ? ' active' : '');
      const check = document.createElement('input'); check.type = 'checkbox'; check.className = 'task-check';
      check.checked = task.done; check.setAttribute('aria-label', `Mark ${task.text} ${task.done ? 'incomplete' : 'complete'}`);
      check.addEventListener('change', () => {
        task.done = check.checked;
        if (task.done && state.activeTaskId === task.id) state.activeTaskId = null;
        save(); renderTasks(); renderTimer();
      });
      const title = document.createElement('button'); title.className = 'task-title';
      title.textContent = task.text; title.disabled = task.done;
      title.setAttribute('aria-pressed', String(state.activeTaskId === task.id));
      title.title = 'Focus on this task';
      title.addEventListener('click', () => { state.activeTaskId = task.id; save(); renderTasks(); renderTimer(); });
      const remove = document.createElement('button'); remove.className = 'delete-task'; remove.textContent = '×';
      remove.setAttribute('aria-label', `Delete ${task.text}`);
      remove.addEventListener('click', () => {
        state.tasks = state.tasks.filter(t => t.id !== task.id);
        if (state.activeTaskId === task.id) state.activeTaskId = null;
        save(); renderTasks(); renderTimer();
      });
      row.append(check, title, remove); $('taskList').append(row);
    }
    const done = state.tasks.filter(t => t.done).length;
    $('emptyTasks').hidden = state.tasks.length > 0;
    $('taskCount').textContent = `${done} / ${state.tasks.length}`;
    const pending = state.tasks.length - done;
    $('taskSummary').textContent = state.tasks.length ? (pending ? `${pending} small win${pending === 1 ? '' : 's'} ahead.` : 'All done. Take a breath.') : 'Make space for what matters.';
    $('clearTasks').hidden = !done;
  }
  function renderTimer() {
    document.body.classList.toggle('running', state.running);
    document.body.classList.toggle('dark', state.theme === 'dark');
    $('themeButton').setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`);
    document.querySelector('meta[name="theme-color"]').content = state.theme === 'dark' ? '#18231d' : '#f5f5ee';
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)));
    const elapsed = T.remaining(state) < state.durationMs;
    const buttonText = state.running ? 'Pause timer' : elapsed ? 'Resume timer' : state.mode === 'focus' ? 'Start focusing' : 'Start your break';
    $('startButton').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${state.running ? '<path d="M7 5h3v14H7ZM15 5h3v14h-3Z"/>' : '<path d="m8 5 11 7-11 7Z"/>'}</svg><span>${buttonText}</span>`;
    $('timerPrompt').textContent = state.mode === 'focus' ? 'Less distraction. More intention.' : state.mode === 'short' ? 'Unclench your shoulders. Take a breath.' : 'You showed up. Now give yourself a real rest.';
    $('cycleLabel').textContent = state.mode === 'focus' ? `FOCUS SESSION ${String(state.cycle + 1).padStart(2, '0')} / 04` : state.mode === 'short' ? 'SHORT BREAK · A MOMENT TO RECHARGE' : 'LONG BREAK · ROOM TO BREATHE';
    const cycleDone = state.mode === 'long' && state.cycle === 0 ? 4 : state.cycle;
    [...$('cycleDots').children].forEach((dot, i) => { dot.className = i < cycleDone ? 'done' : (i === state.cycle && state.mode === 'focus' ? 'current' : ''); });
    $('cycleDots').setAttribute('aria-label', `${cycleDone} of 4 focus sessions in this cycle`);
    $('cycleHint').textContent = state.mode === 'long' ? 'Step away from the screen. You’ve earned a reset.' : `A long break after 4 focus sessions. Earn your exhale.`;
    $('activeTaskLabel').textContent = state.tasks.find(t => t.id === state.activeTaskId && !t.done)?.text || 'A fresh start. Choose a task →';
    $('timerStatus').textContent = state.running ? (state.mode === 'focus' ? 'In your flow' : 'Recharging') : elapsed ? 'On a little pause' : 'Ready when you are';
    updateClock();
  }
  function pulse() {
    const event = T.tick(state);
    if (event) {
      chime();
      const message = event.finished === 'focus' ? `Focus complete. ${event.next === 'long' ? 'Four sessions down! Enjoy your long break.' : 'Time for a short break.'}` : 'Break complete. A fresh focus session is ready.';
      toast(message + (state.running ? '' : ' Press Start when you’re ready.'), 12000);
      save(); renderTimer(); renderStats();
    }
    if (lastDay !== T.dayKey()) renderStats();
    updateClock();
  }
  function toggleTimer() {
    unlockAudio(); pulse();
    if (state.running) T.pause(state); else T.start(state);
    save(); renderTimer();
  }
  function resetTimer() {
    T.reset(state); save(); renderTimer(); toast('Timer reset. A fresh start awaits.');
  }
  $('startButton').addEventListener('click', toggleTimer);
  $('resetButton').addEventListener('click', resetTimer);
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.mode;
    if (next === state.mode) return;
    pulse();
    if ((state.running || T.remaining(state) < state.durationMs) && !window.confirm('Switch modes? Progress in the current timer will be reset. Completed sessions stay saved.')) return;
    T.reset(state, next); save(); renderTimer();
  }));
  $('taskForm').addEventListener('submit', event => {
    event.preventDefault();
    const text = $('taskInput').value.trim();
    if (!text) { $('taskInput').focus(); return; }
    if (state.tasks.length >= 100) { toast('Your list has 100 tasks. Clear a few before adding more.'); return; }
    const task = { id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, text: text.slice(0, 100), done: false };
    state.tasks.push(task);
    if (!state.activeTaskId) state.activeTaskId = task.id;
    $('taskInput').value = ''; save(); renderTasks(); renderTimer(); $('taskInput').focus();
  });
  $('clearTasks').addEventListener('click', () => { state.tasks = state.tasks.filter(t => !t.done); save(); renderTasks(); });
  $('themeButton').addEventListener('click', () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; save(); renderTimer(); });
  $('zenButton').addEventListener('click', () => {
    const enabled = document.body.classList.toggle('zen');
    $('zenButton').setAttribute('aria-label', enabled ? 'Exit distraction-free view' : 'Enter distraction-free view');
    $('zenButton').title = enabled ? 'Exit distraction-free view' : 'Distraction-free view';
  });
  $('settingsButton').addEventListener('click', () => {
    const form = $('settingsForm');
    for (const key of ['focus', 'short', 'long', 'goal']) form.elements.namedItem(key).value = state.settings[key];
    for (const key of ['sound', 'autoStart']) form.elements.namedItem(key).checked = state.settings[key];
    $('settingsDialog').showModal();
  });
  $('closeSettings').addEventListener('click', () => $('settingsDialog').close());
  $('settingsForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const untouched = !state.running && state.remainingMs === state.durationMs;
    for (const key of ['focus', 'short', 'long', 'goal']) state.settings[key] = Number(form.elements.namedItem(key).value);
    for (const key of ['sound', 'autoStart']) state.settings[key] = form.elements.namedItem(key).checked;
    unlockAudio();
    if (untouched) T.reset(state);
    save(); renderTimer(); renderStats(); $('settingsDialog').close(); toast('Your rhythm, saved.');
  });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || $('settingsDialog').open || /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(event.target.tagName) || event.target.isContentEditable) return;
    if (event.code === 'Space') { event.preventDefault(); toggleTimer(); }
    else if (event.key.toLowerCase() === 'r') resetTimer();
    else if (event.key === 'Escape' && document.body.classList.contains('zen')) $('zenButton').click();
  });
  // A second open tab adopts newer state instead of double-counting a session.
  window.addEventListener('storage', event => {
    if (event.key !== KEY) return;
    try { state = T.restore(JSON.parse(event.newValue)); renderTasks(); renderTimer(); renderStats(); } catch (_) {}
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pulse(); });
  renderTasks(); renderTimer(); renderStats(); pulse(); save();
  setInterval(pulse, 250);
})();

