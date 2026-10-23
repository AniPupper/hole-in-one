(() => {
  const seenKey = 'hole-in-one-tutorial-seen-v1';
  const overlay = document.getElementById('tutorial-overlay');
  const shop = document.querySelector('.app-shell');
  const title = document.getElementById('tutorial-title');
  const play = document.getElementById('nav-play');
  let open = false;

  function markSeen() {
    try { localStorage.setItem(seenKey, '1'); }
    catch (_) { /* The tutorial remains usable without storage. */ }
  }

  function closeTutorial() {
    if (!open) return;
    overlay.hidden = true;
    shop.inert = false;
    document.body.style.overflow = '';
    open = false;
    markSeen();
    play.focus();
  }

  document.getElementById('tutorial-close').addEventListener('click', closeTutorial);
  document.getElementById('tutorial-skip').addEventListener('click', closeTutorial);
  document.getElementById('tutorial-start').addEventListener('click', () => {
    markSeen();
    location.href = './game.html';
  });

  document.addEventListener('keydown', (event) => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeTutorial();
    } else if (event.key === 'Tab') {
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
  }, true);

  let seen = false;
  try { seen = localStorage.getItem(seenKey) === '1'; }
  catch (_) { /* Show the introduction when storage is unavailable. */ }
  if (!seen) {
    shop.inert = true;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    open = true;
    title.focus();
  }
})();
