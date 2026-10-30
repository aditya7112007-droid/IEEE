# Focusroom

A calm, responsive Pomodoro study timer built with **HTML, CSS, and vanilla JavaScript**. No framework, build step, API key, or backend is required.

## What it does

- Large MM:SS timer, Start / Pause / Resume / Reset controls.
- 25-minute focus and 5-minute short breaks by default.
- Automatic 15-minute long break after every 4 completed focus sessions.
- Automatic mode switching; optional auto-start of the next session.
- Generated chime and a visible session-completion alert.
- Remaining time and current mode in the browser tab title.
- Local daily focus count, completed focus minutes, goal and seven-day chart.
- Settings, tasks, theme, statistics and current timer saved in localStorage.
- Editable durations, task list, light/dark themes and distraction-free view.
- Keyboard controls, accessible labels and reduced-motion support.

## Run locally

In the downloadable ZIP, open `index.html` in a modern browser. A local HTTP server is recommended for consistent browser storage behaviour:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. This ZIP places the app files in the project root for simple GitHub Pages hosting. In the managed development checkout the same app files are under `dist/`; use `python -m http.server 8000 --directory dist` there.

## Files

| File | Responsibility |
| --- | --- |
| `index.html` | Semantic layout, timer controls, tasks, progress and settings dialog |
| `styles.css` | Responsive layout, colours, dark theme, focus view and illustration styling |
| `timer.js` | Pure timer state machine, validation, timestamps, cycles and day totals |
| `app.js` | DOM rendering, events, persistence and Web Audio chime |
| `favicon.svg` | Original vector brand mark |
| `tests/timer.test.cjs` | Eight deterministic tests using Node's built-in test runner |
| `docs/PROJECT_REPORT.md` | Technical report and honest personal-reflection prompts |
| `docs/START_HERE.md` | Beginner setup and submission checklist |
| `docs/INTERVIEW_GUIDE.md` | Simple code explanations and a five-minute demo |
| `docs/screenshots/` | Actual browser captures from QA |

## The important logic

Starting stores an end time: `endAt = Date.now() + remainingMs`. The screen is refreshed every 250 milliseconds, but the remaining time is calculated from the timestamp rather than subtracting one second on every callback. This avoids accumulating normal interval delays. Pausing saves the remaining milliseconds; resuming creates a new deadline.

A completed focus session increments the daily count and cycle counter. After sessions 1, 2 and 3, the next mode is a short break. After session 4, the next mode is a long break and the cycle wraps to zero. A completed break returns to Focus. Reset and manual mode changes never award a completed session.

Daily records use the browser's local completion date, not UTC. The seven-day chart uses real saved records; a new visitor starts at zero. Up to 90 days are retained. Task text is inserted with `textContent`, not interpreted as HTML.

## Verification

With Node 18 or newer installed:

```sh
node --test tests/timer.test.cjs
```

Eight automated tests cover pause/resume, four-session cycles, reset, completion exactly once, auto-start off, refresh/sleep recovery, local midnight, malformed storage, duration changes and MM:SS formatting.

Browser QA verified task creation/completion, pause and reload persistence, settings, light/dark themes, a 390px layout, and a real 1-minute test session automatically advancing to a short break and updating statistics. Screenshots show that test state, not hard-coded production statistics. The standard Focus setting was restored to 25 minutes afterwards. Audio output itself was not independently verified on speakers.

## Public hosting

Upload the ZIP's extracted contents (not the ZIP itself) to a public GitHub repository, so `index.html` is at the repository root. In the repository's Pages settings, choose branch-based publishing from the `main` branch and root folder if offered by your GitHub account. Wait for the deployment to complete and use the URL GitHub displays. No build command is needed. UI labels and availability may vary with account policy.

The `docs/START_HERE.md` checklist covers the required repository, live website and Google Doc links. Do not use an owner-private preview as the public reviewer link.

## Limits and decisions

- Data belongs to this browser and origin. There is no login or cross-device sync. Clearing site data removes saved records; blocked storage falls back to in-memory use with a warning.
- Browser background throttling, device sleep and closed tabs can delay chimes and transitions. On returning, only the session that was actually running is completed; the next session starts then. No unattended chain of sessions is fabricated.
- A system clock change can affect a wall-clock timer. A new origin (for example from local preview to GitHub Pages) starts with separate data.
- Audio may require a user gesture and can be blocked by browser autoplay policy. The visual alert remains available.
- The storage event keeps tabs approximately aligned. This is not transactional multi-tab collaboration; one active timer tab is recommended.
- A manually selected break does not award focus credit. Partial/reset sessions are excluded from “Time well spent.” Changing durations affects the next timer or Reset, not the length of a session in progress.

## Submission ownership

This is an AI-assisted implementation supplied as a learning and project starting point. Review the code, customize it, and follow the screening's assistance rules. The report's personal learning section should describe only what the submitter actually tried and understood.

