'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const T = require(fs.existsSync(path.join(__dirname, '../dist/timer.js')) ? '../dist/timer.js' : '../timer.js');
const initialTime = new Date(2026, 9, 30, 12, 0).getTime();
test('default focus length and stable timestamp-based pause/resume', () => {
  const s = T.fresh();
  assert.equal(T.format(s.remainingMs), '25:00');
  T.start(s, initialTime);
  assert.equal(T.remaining(s, initialTime + 23456), 1476544);
  T.pause(s, initialTime + 23456);
  assert.equal(T.remaining(s, initialTime + 900000), 1476544);
  T.start(s, initialTime + 900000);
  assert.equal(T.remaining(s, initialTime + 901000), 1475544);
});
test('four completed focuses yield three short breaks then a long break, automatically', () => {
  const s = T.fresh(); let now = initialTime;
  for (let n = 1; n <= 4; n++) {
    if (!s.running) T.start(s, now);
    now = s.endAt;
    const e = T.tick(s, now);
    assert.equal(e.next, n === 4 ? 'long' : 'short');
    assert.equal(s.durationMs, n === 4 ? 900000 : 300000);
    assert.equal(s.history[T.dayKey(now)].sessions, n);
    assert.equal(s.history[T.dayKey(now)].minutes, n * 25);
    assert.equal(s.running, true);
    now = s.endAt;
    T.tick(s, now);
    assert.equal(s.mode, 'focus');
  }
  assert.equal(s.cycle, 0);
});
test('reset and manual mode switch never count unfinished focus', () => {
  const s = T.fresh(); T.start(s, initialTime); T.pause(s, initialTime + 10000);
  T.reset(s); assert.equal(s.remainingMs, 1500000);
  T.reset(s, 'long'); assert.equal(s.remainingMs, 900000);
  assert.deepEqual(s.history, {});
});
test('completion is exactly once and auto-start can be disabled', () => {
  const s = T.fresh(); s.settings.autoStart = false; T.start(s, initialTime);
  assert.equal(T.tick(s, s.endAt - 1), null);
  const end = s.endAt; assert.equal(T.tick(s, end).finished, 'focus');
  assert.equal(s.running, false); assert.equal(T.tick(s, end + 500), null);
  assert.equal(s.history[T.dayKey(end)].sessions, 1);
});
test('reload preserves running deadline and long absence completes only one session', () => {
  let s = T.fresh(); T.start(s, initialTime);
  s = T.restore(JSON.parse(JSON.stringify(s)));
  assert.equal(T.remaining(s, initialTime + 60000), 1440000);
  const now = initialTime + 86400000;
  T.tick(s, now);
  assert.equal(Object.values(s.history).reduce((sum, d) => sum + d.sessions, 0), 1);
  assert.equal(s.endAt, now + 300000);
});
test('daily count uses the local completion date across midnight', () => {
  const s = T.fresh();
  const now = new Date(2026, 9, 30, 23, 50).getTime();
  T.start(s, now); T.tick(s, s.endAt);
  assert.equal(s.history['2026-10-31'].sessions, 1);
  assert.equal(s.history['2026-10-30'], undefined);
});
test('invalid storage recovers and settings changes do not rewrite a running duration', () => {
  assert.deepEqual(T.restore(null), T.fresh());
  const s = T.restore({ version: 1, settings: { focus: -8, goal: 999 }, mode: 'oops', history: {bad: 5}, tasks: [null, { id:'1',text:'hello',done:false }] });
  assert.equal(s.settings.focus, 25); assert.equal(s.mode, 'focus'); assert.equal(s.tasks.length, 1);
  T.start(s, initialTime); s.settings.focus = 50;
  T.tick(s, s.endAt); assert.equal(s.history[T.dayKey(initialTime)].minutes, 25);
  T.reset(s, 'focus'); assert.equal(s.durationMs, 3000000);
});
test('MM:SS rounds up partial seconds and supports 120 minutes', () => {
  assert.equal(T.format(1), '00:01'); assert.equal(T.format(0), '00:00');
  assert.equal(T.format(7200000), '120:00');
});

