Focusroom
IEEE Web Development Screening — Pomodoro Timer
Project draft for Aditya • Prepared 30 October 2026
Before submission: add your full name, registration number, public GitHub repository and public website URL. Review the personal reflection section in your own words.

Project overview
Focusroom is a browser-based study timer that separates focused work from deliberate breaks. Its default cycle is 25 minutes of focus followed by a 5-minute short break. After every fourth completed focus session, it schedules a 15-minute long break. The interface combines a large timer, a task list and an overview of daily progress.
The implementation uses only HTML, CSS and vanilla JavaScript. There is no application server, database, account system or framework. The app can be served as static files.

Required features implemented
The countdown uses MM:SS, with Start, Pause, Resume and Reset controls. A selected mode label makes it clear whether the user is focusing or resting. Finishing a session automatically switches the mode; auto-start is enabled by default and can be disabled in Settings.
A generated chime and a visible message announce the end of a session. The browser tab title displays the remaining time and mode. Daily completed focus sessions and completed focus minutes are recorded using the browser’s local date. Settings and progress survive reloads through localStorage.
Extra features include selectable tasks, task completion and deletion, a daily goal, a seven-day chart, light and dark themes, editable session lengths, keyboard shortcuts and a distraction-free view. The layout adapts to narrow screens.

How the code works
The HTML file contains the page structure and labelled controls. CSS defines the two-column desktop layout, one-column mobile layout and colour themes. The small plant illustration and favicon are original vector elements and do not require remote image downloads.
timer.js holds the timer state and its operations. The state includes the mode, running status, remaining milliseconds, deadline, original session duration, cycle counter, history, settings and tasks. app.js connects that state to buttons, inputs, localStorage and the screen.
When Start is pressed, the app calculates endAt = Date.now() + remainingMs. Each screen update calculates the difference between endAt and the current time. The interval redraws the display every 250 milliseconds; the timer does not assume that each interval callback ran exactly on time.
Pause saves the remaining milliseconds and clears the running deadline. Resume creates a new deadline from that remaining duration. Reset loads the selected mode’s configured duration without increasing the completed count.
When a focus session reaches its deadline, tick() adds one completed session and the original session duration to the correct daily record. The cycle advances with (cycle + 1) % 4. A result of zero selects a long break; other results select a short break. A completed break returns to Focus.
The settings dialog validates duration and goal values. A duration change does not rewrite an already-started session; the next session or Reset uses the new value. A fresh untouched timer updates immediately. Setting changes and state transitions are saved, rather than writing storage on every display refresh.
Task text uses textContent so user input is displayed as plain text. The app limits task length and task count. Storage loading validates known fields and falls back to defaults for malformed data.

Design decisions and problems addressed
Timer drift: decrementing a counter once per callback can accumulate delays. Comparing real timestamps keeps the displayed remaining time aligned with the deadline during ordinary browser throttling.
Refresh and device sleep: the saved deadline recovers the current session. If it elapsed while the page was closed or the device was asleep, the app completes that one session and starts the next mode when it resumes. It intentionally avoids crediting a long chain of unattended sessions.
Daily rollover: records use the local date of the scheduled completion time. A timer ending after midnight belongs to the new day. The visible statistics also refresh when the local day changes.
Sound restrictions: browsers may block autoplay until a user gesture. Starting the timer attempts to activate Web Audio. A visible message remains available if sound is blocked. Sound playback was implemented but not independently verified through speakers during development.
Storage failure: if browser storage is blocked or full, the timer still works for the current visit and displays a warning. There is no cross-device synchronization.
Responsive design: CSS Grid and media queries switch the main layout to one column on a narrow screen. Native buttons, input labels, keyboard focus indicators and reduced-motion styles support basic accessibility.

Validation
Eight deterministic tests passed using Node’s built-in test runner. They cover pause/resume, short and long break sequencing, reset without credit, completion exactly once, optional auto-start, saved deadline recovery, local midnight, corrupt state recovery, settings changes and MM:SS formatting.
Browser QA checked adding and completing tasks, pausing and reloading the timer, settings, light/dark themes, distraction-free mode and a 390-pixel-wide layout. A real one-minute focus session automatically started a five-minute break and recorded one completed session and one focus minute. The default focus duration was then restored to 25 minutes.
The tests can be rerun with: node --test tests/timer.test.cjs. For a quick manual demonstration, temporarily set Focus to one minute and restore the standard durations afterwards.

Output screenshots
The screenshots below are actual browser captures of the implementation. They show local QA tasks and a completed one-minute test; those values are not preloaded into a new visitor’s app.
![Light theme](screenshots/focusroom-light.jpg)
Figure 1. Light theme: large focus timer, selected task and completed task.
![Dark theme](screenshots/focusroom-dark.jpg)
Figure 2. Dark theme: the short-break mode reached after a real test session.

Limitations and next steps
The app uses browser-local data only. Closing the tab stops JavaScript and audio until it is opened again. Background tabs and sleeping devices can delay transitions and alerts. System clock changes may affect the timestamp-based timer.
Storage events keep multiple tabs approximately aligned, but there is no transactional collaboration system. One active timer tab is recommended. Reset or incomplete sessions do not contribute to the completed focus-minutes statistic.
Possible future additions include optional account sync, session-history export and configurable notification permissions. They are outside the implemented scope.

Personal reflection — complete before submission
This section must be written by the submitter after using and understanding the project. Replace these prompts with your own short answers rather than submitting the prompts.
Which JavaScript function did you understand first, and what does it do?
Which part did you change or test yourself? Describe the actual change or result.
Which bug or confusing behaviour did you personally encounter, and how did you investigate it?
What did you learn about timestamps, DOM events, localStorage or responsive CSS?
What assistance or resources did you use, according to the screening rules?

Submission checklist
Add your full name and registration number.
Add the public repository URL, including complete code and README.
Add the working public website URL and verify it in an incognito window.
Review the screenshots and rewrite the personal reflection in your own words.
Set the final Google Doc to Anyone with the link — Viewer if permitted, and verify access. This draft is not automatically public.


