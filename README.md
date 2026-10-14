# Dayflow — Editorial Personal Productivity & Focus Hub

**Dayflow** (also referenced as Life Dashboard) is a calm, editorial personal productivity web application engineered with semantic **HTML5**, modern **CSS3**, and modular **Vanilla JavaScript**. It brings together real-time time awareness, a precision Pomodoro focus instrument, full task management with duplicate prevention and multi-mode sorting, and quick navigation shortcuts—persisting user data entirely through the browser's **Local Storage API**.

Art-directed with an intentional, restrained design system (neutral foundation with quiet indigo accents) that avoids generic AI dashboard clichés. Built for zero-build deployment on **GitHub Pages**.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [The Three Required Challenges](#the-three-required-challenges)
3. [Technology Stack & Constraints](#technology-stack--constraints)
4. [Project Structure](#project-structure)
5. [Local Storage Architecture & Keys](#local-storage-architecture--keys)
6. [How to Run Locally](#how-to-run-locally)
7. [GitHub Repository & Deployment](#github-repository--deployment)
8. [Accessibility & Defensive Engineering](#accessibility--defensive-engineering)
9. [Known Limitations](#known-limitations)

---

## Features Overview

### 1. Live Greeting & Real-Time Clock (Feature A)
* **Real-time Digital Clock**: Tabular digital readout (`HH:MM:SS`) updated continuously every second using monospace figures (`font-variant-numeric: tabular-nums`) to prevent layout shifts.
* **Readable Date**: Formats the local browser date (e.g., *Wednesday, October 14, 2026*).
* **Contextual Greetings**: Dynamic greeting aligned with local time periods:
  * `05:00 – 11:59` → **Good morning**
  * `12:00 – 17:59` → **Good afternoon**
  * `18:00 – 21:59` → **Good evening**
  * `22:00 – 04:59` → **Good night**
* **Personalized Display Name**: Inline name editor. Clicking the name or the edit pencil allows instant editing; changes are saved immediately to Local Storage.

### 2. Pomodoro Focus Timer (Feature B)
* **Drift-Resistant Timestamp Math**: Calculates remaining time against absolute timestamps (`Date.now() + remainingMs`) rather than simple interval ticks, preventing timing skew caused by browser background tab throttling.
* **SVG Circular Progress Dial**: Restrained 5px vector progress ring that visualizes session progression smoothly.
* **Session Modes**:
  * **Focus Session**: 25 minutes
  * **Short Break**: 5 minutes
  * **Long Break**: 15 minutes
* **Controls**: Start, Pause, Resume, and Reset with interval collision prevention and a hardware-like status dot.
* **Session Notification & Audio Chime**: An understated completion alert banner and a synthesized 3-tone notification chime generated via the native Web Audio API (requiring no external audio assets or downloads).

### 3. Task & Priority Management (Feature C)
* **Task Operations**: Fast task entry with Enter key submission, custom styled checkboxes, in-place editing (Enter to save, Escape to cancel), and individual deletion.
* **Stats Counter**: Live badge tracking `X of Y completed` and active remaining task count.
* **Filter Views**: Segmented controls for **All**, **Active**, and **Completed** tasks.
* **Batch Action**: "Clear Completed" button for quick cleanup.
* **Quiet Hover Actions**: Edit and delete buttons remain visually quiet by default on desktop, revealing on row hover or keyboard focus, while staying accessible on touch devices.
* **Purposeful Empty States**: Typographic, emoji-free empty states providing guidance when no tasks match the active filter.

### 4. Quick Links Manager (Feature D)
* **Custom Shortcuts**: Add, open, and delete favorite web destinations.
* **Strict Security Validation**: Whitelists only `http:` and `https:` protocols. Automatically rejects unsafe schemas (`javascript:`, `data:`, `file:`, `vbscript:`) and provides helpful validation messages.
* **Safe External Navigation**: Automatically applies `target="_blank"` and `rel="noopener noreferrer"` to external links to prevent reverse tabnabbing.
* **Default Starter Links**: Pre-seeded with developer resources (GitHub, Google, MDN Web Docs, Dev.to) that can be deleted or replaced at any time.

---

## The Three Required Challenges

### Challenge 1: Light & Dark Mode
* Accessible toggle button in the masthead featuring Sun/Moon SVG icons.
* Synchronizes with the user's OS preference (`prefers-color-scheme`) by default, and allows manual switching.
* Persists the selected theme across page reloads in `lifedash_theme`.
* Thoughtfully crafted palette: off-white background in light mode (`#f6f7f9`) and a deliberate midnight slate theme in dark mode (`#10121a`), maintaining high contrast and avoiding artificial purple glow.

### Challenge 2: Duplicate Task Prevention
* Normalizes task input by stripping leading/trailing whitespace, collapsing multiple consecutive internal spaces, and converting to lowercase.
* Compares new submissions against all existing tasks (both active and completed).
* Rejects duplicate submissions with an accessible warning banner (`role="alert"`):  
  `"Duplicate detected: A task with this exact name already exists."`
* Enforces duplicate validation during inline task editing as well.

### Challenge 3: Multi-Mode Task Sorting
* Accessible selector supporting 5 sorting modes:
  * **Newest First** (`added-desc`) — default creation order
  * **Oldest First** (`added-asc`)
  * **Alphabetical (A → Z)** (`alpha-asc`)
  * **Alphabetical (Z → A)** (`alpha-desc`)
  * **Status (Pending First)** (`status`)
* **Non-destructive**: Operates on a shallow array copy, preserving creation timestamps and internal IDs intact.
* Sort preference is saved in Local Storage (`lifedash_task_sort`).

---

## Technology Stack & Constraints

| Area | Technology / Approach |
| :--- | :--- |
| **Markup** | Semantic HTML5 (`header`, `main`, `section`, `aside`, `footer`, `time`, `label`) |
| **Styling** | Pure CSS3 (Design tokens, Flexbox, CSS Grid, SVG styling, Media Queries) |
| **Logic** | Vanilla JavaScript (ES6+, Strict Mode, safe DOM APIs) |
| **Persistence** | Browser `localStorage` API with defensive JSON try/catch wrappers |
| **Audio** | Native HTML5 Web Audio API (Synthesized oscillator chime) |
| **Frameworks** | **None** (Zero React, Vue, TypeScript, Tailwind, or bundlers) |
| **Dependencies** | **Zero external dependencies** (Runs 100% offline without CDNs or web fonts) |

---

## Project Structure

```
dayflow/
├── .kiro/
│   └── project-spec.json      # Machine-readable assignment specification
├── css/
│   └── style.css              # Exactly ONE CSS file for entire visual system
├── js/
│   └── script.js              # Exactly ONE JavaScript file for entire app logic
├── index.html                 # Root semantic HTML document
└── README.md                  # Comprehensive project documentation
```

*File Structure Rule*: Exactly one CSS file exists in `css/`, and exactly one JavaScript file exists in `js/`.

---

## Local Storage Architecture & Keys

All data keys are namespaced with `lifedash_` to prevent collisions with other applications on the same origin:

| Key Name | Type | Description | Default Fallback |
| :--- | :--- | :--- | :--- |
| `lifedash_theme` | `string` | User theme preference: `'light'` or `'dark'` | OS `prefers-color-scheme` |
| `lifedash_username` | `string` | Custom user display name (max 30 chars) | `""` (displays "Friend") |
| `lifedash_tasks` | `Array<Task>` | Array of task objects with `id`, `text`, `completed`, `createdAt` | `[]` |
| `lifedash_task_sort` | `string` | Selected sort order identifier | `'added-desc'` |
| `lifedash_quicklinks` | `Array<Link>`| Array of link objects with `id`, `title`, `url`, `createdAt` | Pre-seeded default links |
| `lifedash_timer_prefs` | `object` | Optional custom Pomodoro duration preferences | `{ work: 25, break: 5 }` |

### Defensive Storage Design:
* Storage operations are isolated inside a safe `Storage` utility object.
* JSON parsing is wrapped in `try...catch` blocks to protect against corrupted or malformed browser data.
* Storage quota errors are trapped gracefully without interrupting the user interface.

---

## How to Run Locally

No build step, package manager, or server installation is required.

### Method 1: Direct File Opening
Double-click `index.html` or open it directly in modern web browsers (Chrome, Edge, Firefox, or Safari).

### Method 2: Python Static Server
Open a terminal inside the project directory and run:
```bash
python -m http.server 8080
```
Then navigate to `http://localhost:8080` in your browser.

### Method 3: VS Code Live Server
Right-click `index.html` in VS Code and choose **Open with Live Server**.

---

## GitHub Repository & Deployment

### Repository Reference
* **GitHub Repository**: [`YR-10/CodingCamp-24August26-YR-10`](https://github.com/YR-10/CodingCamp-24August26-YR-10)
* **Default Branch**: `main`

### Deployment Details
* **Expected GitHub Pages URL**:  
  👉 **`https://yr-10.github.io/CodingCamp-24August26-YR-10/`**  
  *(Serves directly from the root of the `main` branch. Allow 1–2 minutes after pushing changes for GitHub Pages to complete its build).*

### Deployment Configuration Steps:
1. Ensure `index.html` resides at the repository root.
2. In the GitHub repository, navigate to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
4. Choose branch `main` and folder `/ (root)`, then click **Save**.
5. Once built by GitHub Pages, the site will be accessible at the URL above.

---

## Accessibility & Defensive Engineering

* **Landmarks & Skip Link**: Includes an accessible skip link (`<a href="#main-content" class="skip-link">`) and semantic ARIA landmark roles (`role="banner"`, `role="main"`, `role="contentinfo"`).
* **Keyboard Navigation**: Interactive elements (inputs, buttons, segmented controls, custom checkboxes) are focusable and operable via `Tab`, `Space`, `Enter`, and `Escape`.
* **Focus Indicators**: Explicit `:focus-visible` styling provides clear focus rings without causing unwanted focus outlines on mouse clicks.
* **Color Contrast**: Designed with high contrast between text and background surfaces in both light and dark themes to maintain readability.
* **Safe DOM Manipulation (XSS Mitigation)**: User-provided inputs (task text, display names, link titles) are rendered exclusively via safe DOM APIs (`textContent` and programmatic node creation) rather than direct `innerHTML` injection of raw strings.
* **Motion Preferences**: Incorporates `@media (prefers-reduced-motion: reduce)` to disable transitions and animations for users sensitive to motion.
* **Zero External Dependencies**: Uses system font stacks (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`) to function reliably offline without network latency or external CDN dependencies.

---

## Known Limitations

* **Local Storage Scope**: Data persistence is local to the specific browser and origin; data does not automatically synchronize across different devices or browser profiles.
* **Web Audio Autoplay Policy**: Modern browser security policies require an initial user gesture (such as clicking the "Start" button) before audio playback is permitted.
