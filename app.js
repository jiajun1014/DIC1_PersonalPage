/**
 * Personal Space & Real-Time Clock
 * Interactive Engine & State Persistence
 */

(function () {
  'use strict';

  // --- DOM Elements ---
  const hoursDigit = document.getElementById('hours-digit');
  const minutesDigit = document.getElementById('minutes-digit');
  const secondsDigit = document.getElementById('seconds-digit');
  const periodBadge = document.getElementById('period-badge');
  const secondsBarFill = document.getElementById('seconds-bar-fill');
  const currentFullDate = document.getElementById('current-full-date');
  const currentTimezone = document.getElementById('current-timezone');
  const greetingPrefix = document.getElementById('greeting-prefix');
  const detectedLocation = document.getElementById('detected-location');

  const userNameElem = document.getElementById('user-name');
  const editNameBtn = document.getElementById('edit-name-btn');
  const userBioElem = document.getElementById('user-bio');
  const statusTextElem = document.getElementById('status-text');
  const pageTitle = document.getElementById('page-title');

  const formatToggleBtn = document.getElementById('format-toggle-btn');
  const formatToggleLabel = document.getElementById('format-toggle-label');
  const copyTimeBtn = document.getElementById('copy-time-btn');
  const copyCardBtn = document.getElementById('copy-card-btn');

  const dayProgressPercent = document.getElementById('day-progress-percent');
  const dayProgressBar = document.getElementById('day-progress-bar');
  const cycleSubtext = document.getElementById('cycle-subtext');

  const memoInput = document.getElementById('memo-input');
  const memoSaveIndicator = document.getElementById('memo-save-indicator');

  const stopwatchDisplay = document.getElementById('stopwatch-display');
  const timerToggleBtn = document.getElementById('timer-toggle-btn');
  const timerResetBtn = document.getElementById('timer-reset-btn');
  const timerStatusTag = document.getElementById('timer-status-tag');

  const themePicker = document.getElementById('theme-picker');
  const toastContainer = document.getElementById('toast-container');

  // --- State Variables ---
  let is24HourFormat = localStorage.getItem('timeFormat') !== '12h'; // Default to 24h
  let currentTheme = localStorage.getItem('themeAccent') || 'cyan';

  // Stopwatch state
  let stopwatchRunning = false;
  let stopwatchStartTime = 0;
  let stopwatchElapsedTime = 0;
  let stopwatchInterval = null;

  // --- Toast System ---
  function showToast(message, icon = '✓') {
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `<span style="color:var(--accent-primary);font-weight:bold;">${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 260);
    }, 2800);
  }

  // --- Theme Management ---
  function applyTheme(themeName) {
    currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('themeAccent', themeName);

    // Update active button
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === themeName);
    });
  }

  if (themePicker) {
    themePicker.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-btn');
      if (btn && btn.dataset.color) {
        applyTheme(btn.dataset.color);
        showToast(`Theme changed to ${btn.dataset.color.toUpperCase()}`);
      }
    });
  }

  applyTheme(currentTheme);

  // --- User Profile & Persistence ---
  function updatePageTitle(name) {
    const cleanName = name.trim() || 'JUN';
    pageTitle.textContent = `Personal Space • ${cleanName} | Live Clock & Dashboard`;
  }

  function initProfilePersistence() {
    let savedName = localStorage.getItem('userName');
    if (!savedName || savedName === 'Alex Morgan') {
      savedName = 'JUN';
      localStorage.setItem('userName', 'JUN');
    }
    userNameElem.textContent = savedName;
    updatePageTitle(savedName);

    const savedBio = localStorage.getItem('userBio');
    if (savedBio) {
      userBioElem.textContent = savedBio;
    }

    const savedStatus = localStorage.getItem('userStatus');
    if (savedStatus) {
      statusTextElem.textContent = savedStatus;
    }

    // Name editing
    const saveName = () => {
      let name = userNameElem.textContent.trim();
      if (!name) {
        name = 'JUN';
        userNameElem.textContent = name;
      }
      localStorage.setItem('userName', name);
      updatePageTitle(name);
      showToast(`Name saved as "${name}"`);
    };

    userNameElem.addEventListener('blur', saveName);
    userNameElem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        userNameElem.blur();
      }
    });

    if (editNameBtn) {
      editNameBtn.addEventListener('click', () => {
        userNameElem.focus();
        // Select all text
        const range = document.createRange();
        range.selectNodeContents(userNameElem);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      });
    }

    // Bio editing
    userBioElem.addEventListener('blur', () => {
      const bio = userBioElem.textContent.trim();
      localStorage.setItem('userBio', bio);
      showToast('Bio updated');
    });

    userBioElem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        userBioElem.blur();
      }
    });

    // Status editing
    statusTextElem.addEventListener('blur', () => {
      const status = statusTextElem.textContent.trim();
      localStorage.setItem('userStatus', status);
      showToast('Status updated');
    });

    statusTextElem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        statusTextElem.blur();
      }
    });
  }

  // --- Clock & Time Logic ---
  function getTimezoneString() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
      const now = new Date();
      const offsetMinutes = -now.getTimezoneOffset();
      const sign = offsetMinutes >= 0 ? '+' : '-';
      const hours = Math.floor(Math.abs(offsetMinutes) / 60);
      return `${tz} (UTC${sign}${hours})`;
    } catch {
      return 'UTC';
    }
  }

  function getGreeting(hours) {
    if (hours >= 5 && hours < 12) return 'Good morning,';
    if (hours >= 12 && hours < 17) return 'Good afternoon,';
    if (hours >= 17 && hours < 22) return 'Good evening,';
    return 'Working late,';
  }

  function getDayCycleInfo(hours, minutes) {
    const totalSeconds = hours * 3600 + minutes * 60;
    const daySeconds = 86400;
    const percent = Math.min(100, Math.max(0, (totalSeconds / daySeconds) * 100));

    let cyclePhase = 'Daylight Phase • Deep Flow';
    if (hours >= 5 && hours < 9) cyclePhase = 'Dawn Phase • Morning Rise';
    else if (hours >= 9 && hours < 12) cyclePhase = 'Productive Morning • Focus Zone';
    else if (hours >= 12 && hours < 17) cyclePhase = 'Afternoon Velocity • Building';
    else if (hours >= 17 && hours < 21) cyclePhase = 'Golden Hour • Evening Wrap';
    else cyclePhase = 'Night Phase • Rest & Recharge';

    return { percent: percent.toFixed(1), cyclePhase };
  }

  function updateClock() {
    const now = new Date();
    const rawHours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    // Format hours according to 12h / 24h
    let displayHours = rawHours;
    let period = '';

    if (!is24HourFormat) {
      period = rawHours >= 12 ? 'PM' : 'AM';
      displayHours = rawHours % 12 || 12;
      periodBadge.style.display = 'inline-block';
      periodBadge.textContent = period;
    } else {
      periodBadge.style.display = 'none';
    }

    const pad = (num) => String(num).padStart(2, '0');

    hoursDigit.textContent = pad(displayHours);
    minutesDigit.textContent = pad(minutes);
    secondsDigit.textContent = pad(seconds);

    // Continuous seconds bar
    const secondFraction = (seconds + milliseconds / 1000) / 60;
    secondsBarFill.style.width = `${(secondFraction * 100).toFixed(2)}%`;

    // Dynamic greeting
    greetingPrefix.textContent = getGreeting(rawHours);

    // Day cycle calculation
    const cycle = getDayCycleInfo(rawHours, minutes);
    dayProgressPercent.textContent = `${cycle.percent}%`;
    dayProgressBar.style.width = `${cycle.percent}%`;
    cycleSubtext.textContent = cycle.cyclePhase;
  }

  function updateDateAndLocation() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentFullDate.textContent = now.toLocaleDateString(undefined, options);

    const tzStr = getTimezoneString();
    currentTimezone.textContent = tzStr;

    // Detect location name from timezone
    const tzParts = tzStr.split('/')[1] || tzStr;
    const cleanCity = tzParts.split(' ')[0].replace(/_/g, ' ');
    detectedLocation.textContent = cleanCity || 'Earth';
  }

  // High-performance timer update
  function startClockLoop() {
    updateClock();
    updateDateAndLocation();

    // Frame-level loop for buttery smooth seconds bar
    function tick() {
      updateClock();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Re-check full date every minute
    setInterval(updateDateAndLocation, 60000);
  }

  // --- 12h / 24h Toggle ---
  function updateToggleUI() {
    formatToggleLabel.textContent = is24HourFormat ? '24H' : '12H';
    localStorage.setItem('timeFormat', is24HourFormat ? '24h' : '12h');
  }

  formatToggleBtn.addEventListener('click', () => {
    is24HourFormat = !is24HourFormat;
    updateToggleUI();
    updateClock();
    showToast(`Clock switched to ${is24HourFormat ? '24-hour' : '12-hour'} format`);
  });

  updateToggleUI();

  // --- Copy Time Button ---
  copyTimeBtn.addEventListener('click', async () => {
    const now = new Date();
    const timeStr = `${hoursDigit.textContent}:${minutesDigit.textContent}:${secondsDigit.textContent} ${periodBadge.style.display !== 'none' ? periodBadge.textContent : ''}`.trim();
    const copyText = `${currentFullDate.textContent} • ${timeStr} (${currentTimezone.textContent})`;

    try {
      await navigator.clipboard.writeText(copyText);
      showToast('Timestamp copied to clipboard!');
    } catch {
      // Fallback
      showToast(`Time: ${timeStr}`);
    }
  });

  // --- Share / Copy Card Link ---
  copyCardBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Page link copied to clipboard!');
    } catch {
      showToast('Link ready to share!');
    }
  });

  // --- Memo / Notes Auto-Save ---
  function initMemo() {
    const savedMemo = localStorage.getItem('userMemo');
    if (savedMemo) {
      memoInput.value = savedMemo;
    }

    let saveTimeout = null;
    memoInput.addEventListener('input', () => {
      memoSaveIndicator.textContent = 'Typing...';
      memoSaveIndicator.style.color = 'var(--text-muted)';
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        localStorage.setItem('userMemo', memoInput.value);
        memoSaveIndicator.textContent = 'Saved';
        memoSaveIndicator.style.color = '#10b981';
      }, 500);
    });
  }

  // --- Stopwatch Widget ---
  function formatStopwatch(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  timerToggleBtn.addEventListener('click', () => {
    if (!stopwatchRunning) {
      // Start
      stopwatchRunning = true;
      stopwatchStartTime = Date.now() - stopwatchElapsedTime;
      timerToggleBtn.textContent = 'Pause';
      timerToggleBtn.classList.add('running');
      timerStatusTag.textContent = 'RUNNING';
      timerStatusTag.style.color = 'var(--accent-primary)';

      stopwatchInterval = setInterval(() => {
        stopwatchElapsedTime = Date.now() - stopwatchStartTime;
        stopwatchDisplay.textContent = formatStopwatch(stopwatchElapsedTime);
      }, 200);
    } else {
      // Pause
      stopwatchRunning = false;
      clearInterval(stopwatchInterval);
      timerToggleBtn.textContent = 'Resume';
      timerToggleBtn.classList.remove('running');
      timerStatusTag.textContent = 'PAUSED';
      timerStatusTag.style.color = '#f59e0b';
    }
  });

  timerResetBtn.addEventListener('click', () => {
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);
    stopwatchElapsedTime = 0;
    stopwatchDisplay.textContent = '00:00:00';
    timerToggleBtn.textContent = 'Start';
    timerToggleBtn.classList.remove('running');
    timerStatusTag.textContent = 'READY';
    timerStatusTag.style.color = 'var(--text-secondary)';
  });

  // --- Initial Boot ---
  initProfilePersistence();
  initMemo();
  startClockLoop();
})();
