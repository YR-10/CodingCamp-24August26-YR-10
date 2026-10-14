# Dayflow — Editorial Personal Productivity & Focus Hub

**Dayflow** (also known as Life Dashboard) is a calm, editorial personal productivity web application engineered with semantic **HTML5**, modern **CSS3**, and modular **Vanilla JavaScript**. It brings together real-time time awareness, a precision Pomodoro focus instrument, full task management with duplicate prevention and multi-mode sorting, and quick navigation shortcuts—persisting user data entirely through the browser's **Local Storage API**.

Art-directed with an intentional, restrained design system (neutral foundation with quiet indigo accents) that avoids generic AI dashboard clichés. Ready for immediate deployment on **GitHub Pages**.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [The Three Required Challenges](#the-three-required-challenges)
3. [Technology Stack & Constraints](#technology-stack--constraints)
4. [Project Structure](#project-structure)
5. [Local Storage Architecture & Keys](#local-storage-architecture--keys)
6. [How to Run Locally](#how-to-run-locally)
7. [GitHub Pages Deployment Guide](#github-pages-deployment-guide)
8. [Accessibility & Defensive Engineering](#accessibility--defensive-engineering)
9. [Known Limitations](#known-limitations)

---

## Features Overview

### 1. Live Greeting & Real-Time Clock (Feature A)
* **Real-time Digital Clock**: Precise `HH:MM:SS` digital readout updated every second.
* **Readable Date**: Automatically formats current local browser date (e.g., *Wednesday, October 14, 2026*).
* **Contextual Greetings**: Dynamic greeting matching local time periods:
  * `05:00 – 11:59` → **Good morning**
  * `12:00 – 17:59` → **Good afternoon**
  * `18:00 – 21:59` → **Good evening**
  * `22:00 – 04:59` → **Good night**
* **Personalized Display Name**: Inline interactive name editor. Click on your name or the edit pencil to update your name; saved instantly to Local Storage.

### 2. Pomodoro Focus Timer (Feature B)
* **Drift-Resistant Timestamp Math**: Calculates remaining time against absolute timestamps (`Date.now() + remainingMs`) rather than simple interval ticks, preventing timing skew caused by browser background tab throttling.
* **SVG Circular Progress Ring**: Crisp vector progress ring displaying visual session progression with smooth transitions.
* **Session Modes**:
  * **Focus Session**: 25 minutes
  * **Short Break**: 5 minutes
  * **Long Break**: 15 minutes
* **Controls**: Start, Pause, Resume, and Reset with interval collision prevention.
* **Celebration & Audio Alert**: Congratulatory banner and synthesized pleasant 3-tone notification chime using the native Web Audio API (zero external sound file downloads or latency).

### 3. Task & Priority Management (Feature C)
* **Task Operations**: Add new tasks with Enter key, toggle completion with custom checkboxes, edit tasks in-place, and delete tasks.
* **Stats Counter**: Live badge tracking `X of Y completed` and remaining pending task count.
* **Filter Views**: Switch seamlessly between **All**, **Active**, and **Completed** tasks.
* **Clear Completed**: One-click cleanup for completed tasks.
* **Empty States**: Contextual empty states providing guidance when no tasks are present.

### 4. Quick Links Manager (Feature D)
* **Custom Shortcuts**: Add, visit, and delete favorite websites.
* **Strict Security Validation**: Whitelists only `http:` and `https:` protocols. Automatically rejects unsafe schemas (`javascript:`, `data:`, `file:`, `vbscript:`).
* **Safe External Navigation**: Automatically applies `target="_blank"` and `rel="noopener noreferrer"` to external links to prevent reverse tabnabbing and window manipulation.
* **Default Starter Links**: Pre-seeded with useful developer resources (GitHub, Google, MDN Web Docs, Dev.to).

---

## The Three Required Challenges

### Challenge 1: Light & Dark Mode
* Accessible toggle button in the header featuring dynamic Sun/Moon SVG icons.
* Synchronizes with the user's OS preference (`prefers-color-scheme`) by default, and allows manual switching.
* Persists the selected theme across page reloads in `lifedash_theme`.
* High-contrast, WCAG AA compliant palette: clean off-white background in light mode (`#f8f9fc`) and a midnight indigo-slate theme in dark mode (`#0d0f18`).

### Challenge 2: Duplicate Task Prevention
* Normalizes task input by stripping leading/trailing whitespace, collapsing multiple consecutive internal spaces, and converting to lowercase.
* Compares new submissions against all existing tasks (both active and completed).
* Rejects duplicate submissions with an accessible warning banner (`role="alert"`) informing the user that the task already exists.
* Also enforces duplicate validation during inline task editing.

### Challenge 3: Multi-Mode Task Sorting
* Accessible dropdown selector supporting 5 sorting orders:
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
| **Styling** | Modern CSS3 (Custom properties, Flexbox, CSS Grid, SVG styling, Media Queries) |
| **Logic** | Vanilla JavaScript (ES6+, Strict Mode, safe DOM APIs) |
| **Persistence** | Browser `localStorage` API with defensive JSON try/catch wrappers |
| **Audio** | Native HTML5 Web Audio API (Synthesized oscillator chime) |
| **Frameworks** | **None** (Zero React, Vue, TypeScript, Tailwind, or bundlers) |
| **Dependencies** | **Zero external dependencies** (Runs 100% offline without CDNs) |

---

## Project Structure

```
c:\Users\User\Projects\CodingCamp-24August26-Dayflow\
├── .kiro/
│   └── project-spec.json      # Machine-readable assignment specification
├── css/
│   └── style.css              # Exactly ONE CSS file for entire visual system
├── js/
│   └── script.js              # Exactly ONE JavaScript file for entire app logic
├── index.html                 # Root semantic HTML document
└── README.md                  # Comprehensive project documentation
```

---

## Local Storage Architecture & Keys

All data keys are namespaced with `lifedash_` to avoid conflicts with other applications:

| Key Name | Type | Description | Default Fallback |
| :--- | :--- | :--- | :--- |
| `lifedash_theme` | `string` | User theme preference: `'light'` or `'dark'` | OS `prefers-color-scheme` |
| `lifedash_username` | `string` | Custom user display name (max 30 chars) | `""` (displays "Friend") |
| `lifedash_tasks` | `Array<Task>` | Array of task objects with `id`, `text`, `completed`, `createdAt` | `[]` |
| `lifedash_task_sort` | `string` | Selected sort order identifier | `'added-desc'` |
| `lifedash_quicklinks` | `Array<Link>`| Array of link objects with `id`, `title`, `url`, `createdAt` | Pre-seeded default links |
| `lifedash_timer_prefs` | `object` | Optional custom Pomodoro duration preferences | `{ work: 25, break: 5 }` |

### Defensive Storage Design:
* Storage operations are isolated inside a `Storage` utility object.
* JSON parsing is protected with `try...catch` blocks to prevent crashes from corrupted browser storage.
* Quota exceedance errors are caught and logged without freezing the UI.

---

## How to Run Locally

You do not need Node.js, npm, or any build tool to run this project.

### Method 1: Direct File Opening
Double-click `index.html` or drag it into any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, or Apple Safari).

### Method 2: Python HTTP Server
Open your terminal in the project directory and run:
```bash
python -m http.server 8080
```
Then visit `http://localhost:8080` in your browser.

### Method 3: VS Code Live Server
If using VS Code, right-click `index.html` and select **Open with Live Server**.

---

## GitHub Pages Deployment Guide

This project is structured specifically for zero-configuration GitHub Pages hosting:

1. **Initialize Git Repository (via GitHub Desktop or CLI)**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Complete Life Dashboard application"
   ```
2. **Push to GitHub**:
   * Create a new repository on GitHub (e.g., `life-dashboard`).
   * Push your commits to the `main` branch.
3. **Enable GitHub Pages**:
   * In your repository on GitHub, navigate to **Settings** → **Pages** (left sidebar).
   * Under **Build and deployment** > **Source**, select **Deploy from a branch**.
   * Under **Branch**, select `main` and root folder `/ (root)`, then click **Save**.
4. **Access the Live Application**:
   * Within 1–2 minutes, your dashboard will be live at:
     `https://<your-github-username>.github.io/<repository-name>/`

---

## Accessibility & Defensive Engineering

* **Landmarks & Skip Link**: Includes `<a href="#main-content" class="skip-link">` and semantic ARIA landmarks (`role="banner"`, `role="main"`, `role="contentinfo"`).
* **Keyboard Navigation**: All interactive elements (forms, buttons, inputs, checkboxes) can be operated using `Tab`, `Space`, `Enter`, and `Escape`.
* **Zero XSS Vulnerabilities**: User-generated content (task descriptions, display names, link titles) is rendered using `textContent` and `createElement`, preventing malicious script injection.
* **Prefers Reduced Motion**: Responsive CSS query `@media (prefers-reduced-motion: reduce)` disables non-essential animations for users with vestibular sensitivities.
* **System Font Stack**: Uses reliable system fonts (`-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`) ensuring 0kb external font download and fast First Contentful Paint.

---

## Known Limitations

* **Browser Local Storage Scope**: Data is saved per-browser and per-domain. Data entered in Chrome will not sync to Firefox or to a separate device.
* **Web Audio Autoplay Policy**: Modern browsers require an initial user interaction (such as clicking the "Start" button) before the browser allows audio tones to play.
