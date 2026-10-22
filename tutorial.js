(() => {
  const SEEN_KEY = 'hole-in-one-tutorial-seen-v1';
  const overlay = document.getElementById('tutorial-overlay');
  const game = document.querySelector('.game-shell');
  const title = document.getElementById('tutorial-title');
  const replay = document.getElementById('tutorial-open');
  const start = document.getElementById('tutorial-start');
  const keyboardShot = document.getElementById('keyboard-shot');
  const celebration = document.getElementById('celebration');
  const nextHole = document.getElementById('next-hole');
  let open = false;
  let returnFocus = null;
  let wasGameInert = false;

  function hasSeenTutorial() {
    try { return localStorage.getItem(SEEN_KEY) === '1'; }
    catch (_) { return false; }
  }

  function markTutorialSeen() {
    try { localStorage.setItem(SEEN_KEY, '1'); }
    catch (_) { /* The tutorial still works when storage is unavailable. */ }
  }

  function showTutorial(fromReplay = false) {
    if (open) return;
    returnFocus = fromReplay ? replay : null;
    wasGameInert = game.inert;
    game.inert = true;
    overlay.hidden = false;
    open = true;
    start.textContent = !celebration.hidden ? 'SEE YOUR WIN ' : fromReplay ? 'BACK TO THE COURSE ' : 'PLAY A HOLE ';
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    start.appendChild(arrow);
    title.focus();
  }

  function hideTutorial() {
    if (!open) return;
    overlay.hidden = true;
    game.inert = wasGameInert;
    open = false;
    markTutorialSeen();
    const target = !celebration.hidden ? nextHole : returnFocus?.isConnected ? returnFocus : keyboardShot;
    returnFocus = null;
    if (!target.disabled) target.focus();
  }

  replay.addEventListener('click', () => showTutorial(true));
  document.getElementById('tutorial-close').addEventListener('click', hideTutorial);
  document.getElementById('tutorial-skip').addEventListener('click', hideTutorial);
  start.addEventListener('click', hideTutorial);

  document.addEventListener('keydown', (event) => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      hideTutorial();
      return;
    }
    if (event.key === 'Tab') {
      const controls = [...overlay.querySelectorAll('button:not([disabled])')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === title)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if ((event.key === ' ' || event.key === 'Enter') && document.activeElement === document.body) {
      event.stopPropagation();
      event.preventDefault();
    }
  }, true);

  if (!hasSeenTutorial()) showTutorial();
})();
