/**
 * ============================================================================
 * LIFE DASHBOARD — APPLICATION LOGIC
 * Architecture: Modular Vanilla JavaScript with LocalStorage Persistence
 * Features:
 *   - Feature A: Live Digital Clock, Contextual Greeting & Display Name
 *   - Feature B: Pomodoro Focus Timer with Drift-Resistant Timestamp Math
 *   - Feature C: To-Do List with In-Place Edit, Batch Actions & Stats
 *   - Feature D: Quick Links Manager with Strict URL Validation
 *   - Challenge 1: Light/Dark Theme Switcher with System Sync & Storage
 *   - Challenge 2: Duplicate Task Prevention (Normalized Comparison)
 *   - Challenge 3: Multi-Mode Non-Destructive Task Sorting
 * ============================================================================
 */

'use strict';

// ----------------------------------------------------------------------------
// 1. CONSTANTS & STORAGE CONFIGURATION
// ----------------------------------------------------------------------------
const STORAGE_KEYS = {
  THEME: 'lifedash_theme',
  USER_NAME: 'lifedash_username',
  TASKS: 'lifedash_tasks',
  TASK_SORT: 'lifedash_task_sort',
  QUICK_LINKS: 'lifedash_quicklinks',
  TIMER_PREFS: 'lifedash_timer_prefs',
};

// Sensible initial quick links
const DEFAULT_QUICK_LINKS = [
  { id: 'link-1', title: 'GitHub', url: 'https://github.com', createdAt: 1700000000000 },
  { id: 'link-2', title: 'Google', url: 'https://www.google.com', createdAt: 1700000001000 },
  { id: 'link-3', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', createdAt: 1700000002000 },
  { id: 'link-4', title: 'Dev.to Community', url: 'https://dev.to', createdAt: 1700000003000 },
];

// SVG circle progress ring circumference for radius = 95
const CIRCLE_RADIUS = 95;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

// ----------------------------------------------------------------------------
// 2. DEFENSIVE LOCAL STORAGE HELPERS
// ----------------------------------------------------------------------------
const Storage = {
  /**
   * Safely retrieve and parse a value from localStorage
   * @param {string} key
   * @param {*} fallback
   * @returns {*}
   */
  get(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item);
    } catch (err) {
      console.warn(`[LifeDashboard Storage] Failed to parse key "${key}". Returning fallback.`, err);
      return fallback;
    }
  },

  /**
   * Safely serialize and store a value in localStorage
   * @param {string} key
   * @param {*} value
   * @returns {boolean} True if successfully stored
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error(`[LifeDashboard Storage] Quota exceeded or error saving "${key}".`, err);
      return false;
    }
  },

  /**
   * Remove a key from localStorage
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[LifeDashboard Storage] Failed to remove "${key}".`, err);
    }
  }
};

// ----------------------------------------------------------------------------
// 3. APPLICATION STATE
// ----------------------------------------------------------------------------
const state = {
  theme: Storage.get(STORAGE_KEYS.THEME, null),
  userName: Storage.get(STORAGE_KEYS.USER_NAME, ''),
  tasks: Storage.get(STORAGE_KEYS.TASKS, []),
  taskFilter: 'all', // 'all' | 'active' | 'completed'
  taskSort: Storage.get(STORAGE_KEYS.TASK_SORT, 'added-desc'),
  editingTaskId: null,
  quickLinks: Storage.get(STORAGE_KEYS.QUICK_LINKS, DEFAULT_QUICK_LINKS),

  // Pomodoro State
  timer: {
    mode: 'focus', // 'focus' | 'short-break' | 'long-break'
    durationMinutes: 25,
    remainingSeconds: 25 * 60,
    status: 'idle', // 'idle' | 'running' | 'paused' | 'completed'
    endTime: null,
    intervalId: null,
  }
};

// ----------------------------------------------------------------------------
// 4. DOM ELEMENT CACHE
// ----------------------------------------------------------------------------
const DOM = {
  // Theme & Greeting
  html: document.documentElement,
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  greetingText: document.getElementById('greeting-text'),
  userNameDisplay: document.getElementById('user-name-display'),
  editNameBtn: document.getElementById('edit-name-btn'),
  nameForm: document.getElementById('name-form'),
  nameInput: document.getElementById('name-input'),
  cancelNameBtn: document.getElementById('cancel-name-btn'),
  currentDate: document.getElementById('current-date'),
  liveClock: document.getElementById('live-clock'),
  clockPeriod: document.getElementById('clock-period'),

  // Timer
  timerSection: document.getElementById('timer-section'),
  timerStatusBadge: document.getElementById('timer-status-badge'),
  timerModeTabs: document.querySelectorAll('.mode-tab'),
  timerCountdown: document.getElementById('timer-countdown'),
  timerModeLabel: document.getElementById('timer-mode-label'),
  progressRingBar: document.getElementById('progress-ring-bar'),
  timerAlert: document.getElementById('timer-alert'),
  timerAlertText: document.getElementById('timer-alert-text'),
  timerToggleBtn: document.getElementById('timer-toggle-btn'),
  timerToggleText: document.getElementById('timer-toggle-text'),
  timerResetBtn: document.getElementById('timer-reset-btn'),

  // Quick Links
  toggleAddLinkBtn: document.getElementById('toggle-add-link-btn'),
  addLinkForm: document.getElementById('add-link-form'),
  linkTitleInput: document.getElementById('link-title-input'),
  linkUrlInput: document.getElementById('link-url-input'),
  linkErrorMsg: document.getElementById('link-error-msg'),
  cancelLinkBtn: document.getElementById('cancel-link-btn'),
  linksContainer: document.getElementById('links-container'),
  linksEmptyState: document.getElementById('links-empty-state'),

  // Tasks
  addTaskForm: document.getElementById('add-task-form'),
  taskInput: document.getElementById('task-input'),
  taskFeedback: document.getElementById('task-feedback'),
  tasksTotalCount: document.getElementById('tasks-total-count'),
  tasksCompletedCount: document.getElementById('tasks-completed-count'),
  filterTabs: document.querySelectorAll('.filter-tab'),
  filterAllCount: document.getElementById('filter-all-count'),
  filterActiveCount: document.getElementById('filter-active-count'),
  filterCompletedCount: document.getElementById('filter-completed-count'),
  taskSortSelect: document.getElementById('task-sort-select'),
  taskList: document.getElementById('task-list'),
  tasksEmptyState: document.getElementById('tasks-empty-state'),
  emptyStateTitle: document.getElementById('empty-state-title'),
  emptyStateDesc: document.getElementById('empty-state-desc'),
  tasksRemainingText: document.getElementById('tasks-remaining-text'),
  clearCompletedBtn: document.getElementById('clear-completed-btn'),
};

// ----------------------------------------------------------------------------
// 5. CHALLENGE 1: THEME MANAGEMENT (LIGHT / DARK)
// ----------------------------------------------------------------------------
const ThemeManager = {
  init() {
    // Determine initial theme: stored preference -> OS preference -> fallback to light
    let activeTheme = state.theme;
    if (!activeTheme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }
    this.applyTheme(activeTheme);

    // Event listener for theme toggle
    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', () => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
        Storage.set(STORAGE_KEYS.THEME, nextTheme);
      });
    }

    // Listen for OS scheme changes if user has not explicitly locked a theme
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const userStoredTheme = localStorage.getItem(STORAGE_KEYS.THEME);
        if (!userStoredTheme) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  },

  applyTheme(theme) {
    state.theme = theme;
    DOM.html.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      DOM.themeToggleBtn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }
};

// ----------------------------------------------------------------------------
// 6. FEATURE A: LIVE CLOCK, DATE & CONTEXTUAL GREETING
// ----------------------------------------------------------------------------
const GreetingManager = {
  init() {
    this.updateClockAndGreeting();
    // Update every second with accuracy
    setInterval(() => this.updateClockAndGreeting(), 1000);
    this.setupNameEditor();
  },

  /**
   * Determine greeting based on local hour (0-23)
   * Morning: 05:00 - 11:59
   * Afternoon: 12:00 - 17:59
   * Evening: 18:00 - 21:59
   * Night: 22:00 - 04:59
   */
  getGreeting(hour) {
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    if (hour >= 18 && hour < 22) return 'Good evening';
    return 'Good night';
  },

  updateClockAndGreeting() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Digital Clock readout (HH:MM:SS)
    const pad = (n) => String(n).padStart(2, '0');
    if (DOM.liveClock) {
      DOM.liveClock.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      DOM.liveClock.setAttribute('datetime', now.toISOString());
    }

    // Contextual Greeting
    const greeting = this.getGreeting(hours);
    if (DOM.greetingText) {
      DOM.greetingText.textContent = greeting;
    }

    // Display Name
    if (DOM.userNameDisplay) {
      DOM.userNameDisplay.textContent = state.userName.trim() ? state.userName.trim() : 'Friend';
    }

    // Date formatting (e.g. Wednesday, October 14, 2026)
    if (DOM.currentDate) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      DOM.currentDate.textContent = now.toLocaleDateString(undefined, options);
    }
  },

  setupNameEditor() {
    const openEditor = () => {
      DOM.nameInput.value = state.userName;
      DOM.nameForm.classList.remove('hidden');
      DOM.userNameDisplay.parentElement.classList.add('hidden');
      DOM.nameInput.focus();
    };

    const closeEditor = () => {
      DOM.nameForm.classList.add('hidden');
      DOM.userNameDisplay.parentElement.classList.remove('hidden');
    };

    DOM.userNameDisplay.addEventListener('click', openEditor);
    DOM.userNameDisplay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEditor();
      }
    });

    DOM.editNameBtn.addEventListener('click', openEditor);

    DOM.nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = DOM.nameInput.value.trim().slice(0, 30);
      state.userName = newName;
      Storage.set(STORAGE_KEYS.USER_NAME, newName);
      this.updateClockAndGreeting();
      closeEditor();
    });

    DOM.cancelNameBtn.addEventListener('click', closeEditor);
  }
};

// ----------------------------------------------------------------------------
// 7. FEATURE B: POMODORO FOCUS TIMER (DRIFT-RESISTANT)
// ----------------------------------------------------------------------------
const TimerManager = {
  init() {
    this.setupProgressRing();
    this.bindEvents();
    this.render();
  },

  setupProgressRing() {
    if (!DOM.progressRingBar) return;
    DOM.progressRingBar.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE}`;
    DOM.progressRingBar.style.strokeDashoffset = `0`;
  },

  bindEvents() {
    // Mode tabs (Focus, Short Break, Long Break)
    DOM.timerModeTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (state.timer.status === 'running') {
          const confirmSwitch = confirm('The timer is currently running. Switch modes and reset the clock?');
          if (!confirmSwitch) return;
        }
        DOM.timerModeTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const mode = tab.dataset.mode;
        const duration = parseInt(tab.dataset.duration, 10) || 25;
        this.setMode(mode, duration);
      });
    });

    // Start / Pause button
    DOM.timerToggleBtn.addEventListener('click', () => {
      if (state.timer.status === 'running') {
        this.pause();
      } else {
        this.start();
      }
    });

    // Reset button
    DOM.timerResetBtn.addEventListener('click', () => {
      this.reset();
    });
  },

  setMode(mode, durationMinutes) {
    this.pause(false);
    state.timer.mode = mode;
    state.timer.durationMinutes = durationMinutes;
    state.timer.remainingSeconds = durationMinutes * 60;
    state.timer.status = 'idle';

    // Update sublabel
    if (DOM.timerModeLabel) {
      if (mode === 'focus') DOM.timerModeLabel.textContent = 'Work Session';
      else if (mode === 'short-break') DOM.timerModeLabel.textContent = 'Short Break';
      else DOM.timerModeLabel.textContent = 'Long Break';
    }

    if (DOM.timerAlert) {
      DOM.timerAlert.classList.add('hidden');
    }

    this.render();
  },

  start() {
    // Protect against duplicate timer intervals
    if (state.timer.intervalId) {
      clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
    }

    // Hide any previous completion alert
    if (DOM.timerAlert) {
      DOM.timerAlert.classList.add('hidden');
    }

    state.timer.status = 'running';
    // Anti-drift math: compute target timestamp based on remaining seconds
    state.timer.endTime = Date.now() + state.timer.remainingSeconds * 1000;

    // Fast tick interval (250ms) ensures UI is smooth and accurate even after sleep/backgrounding
    state.timer.intervalId = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, state.timer.endTime - now);
      state.timer.remainingSeconds = Math.ceil(remainingMs / 1000);

      if (state.timer.remainingSeconds <= 0) {
        this.complete();
      } else {
        this.render();
      }
    }, 250);

    this.render();
  },

  pause(updateStatus = true) {
    if (state.timer.intervalId) {
      clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
    }
    if (updateStatus) {
      state.timer.status = 'paused';
    }
    this.render();
  },

  reset() {
    if (state.timer.intervalId) {
      clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
    }
    state.timer.remainingSeconds = state.timer.durationMinutes * 60;
    state.timer.status = 'idle';
    if (DOM.timerAlert) {
      DOM.timerAlert.classList.add('hidden');
    }
    this.render();
  },

  complete() {
    if (state.timer.intervalId) {
      clearInterval(state.timer.intervalId);
      state.timer.intervalId = null;
    }
    state.timer.remainingSeconds = 0;
    state.timer.status = 'completed';

    // Trigger visual completion alert
    if (DOM.timerAlert) {
      DOM.timerAlert.classList.remove('hidden');
      if (DOM.timerAlertText) {
        DOM.timerAlertText.textContent = state.timer.mode === 'focus'
          ? 'Focus session complete. Time to step away and recharge.'
          : 'Break finished. Ready to begin your next focus block?';
      }
    }

    // Audio chime notification
    this.playChime();
    this.render();
  },

  playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      // Synthesized 3-tone pleasant notification chime
      const tones = [523.25, 659.25, 783.99]; // C5, E5, G5
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.16);
        gain.gain.setValueAtTime(0.2, now + i * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.16);
        osc.stop(now + i * 0.16 + 0.45);
      });
    } catch (e) {
      // Audio playback fails silently if unsupported or restricted
    }
  },

  render() {
    const totalSeconds = state.timer.durationMinutes * 60;
    const remaining = Math.max(0, state.timer.remainingSeconds);

    // Format MM:SS
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const pad = (n) => String(n).padStart(2, '0');
    const formattedTime = `${pad(mins)}:${pad(secs)}`;

    if (DOM.timerCountdown) {
      DOM.timerCountdown.textContent = formattedTime;
    }

    // Update Progress Ring SVG
    if (DOM.progressRingBar) {
      const progressFraction = totalSeconds > 0 ? remaining / totalSeconds : 0;
      const offset = CIRCLE_CIRCUMFERENCE - progressFraction * CIRCLE_CIRCUMFERENCE;
      DOM.progressRingBar.style.strokeDashoffset = `${offset}`;
    }

    // Update Status Badge & Toggle Button Text
    if (DOM.timerStatusBadge) {
      DOM.timerStatusBadge.className = 'badge';
      const statusDot = DOM.timerSection ? DOM.timerSection.querySelector('.status-dot') : null;

      if (state.timer.status === 'running') {
        DOM.timerStatusBadge.classList.add('badge-active');
        DOM.timerStatusBadge.textContent = 'Focusing';
        if (statusDot) statusDot.style.backgroundColor = 'var(--status-success)';
      } else if (state.timer.status === 'paused') {
        DOM.timerStatusBadge.classList.add('badge-warning');
        DOM.timerStatusBadge.textContent = 'Paused';
        if (statusDot) statusDot.style.backgroundColor = 'var(--status-warning)';
      } else if (state.timer.status === 'completed') {
        DOM.timerStatusBadge.classList.add('badge-success');
        DOM.timerStatusBadge.textContent = 'Completed';
        if (statusDot) statusDot.style.backgroundColor = 'var(--accent-primary)';
      } else {
        DOM.timerStatusBadge.classList.add('badge-neutral');
        DOM.timerStatusBadge.textContent = 'Ready';
        if (statusDot) statusDot.style.backgroundColor = 'var(--text-tertiary)';
      }
    }

    if (DOM.timerToggleText) {
      if (state.timer.status === 'running') {
        DOM.timerToggleText.textContent = 'Pause';
      } else if (state.timer.status === 'paused') {
        DOM.timerToggleText.textContent = 'Resume';
      } else if (state.timer.status === 'completed') {
        DOM.timerToggleText.textContent = 'Start Again';
      } else {
        DOM.timerToggleText.textContent = 'Start';
      }
    }
  }
};

// ----------------------------------------------------------------------------
// 8. FEATURE C & CHALLENGES: TO-DO TASK MANAGER
// ----------------------------------------------------------------------------
const TaskManager = {
  init() {
    this.bindEvents();
    // Synchronize sort select with saved preference
    if (DOM.taskSortSelect) {
      DOM.taskSortSelect.value = state.taskSort;
    }
    this.render();
  },

  /**
   * Challenge 2 Normalization:
   * Strips extra whitespace, collapses multiple internal spaces, and lowercases.
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.trim().replace(/\s+/g, ' ').toLowerCase();
  },

  bindEvents() {
    // Add Task Form submission
    DOM.addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddTask();
    });

    // Filter Tabs
    DOM.filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        DOM.filterTabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        state.taskFilter = tab.dataset.filter || 'all';
        this.render();
      });
    });

    // Challenge 3: Sort Select Change
    DOM.taskSortSelect.addEventListener('change', (e) => {
      state.taskSort = e.target.value;
      Storage.set(STORAGE_KEYS.TASK_SORT, state.taskSort);
      this.render();
    });

    // Clear Completed Tasks
    DOM.clearCompletedBtn.addEventListener('click', () => {
      this.clearCompleted();
    });

    // Delegated actions for Task List (Toggle, Edit, Delete)
    DOM.taskList.addEventListener('click', (e) => {
      const target = e.target;
      const taskItem = target.closest('.task-item');
      if (!taskItem) return;
      const taskId = taskItem.dataset.id;

      // Delete action
      if (target.closest('.delete-btn')) {
        this.deleteTask(taskId);
        return;
      }

      // Edit action
      if (target.closest('.edit-btn')) {
        this.enterEditMode(taskId);
        return;
      }

      // Checkbox Toggle action
      if (target.classList.contains('task-checkbox')) {
        this.toggleComplete(taskId);
        return;
      }
    });

    // Clear feedback when user starts typing again
    DOM.taskInput.addEventListener('input', () => {
      this.hideFeedback();
    });
  },

  showFeedback(message, type = 'error') {
    if (!DOM.taskFeedback) return;
    DOM.taskFeedback.textContent = message;
    DOM.taskFeedback.className = `feedback-msg ${type}-msg`;
    DOM.taskFeedback.classList.remove('hidden');
  },

  hideFeedback() {
    if (!DOM.taskFeedback) return;
    DOM.taskFeedback.classList.add('hidden');
    DOM.taskFeedback.textContent = '';
  },

  handleAddTask() {
    const rawText = DOM.taskInput.value;
    const trimmed = rawText.trim();

    // Validation 1: Blank task check
    if (!trimmed) {
      this.showFeedback('Task description cannot be empty. Please enter a task.', 'error');
      DOM.taskInput.focus();
      return;
    }

    // Challenge 2: Duplicate check using normalized comparison
    const normalizedInput = this.normalizeText(trimmed);
    const isDuplicate = state.tasks.some(
      (t) => this.normalizeText(t.text) === normalizedInput
    );

    if (isDuplicate) {
      this.showFeedback(`Duplicate detected: A task "${trimmed}" already exists.`, 'warning');
      DOM.taskInput.focus();
      return;
    }

    // Create unique task object
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
      completedAt: null
    };

    state.tasks.unshift(newTask);
    Storage.set(STORAGE_KEYS.TASKS, state.tasks);

    // Reset input
    DOM.taskInput.value = '';
    this.hideFeedback();
    this.render();
  },

  toggleComplete(taskId) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    Storage.set(STORAGE_KEYS.TASKS, state.tasks);
    this.render();
  },

  deleteTask(taskId) {
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    Storage.set(STORAGE_KEYS.TASKS, state.tasks);
    this.render();
  },

  clearCompleted() {
    const completedCount = state.tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;

    state.tasks = state.tasks.filter((t) => !t.completed);
    Storage.set(STORAGE_KEYS.TASKS, state.tasks);
    this.render();
  },

  enterEditMode(taskId) {
    state.editingTaskId = taskId;
    this.render();

    // Focus on the newly rendered edit input
    const editInput = DOM.taskList.querySelector(`.task-edit-input[data-id="${taskId}"]`);
    if (editInput) {
      editInput.focus();
      editInput.select();
    }
  },

  saveTaskEdit(taskId, newText) {
    const trimmed = newText.trim();
    if (!trimmed) {
      alert('Task description cannot be empty.');
      return;
    }

    // Duplicate check against OTHER tasks
    const normalized = this.normalizeText(trimmed);
    const isDuplicate = state.tasks.some(
      (t) => t.id !== taskId && this.normalizeText(t.text) === normalized
    );

    if (isDuplicate) {
      alert(`A task with the name "${trimmed}" already exists.`);
      return;
    }

    const task = state.tasks.find((t) => t.id === taskId);
    if (task) {
      task.text = trimmed;
      Storage.set(STORAGE_KEYS.TASKS, state.tasks);
    }
    state.editingTaskId = null;
    this.render();
  },

  cancelEdit() {
    state.editingTaskId = null;
    this.render();
  },

  /**
   * Challenge 3: Non-destructive sorting logic
   */
  getSortedAndFilteredTasks() {
    // 1. Filter by status tab
    let filtered = state.tasks;
    if (state.taskFilter === 'active') {
      filtered = state.tasks.filter((t) => !t.completed);
    } else if (state.taskFilter === 'completed') {
      filtered = state.tasks.filter((t) => t.completed);
    }

    // 2. Sort without mutating state.tasks (shallow copy)
    const sorted = [...filtered].sort((a, b) => {
      switch (state.taskSort) {
        case 'added-asc':
          return a.createdAt - b.createdAt;
        case 'added-desc':
          return b.createdAt - a.createdAt;
        case 'alpha-asc':
          return a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });
        case 'alpha-desc':
          return b.text.localeCompare(a.text, undefined, { sensitivity: 'base' });
        case 'status':
          // Incomplete (false = 0) before completed (true = 1)
          if (a.completed === b.completed) {
            return b.createdAt - a.createdAt;
          }
          return a.completed ? 1 : -1;
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return sorted;
  },

  render() {
    const totalCount = state.tasks.length;
    const completedCount = state.tasks.filter((t) => t.completed).length;
    const activeCount = totalCount - completedCount;

    // Update Counter Badges
    if (DOM.tasksTotalCount) DOM.tasksTotalCount.textContent = String(totalCount);
    if (DOM.tasksCompletedCount) DOM.tasksCompletedCount.textContent = String(completedCount);
    if (DOM.filterAllCount) DOM.filterAllCount.textContent = String(totalCount);
    if (DOM.filterActiveCount) DOM.filterActiveCount.textContent = String(activeCount);
    if (DOM.filterCompletedCount) DOM.filterCompletedCount.textContent = String(completedCount);

    if (DOM.tasksRemainingText) {
      DOM.tasksRemainingText.textContent = `${activeCount} ${activeCount === 1 ? 'task' : 'tasks'} pending`;
    }

    // Get filtered & sorted list
    const tasksToRender = this.getSortedAndFilteredTasks();

    // Clear existing task items safely
    DOM.taskList.innerHTML = '';

    // Empty State Handling
    if (tasksToRender.length === 0) {
      DOM.tasksEmptyState.classList.remove('hidden');
      if (DOM.emptyStateTitle && DOM.emptyStateDesc) {
        if (totalCount === 0) {
          DOM.emptyStateTitle.textContent = 'No tasks yet';
          DOM.emptyStateDesc.textContent = 'Capture an objective or task above to begin your day.';
        } else if (state.taskFilter === 'active' && activeCount === 0) {
          DOM.emptyStateTitle.textContent = 'All tasks completed';
          DOM.emptyStateDesc.textContent = 'No active items remaining. Take a breath or plan your next focus.';
        } else if (state.taskFilter === 'completed' && completedCount === 0) {
          DOM.emptyStateTitle.textContent = 'No completed tasks';
          DOM.emptyStateDesc.textContent = 'Completed objectives will be organized here.';
        }
      }
    } else {
      DOM.tasksEmptyState.classList.add('hidden');
    }

    // Build DOM Nodes Safely (Zero XSS through textContent)
    tasksToRender.forEach((task) => {
      const isEditing = state.editingTaskId === task.id;
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.dataset.id = task.id;

      if (isEditing) {
        // Edit Form Container
        const editContainer = document.createElement('div');
        editContainer.className = 'task-main';

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-edit-input';
        editInput.dataset.id = task.id;
        editInput.value = task.text;
        editInput.maxLength = 160;

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn btn-primary btn-sm';
        saveBtn.textContent = 'Save';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary btn-sm';
        cancelBtn.textContent = 'Cancel';

        // Keyboard handler for inline edit (Enter to Save, Escape to Cancel)
        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            this.saveTaskEdit(task.id, editInput.value);
          } else if (e.key === 'Escape') {
            this.cancelEdit();
          }
        });

        saveBtn.addEventListener('click', () => {
          this.saveTaskEdit(task.id, editInput.value);
        });

        cancelBtn.addEventListener('click', () => {
          this.cancelEdit();
        });

        editContainer.appendChild(editInput);
        editContainer.appendChild(saveBtn);
        editContainer.appendChild(cancelBtn);
        li.appendChild(editContainer);
      } else {
        // Normal Task Display
        const mainDiv = document.createElement('div');
        mainDiv.className = 'task-main';

        // Checkbox wrapper
        const checkboxWrap = document.createElement('label');
        checkboxWrap.className = 'task-checkbox-wrap';
        checkboxWrap.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;

        checkboxWrap.appendChild(checkbox);

        // Task Text (safe textContent prevents script injection)
        const textSpan = document.createElement('span');
        textSpan.className = 'task-label-text';
        textSpan.textContent = task.text;

        mainDiv.appendChild(checkboxWrap);
        mainDiv.appendChild(textSpan);

        // Action Buttons: Edit and Delete
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'task-btn edit-btn';
        editBtn.setAttribute('aria-label', `Edit task "${task.text}"`);
        editBtn.setAttribute('title', 'Edit Task');
        editBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        `;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'task-btn delete-btn';
        deleteBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
        deleteBtn.setAttribute('title', 'Delete Task');
        deleteBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        `;

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(mainDiv);
        li.appendChild(actionsDiv);
      }

      DOM.taskList.appendChild(li);
    });
  }
};

// ----------------------------------------------------------------------------
// 9. FEATURE D: QUICK LINKS MANAGER
// ----------------------------------------------------------------------------
const QuickLinksManager = {
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Toggle Form visibility
    DOM.toggleAddLinkBtn.addEventListener('click', () => {
      const isHidden = DOM.addLinkForm.classList.contains('hidden');
      if (isHidden) {
        DOM.addLinkForm.classList.remove('hidden');
        DOM.toggleAddLinkBtn.setAttribute('aria-expanded', 'true');
        DOM.linkTitleInput.focus();
      } else {
        DOM.addLinkForm.classList.add('hidden');
        DOM.toggleAddLinkBtn.setAttribute('aria-expanded', 'false');
        this.hideError();
      }
    });

    DOM.cancelLinkBtn.addEventListener('click', () => {
      DOM.addLinkForm.classList.add('hidden');
      DOM.toggleAddLinkBtn.setAttribute('aria-expanded', 'false');
      this.hideError();
    });

    // Form submission
    DOM.addLinkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddLink();
    });

    // Delegated delete link action
    DOM.linksContainer.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.link-delete-btn');
      if (deleteBtn) {
        const linkId = deleteBtn.dataset.id;
        this.deleteLink(linkId);
      }
    });
  },

  showError(msg) {
    if (!DOM.linkErrorMsg) return;
    DOM.linkErrorMsg.textContent = msg;
    DOM.linkErrorMsg.classList.remove('hidden');
  },

  hideError() {
    if (!DOM.linkErrorMsg) return;
    DOM.linkErrorMsg.classList.add('hidden');
    DOM.linkErrorMsg.textContent = '';
  },

  /**
   * Defensive URL validation
   * Whitelists only http: and https: protocols
   * Explicitly rejects dangerous schemas like javascript:, data:, file:
   */
  validateUrl(input) {
    let raw = (input || '').trim();
    if (!raw) {
      return { valid: false, error: 'URL cannot be blank.' };
    }

    // Auto-prefix https:// if user omitted protocol
    if (!/^https?:\/\//i.test(raw)) {
      raw = 'https://' + raw;
    }

    try {
      const parsed = new URL(raw);
      const protocol = parsed.protocol.toLowerCase();

      if (protocol !== 'http:' && protocol !== 'https:') {
        return { valid: false, error: 'Only HTTP and HTTPS links are allowed.' };
      }

      // Check valid host domain
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return { valid: false, error: 'Please enter a valid domain (e.g. example.com).' };
      }

      return { valid: true, cleanUrl: parsed.href, hostname: parsed.hostname };
    } catch (e) {
      return { valid: false, error: 'Invalid URL format. Please check and try again.' };
    }
  },

  handleAddLink() {
    const title = DOM.linkTitleInput.value.trim();
    const rawUrl = DOM.linkUrlInput.value.trim();

    if (!title) {
      this.showError('Please provide a title for this shortcut.');
      DOM.linkTitleInput.focus();
      return;
    }

    const validation = this.validateUrl(rawUrl);
    if (!validation.valid) {
      this.showError(validation.error);
      DOM.linkUrlInput.focus();
      return;
    }

    // Duplicate check by URL or Title
    const isDuplicate = state.quickLinks.some(
      (l) => l.url.toLowerCase() === validation.cleanUrl.toLowerCase() ||
             l.title.toLowerCase() === title.toLowerCase()
    );

    if (isDuplicate) {
      this.showError('A shortcut with this name or URL already exists.');
      return;
    }

    const newLink = {
      id: 'link-' + Date.now(),
      title: title,
      url: validation.cleanUrl,
      createdAt: Date.now()
    };

    state.quickLinks.push(newLink);
    Storage.set(STORAGE_KEYS.QUICK_LINKS, state.quickLinks);

    // Reset Form
    DOM.linkTitleInput.value = '';
    DOM.linkUrlInput.value = '';
    this.hideError();
    DOM.addLinkForm.classList.add('hidden');
    DOM.toggleAddLinkBtn.setAttribute('aria-expanded', 'false');

    this.render();
  },

  deleteLink(linkId) {
    state.quickLinks = state.quickLinks.filter((l) => l.id !== linkId);
    Storage.set(STORAGE_KEYS.QUICK_LINKS, state.quickLinks);
    this.render();
  },

  render() {
    DOM.linksContainer.innerHTML = '';

    if (state.quickLinks.length === 0) {
      DOM.linksEmptyState.classList.remove('hidden');
    } else {
      DOM.linksEmptyState.classList.add('hidden');
    }

    state.quickLinks.forEach((link) => {
      let hostname = '';
      try {
        hostname = new URL(link.url).hostname.replace(/^www\./, '');
      } catch (e) {
        hostname = link.url;
      }

      // Safe DOM construction
      const item = document.createElement('div');
      item.className = 'link-item';

      const contentLink = document.createElement('a');
      contentLink.className = 'link-content';
      contentLink.href = link.url;
      contentLink.target = '_blank';
      contentLink.rel = 'noopener noreferrer';
      contentLink.setAttribute('aria-label', `Open ${link.title} (${hostname}) in new tab`);

      // Initial icon badge
      const badge = document.createElement('div');
      badge.className = 'link-badge';
      badge.textContent = (link.title[0] || 'L').toUpperCase();

      const meta = document.createElement('div');
      meta.className = 'link-meta';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'link-title';
      titleSpan.textContent = link.title;

      const domainSpan = document.createElement('span');
      domainSpan.className = 'link-domain';
      domainSpan.textContent = hostname;

      meta.appendChild(titleSpan);
      meta.appendChild(domainSpan);

      contentLink.appendChild(badge);
      contentLink.appendChild(meta);

      // Actions container
      const actions = document.createElement('div');
      actions.className = 'link-actions';

      // Open in tab indicator
      const openAnchor = document.createElement('a');
      openAnchor.className = 'link-open-btn';
      openAnchor.href = link.url;
      openAnchor.target = '_blank';
      openAnchor.rel = 'noopener noreferrer';
      openAnchor.setAttribute('aria-label', `Visit ${link.title}`);
      openAnchor.title = 'Visit link';
      openAnchor.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      `;

      // Delete shortcut button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'link-delete-btn';
      deleteBtn.dataset.id = link.id;
      deleteBtn.setAttribute('aria-label', `Delete shortcut "${link.title}"`);
      deleteBtn.title = 'Delete shortcut';
      deleteBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;

      actions.appendChild(openAnchor);
      actions.appendChild(deleteBtn);

      item.appendChild(contentLink);
      item.appendChild(actions);

      DOM.linksContainer.appendChild(item);
    });
  }
};

// ----------------------------------------------------------------------------
// 10. APPLICATION BOOTSTRAP
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  GreetingManager.init();
  TimerManager.init();
  TaskManager.init();
  QuickLinksManager.init();
});
