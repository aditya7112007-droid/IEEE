# Understand Focusroom in five minutes

Use this as preparation. Explain only the parts you understand, and be open about assistance when asked.

## The one-sentence explanation

“Focusroom is a Pomodoro study timer that switches between work and breaks, keeps a daily session count, and remembers progress in the browser.”

## What each technology does

- **HTML** gives the page its structure: headings, buttons, inputs and the settings dialog.
- **CSS** controls the appearance and adapts the layout to the screen size.
- **JavaScript** handles the timer, clicks, tasks, saved data and sound.
- **DOM** is the browser's representation of the page. JavaScript updates the DOM when the state changes.
- **localStorage** is small browser storage that can survive refreshes. It stores text, so `JSON.stringify` converts the state object into text and `JSON.parse` converts it back.
- **Web Audio API** generates the chime from sine waves, so no MP3 file is needed.

## Explain the timer with a simple example

Suppose the user starts a 25-minute session at 2:00 PM. The app records 2:25 PM as its deadline. At 2:10 PM it subtracts the current time from that deadline, showing 15 minutes remaining. The interval only asks the browser to redraw; it is not the source of elapsed time.

If the user pauses at 2:10 PM, the remaining 15 minutes are saved. Resuming at 2:20 PM creates a new deadline of 2:35 PM. Refreshing a running page reuses its saved deadline.

## How does the long break work?

The state has a `cycle` counter. When a focus session completes, `(cycle + 1) % 4` moves it forward. A result of zero means four sessions have completed, so the next mode is a long break. Otherwise it is a short break. Completing a break always returns to focus. Reset never increases the count.

## Why separate timer.js and app.js?

`timer.js` is the logic without the webpage. It is easy to test using a fake timestamp. `app.js` connects that logic to the actual buttons and screen. If the design changes, the core timer tests can stay the same.

## Questions they may ask

**Why no React?** The brief asks for HTML, CSS and JavaScript, and this small project is manageable without a framework or build process.

**Will it run with the browser closed?** No JavaScript or sound runs in a closed tab. When reopened, the saved deadline recovers one elapsed session. It does not invent a whole night of completed work.

**Where is the database?** There is no backend database. localStorage holds this browser's data. A future backend could add user accounts and sync.

**What does MM:SS mean?** Minutes and seconds. The app rounds remaining milliseconds up to seconds, divides by 60 for minutes, uses the remainder for seconds and pads both parts with zeros.

**How is task input made safe?** Task text is assigned with `textContent`. It is displayed as text, not parsed as HTML. Input length and total task count are limited.

**How do you test without waiting two hours?** The timer functions accept a timestamp. Automated tests pass later times directly and assert the expected mode and counts. A real one-minute browser test separately checks the UI integration.

**Why is sound sometimes silent?** Browsers can require a user action before audio starts. The Start button unlocks audio where permitted, and the screen also shows an alert.

**What is a limitation?** Data does not sync between devices. Background callbacks and alerts can be delayed; system clock changes can affect the deadline.

## Five-minute demo sequence

1. 0:00–0:40: Explain the problem and the 25/5/15 cycle.
2. 0:40–1:30: Add/select a task, start, pause, resume and reset.
3. 1:30–2:10: Show settings, dark mode and distraction-free view.
4. 2:10–3:00: Explain timestamps, localStorage and daily counters.
5. 3:00–4:00: Show `timer.js`, especially `start`, `pause` and `tick`.
6. 4:00–5:00: Run the tests if Node is installed; describe one limitation and a future improvement.

Before the interview, change one small thing yourself and explain exactly what you changed. That could be a prompt, a colour or the task-list empty state.

