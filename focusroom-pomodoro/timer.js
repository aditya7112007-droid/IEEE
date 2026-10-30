/* The timer's small, framework-free state machine. Also usable by Node tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FocusTimer = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DEFAULTS = { focus: 25, short: 5, long: 15, goal: 4, sound: true, autoStart: true };
  const MODES = ['focus', 'short', 'long'];
  function dayKey(now = Date.now()) {
    const date = new Date(now);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function safeInt(value, min, max, fallback) {
    return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  }
  function fresh() {
    return { version: 1, settings: { ...DEFAULTS }, mode: 'focus', remainingMs: 1500000,
      durationMs: 1500000, running: false, endAt: null, cycle: 0,
      history: {}, tasks: [], activeTaskId: null, theme: 'light' };
  }
  function restore(raw) {
    const s = fresh();
    if (!raw || raw.version !== 1) return s;
    for (const key of ['focus', 'short', 'long', 'goal']) {
      const max = key === 'focus' ? 120 : key === 'goal' ? 20 : 60;
      s.settings[key] = safeInt(raw.settings?.[key], 1, max, DEFAULTS[key]);
    }
    for (const key of ['sound', 'autoStart']) {
      if (typeof raw.settings?.[key] === 'boolean') s.settings[key] = raw.settings[key];
    }
    s.mode = MODES.includes(raw.mode) ? raw.mode : 'focus';
    s.durationMs = safeInt(raw.durationMs, 60000, 7200000, s.settings[s.mode] * 60000);
    s.remainingMs = safeInt(raw.remainingMs, 0, s.durationMs, s.durationMs);
    s.cycle = safeInt(raw.cycle, 0, 3, 0);
    s.running = raw.running === true && Number.isFinite(raw.endAt) && raw.endAt > 0;
    s.endAt = s.running ? raw.endAt : null;
    s.theme = raw.theme === 'dark' ? 'dark' : 'light';
    if (raw.history && typeof raw.history === 'object') {
      for (const [key, entry] of Object.entries(raw.history).sort().slice(-90)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(key) && entry && typeof entry === 'object') {
          s.history[key] = { sessions: safeInt(entry.sessions, 0, 100000, 0), minutes: safeInt(entry.minutes, 0, 12000000, 0) };
        }
      }
    }
    if (Array.isArray(raw.tasks)) {
      const seen = new Set();
      for (const task of raw.tasks.slice(0, 100)) {
        if (task && typeof task.id === 'string' && typeof task.text === 'string' && task.text.trim() && !seen.has(task.id)) {
          s.tasks.push({ id: task.id.slice(0, 100), text: task.text.trim().slice(0, 100), done: task.done === true });
          seen.add(task.id);
        }
      }
    }
    if (s.tasks.some(t => t.id === raw.activeTaskId && !t.done)) s.activeTaskId = raw.activeTaskId;
    return s;
  }
  function remaining(s, now = Date.now()) {
    return s.running ? Math.min(s.durationMs, Math.max(0, s.endAt - now)) : s.remainingMs;
  }
  function reset(s, mode = s.mode) {
    if (!MODES.includes(mode)) throw new Error('Unknown timer mode');
    s.mode = mode;
    s.durationMs = s.settings[mode] * 60000;
    s.remainingMs = s.durationMs;
    s.running = false;
    s.endAt = null;
  }
  function start(s, now = Date.now()) {
    if (s.running) return;
    if (s.remainingMs <= 0) s.remainingMs = s.durationMs;
    s.endAt = now + s.remainingMs;
    s.running = true;
  }
  function pause(s, now = Date.now()) {
    s.remainingMs = remaining(s, now);
    s.running = false;
    s.endAt = null;
  }
  function tick(s, now = Date.now()) {
    if (!s.running || now < s.endAt) return null;
    const finished = s.mode;
    const completedAt = s.endAt;
    let next = 'focus';
    if (finished === 'focus') {
      const key = dayKey(completedAt);
      const today = s.history[key] || { sessions: 0, minutes: 0 };
      today.sessions += 1;
      today.minutes += s.durationMs / 60000;
      s.history[key] = today;
      s.cycle = (s.cycle + 1) % 4;
      next = s.cycle === 0 ? 'long' : 'short';
      for (const key of Object.keys(s.history).sort().slice(0, -90)) delete s.history[key];
    }
    reset(s, next);
    // Recover only the session that was really running. Never invent hours of
    // completed cycles after a laptop sleeps or the page stays closed.
    if (s.settings.autoStart) start(s, now);
    return { finished, next, completedAt };
  }
  function format(ms) {
    const seconds = Math.ceil(Math.max(0, ms) / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return { DEFAULTS, MODES, dayKey, fresh, restore, remaining, reset, start, pause, tick, format };
});

