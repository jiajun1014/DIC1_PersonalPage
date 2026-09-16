/**
 * AIoT 2026 - Personal Telemetry & Live Precision Clock
 * Author: Jun (吳佳駿)
 */

(function () {
  'use strict';

  // --- Configuration & Default State ---
  const DEFAULT_PROFILE = {
    name: 'Jun (吳佳駿)',
    role: 'AIoT Engineer & Developer • 物聯網與智慧系統探索者'
  };

  const STORAGE_KEYS = {
    PROFILE: 'aiot_user_profile_jun',
    TIME_FORMAT: 'aiot_clock_format'
  };

  let is24HourFormat = localStorage.getItem(STORAGE_KEYS.TIME_FORMAT) === '24';
  let userProfile = loadUserProfile();
  let toastTimer = null;

  // --- DOM Elements ---
  const elHours = document.getElementById('clock-hours');
  const elMinutes = document.getElementById('clock-minutes');
  const elSeconds = document.getElementById('clock-seconds');
  const elPeriod = document.getElementById('clock-period');
  const elPeriodContainer = document.getElementById('period-container');
  const elDate = document.getElementById('clock-date');
  const elTimezone = document.getElementById('clock-timezone');
  const elDayProgressVal = document.getElementById('day-progress-val');
  const elDayProgressFill = document.getElementById('day-progress-fill');

  const greetingPill = document.getElementById('dynamic-greeting-pill');
  const greetingIcon = document.getElementById('greeting-icon');
  const greetingText = document.getElementById('greeting-text');

  const elUserName = document.getElementById('user-name');
  const elUserRole = document.getElementById('user-role');
  const avatarInitials = document.querySelector('.avatar-initials');

  const btnFormatToggle = document.getElementById('format-toggle-btn');
  const lblFormat = document.getElementById('format-label');
  const btnCopyTime = document.getElementById('copy-time-btn');
  const btnQuickEdit = document.getElementById('quick-edit-btn');
  const btnInlineRename = document.getElementById('inline-rename-btn');
  const btnResetProfile = document.getElementById('reset-profile-btn');

  const modalOverlay = document.getElementById('edit-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const editForm = document.getElementById('edit-profile-form');
  const inputName = document.getElementById('input-name');
  const inputRole = document.getElementById('input-role');

  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const telemetryLatency = document.getElementById('telemetry-latency');

  // --- Profile Management & LocalStorage ---
  function loadUserProfile() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        let name = parsed.name || DEFAULT_PROFILE.name;
        if (name === 'Jun (陳佳駿)' || name === 'Alex Morgan' || name === 'Huan Chen (陳煥)') {
          name = DEFAULT_PROFILE.name;
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify({ name, role: parsed.role || DEFAULT_PROFILE.role }));
        }
        return {
          name,
          role: parsed.role || DEFAULT_PROFILE.role
        };
      }
    } catch (e) {
      console.warn('Failed to parse user profile', e);
    }
    return { ...DEFAULT_PROFILE };
  }

  function saveUserProfile(name, role) {
    userProfile = { name, role };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
    applyProfile();
    updateGreeting();
  }

  function applyProfile() {
    if (elUserName) elUserName.textContent = userProfile.name;
    if (elUserRole) elUserRole.textContent = userProfile.role;
    document.title = `${userProfile.name} | AIoT 2026 Personal Page`;

    // Dynamic Initials from name
    if (avatarInitials) {
      const parts = userProfile.name.trim().split(/[\s(（]+/);
      let initials = 'JJ';
      if (parts[0]) {
        initials = parts[0].substring(0, 2).toUpperCase();
      }
      avatarInitials.textContent = initials;
    }
  }

  // --- Clock Engine ---
  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // 12H vs 24H Logic
    if (is24HourFormat) {
      if (elPeriodContainer) elPeriodContainer.style.display = 'none';
      if (elHours) elHours.textContent = String(hours).padStart(2, '0');
    } else {
      if (elPeriodContainer) elPeriodContainer.style.display = 'flex';
      const period = hours >= 12 ? 'PM' : 'AM';
      if (elPeriod) elPeriod.textContent = period;
      hours = hours % 12 || 12;
      if (elHours) elHours.textContent = String(hours).padStart(2, '0');
    }

    if (elMinutes) elMinutes.textContent = String(minutes).padStart(2, '0');
    if (elSeconds) elSeconds.textContent = String(seconds).padStart(2, '0');

    // Calendar Date in traditional Chinese/localized format
    if (elDate) {
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const date = now.getDate();
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const dayName = days[now.getDay()];
      elDate.textContent = `${year}年${month}月${date}日${dayName}`;
    }

    // Day Progress (0 - 100%)
    const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const dayProgress = ((totalSeconds / 86400) * 100).toFixed(1);
    if (elDayProgressVal) elDayProgressVal.textContent = `${dayProgress}%`;
    if (elDayProgressFill) elDayProgressFill.style.width = `${dayProgress}%`;
  }

  // --- Dynamic Greeting System ---
  function updateGreeting() {
    if (!greetingText || !greetingIcon) return;
    const now = new Date();
    const h = now.getHours();
    let icon = '🌅';
    let text = 'GOOD MORNING';

    if (h >= 5 && h < 12) {
      icon = '🌅';
      text = 'GOOD MORNING';
    } else if (h >= 12 && h < 17) {
      icon = '☀️';
      text = 'GOOD AFTERNOON';
    } else if (h >= 17 && h < 22) {
      icon = '🌆';
      text = 'GOOD EVENING';
    } else {
      icon = '🌙';
      text = 'WORKING LATE';
    }

    // Extract first word of user name for greeting
    const firstName = userProfile.name.split(/[\s(（]+/)[0] || 'JUN';
    greetingIcon.textContent = icon;
    greetingText.textContent = `${text}, ${firstName.toUpperCase()}`;
  }

  // --- Timezone Auto-Detection ---
  function initTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei';
      const offset = -new Date().getTimezoneOffset() / 60;
      const offsetSign = offset >= 0 ? '+' : '';
      if (elTimezone) {
        elTimezone.textContent = `${tz} (UTC${offsetSign}${offset})`;
      }
    } catch (e) {
      if (elTimezone) elTimezone.textContent = 'Asia/Taipei (UTC+8)';
    }
  }

  // --- Time Format Toggle ---
  function initFormatToggle() {
    if (lblFormat) {
      lblFormat.textContent = is24HourFormat ? '24H' : '12H';
    }

    btnFormatToggle?.addEventListener('click', () => {
      is24HourFormat = !is24HourFormat;
      localStorage.setItem(STORAGE_KEYS.TIME_FORMAT, is24HourFormat ? '24' : '12');
      if (lblFormat) lblFormat.textContent = is24HourFormat ? '24H' : '12H';
      updateClock();
      showToast(is24HourFormat ? 'Switched to 24-Hour Military Format' : 'Switched to 12-Hour AM/PM Format');
    });
  }

  // --- Copy Timestamp Feature ---
  function initCopyTime() {
    btnCopyTime?.addEventListener('click', () => {
      const now = new Date();
      const isoTime = now.toISOString();
      const localTimeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString()} (${elTimezone ? elTimezone.textContent : 'Local'})`;
      const textToCopy = `Current Time: ${localTimeStr}\nISO Timestamp: ${isoTime}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast('✓ Timestamp copied to clipboard!');
        }).catch(() => {
          fallbackCopy(textToCopy);
        });
      } else {
        fallbackCopy(textToCopy);
      }
    });
  }

  function fallbackCopy(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast('✓ Timestamp copied to clipboard!');
    } catch (e) {
      showToast('Could not copy automatically');
    }
    document.body.removeChild(tempInput);
  }

  // --- Toast Notification System ---
  function showToast(message) {
    if (!toast || !toastMessage) return;
    toastMessage.textContent = message;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // --- Profile Edit Modal Management ---
  function openEditModal() {
    if (!modalOverlay) return;
    inputName.value = userProfile.name;
    inputRole.value = userProfile.role;
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    inputName.focus();
  }

  function closeEditModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }

  function initProfileControls() {
    btnQuickEdit?.addEventListener('click', openEditModal);
    btnInlineRename?.addEventListener('click', openEditModal);
    modalCloseBtn?.addEventListener('click', closeEditModal);
    modalCancelBtn?.addEventListener('click', closeEditModal);

    modalOverlay?.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeEditModal();
    });

    editForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = inputName.value.trim();
      const newRole = inputRole.value.trim();
      if (newName) {
        saveUserProfile(newName, newRole);
        closeEditModal();
        showToast('✓ Profile updated successfully!');
      }
    });

    btnResetProfile?.addEventListener('click', () => {
      if (confirm('Reset profile details to default?')) {
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
        userProfile = { ...DEFAULT_PROFILE };
        applyProfile();
        updateGreeting();
        showToast('Profile reset to default.');
      }
    });
  }

  // --- Simulated Diagnostic Telemetry Pulse ---
  function initTelemetrySimulation() {
    setInterval(() => {
      if (!telemetryLatency) return;
      // Random ping between 11ms and 19ms
      const ping = Math.floor(Math.random() * 9) + 11;
      telemetryLatency.textContent = `${ping} ms`;
    }, 3500);
  }

  // --- Interactive Ambient Particle Canvas ---
  function initParticleCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    });

    const particles = [];
    const PARTICLE_COUNT = Math.min(Math.floor((width * height) / 18000), 75);

    const mouse = {
      x: null,
      y: null,
      radius: 120
    };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 1.8 + 0.8;
        this.color = Math.random() > 0.4 ? 'rgba(0, 240, 255,' : 'rgba(168, 85, 247,';
        this.alpha = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction repulsion
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 2.5;
            this.y -= (dy / dist) * force * 2.5;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color} ${this.alpha})`;
        ctx.fill();
      }
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Connect close particles with cyber constellation lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const lineAlpha = (1 - dist / 110) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animate);
    }

    initParticles();
    animate();
  }

  // --- Startup Execution ---
  function init() {
    applyProfile();
    initTimezone();
    initFormatToggle();
    initCopyTime();
    initProfileControls();
    initTelemetrySimulation();
    initParticleCanvas();

    // Start clock tick immediately and then every second
    updateClock();
    updateGreeting();
    setInterval(() => {
      updateClock();
    }, 1000);

    // Refresh greeting periodically
    setInterval(updateGreeting, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
