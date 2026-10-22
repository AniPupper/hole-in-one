const STORAGE_KEY = 'hole-in-one-progress-v1';

const clubs = {
  rookie: { name: 'The Rookie', description: 'Everyone starts somewhere.', icon: '✦' },
  meteor: { name: 'The Comet', description: 'A little extra distance. A lot more drama.', type: 'POWER DRIVER', tag: 'FAN FAVORITE', art: 'meteor', color: '#d97242', grip: '#8b502e', stats: [7, 4, 3], icon: '✷' },
  cloud: { name: 'Cloud Nine', description: 'For shots that prefer the scenic route.', type: 'SKY WEDGE', tag: 'AIR TIME', art: 'cloud', color: '#60a8b6', grip: '#447c85', stats: [5, 8, 4], icon: '☁' },
  lightning: { name: 'The Spark', description: 'Blink and you might miss the magic.', type: 'TRICK IRON', tag: 'WILD CARD', art: 'lightning', color: '#9a6cad', grip: '#6c4c86', stats: [6, 5, 8], icon: 'ϟ' },
  orbit: { name: 'Orbit Driver', description: 'Taking the long way around the moon.', type: 'POWER DRIVER', tag: 'LONG RANGE', art: 'orbit', color: '#6ca67d', grip: '#3c7652', stats: [8, 6, 6], icon: '◎' },
  lotus: { name: 'Lotus Launcher', description: 'Soft touch. Seriously big lift.', type: 'SKY WEDGE', tag: 'HIGH FLYER', art: 'lotus', color: '#c86f91', grip: '#924e70', stats: [6, 9, 6], icon: '✿' },
  volt: { name: 'Volt Viper', description: 'A little lightning in your follow-through.', type: 'TRICK IRON', tag: 'WILD CARD', art: 'volt', color: '#9a9b44', grip: '#626b32', stats: [8, 6, 9], icon: 'ϟ' },
  nebula: { name: 'The Nebula', description: 'Every swing starts a new constellation.', type: 'COSMIC DRIVER', tag: 'STARDUST', art: 'nebula', color: '#686cb2', grip: '#454887', stats: [9, 8, 8], icon: '✳' },
  rocket: { name: 'Rocket Club', description: 'All systems go, eventually.', type: 'LAUNCH WEDGE', tag: 'LIFTOFF', art: 'rocket', color: '#e57957', grip: '#a6503c', stats: [10, 10, 7], icon: '✦' },
  aurora: { name: 'Aurora Ace', description: 'For the most beautiful possible detour.', type: 'LEGEND IRON', tag: 'RARE FIND', art: 'aurora', color: '#4caa97', grip: '#31736f', stats: [8, 9, 10], icon: '❋' }
};

const tiers = [
  { threshold: 1000, choices: ['meteor', 'cloud', 'lightning'] },
  { threshold: 2600, choices: ['orbit', 'lotus', 'volt'] },
  { threshold: 5200, choices: ['nebula', 'rocket', 'aurora'] }
];

const initialProgress = { xp: 1240, holeCount: 4, equipped: 'rookie', claimed: [], owned: ['rookie'] };
let progress = loadProgress();
let selectedId = null;
let toastTimer;
let shotInProgress = false;
let dragStart = null;
let lastPower = 0;
let practiceGeneration = 0;
let activeShotAnimation = null;
let modalReturnFocus = null;
let claimRevealTimer = null;
let claimSelectedId = null;

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Number.isFinite(saved.xp) && Number.isInteger(saved.holeCount) && clubs[saved.equipped] && Array.isArray(saved.claimed)) {
      return { xp: Math.max(0, saved.xp), holeCount: Math.max(0, saved.holeCount), equipped: saved.equipped, claimed: saved.claimed.filter((id) => Number.isInteger(id) && id >= 0 && id < tiers.length), owned: Array.isArray(saved.owned) ? saved.owned.filter((id) => clubs[id]) : ['rookie', saved.equipped] };
    }
  } catch (_) { /* Browser storage can be unavailable in private sessions. */ }
  return { ...initialProgress, claimed: [], owned: ['rookie'] };
}

function saveProgress() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* Keep this session playable without storage. */ }
}

function currentTierIndex() {
  const index = tiers.findIndex((_, i) => !progress.claimed.includes(i));
  return index === -1 ? tiers.length - 1 : index;
}

function allClaimed() { return progress.claimed.length >= tiers.length; }

function clubArtwork(club) {
  const id = club.art;
  return `<svg viewBox="0 0 260 170" aria-hidden="true" focusable="false">
    <defs><linearGradient id="shaft-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f9faf2"/><stop offset=".48" stop-color="#afc5ac"/><stop offset="1" stop-color="#60836c"/></linearGradient><linearGradient id="head-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="${club.color}"/><stop offset="1" stop-color="${club.grip}"/></linearGradient></defs>
    <circle cx="125" cy="87" r="59" fill="#fff" opacity=".12"/>
    <path d="M113 128 L178 20" stroke="#688575" stroke-width="8" stroke-linecap="round"/>
    <path d="M113 128 L178 20" stroke="url(#shaft-${id})" stroke-width="5" stroke-linecap="round"/>
    <path d="M166 39 L180 17" stroke="${club.grip}" stroke-width="10" stroke-linecap="round"/>
    <path d="M166 39 L180 17" stroke="#fff" stroke-opacity=".38" stroke-width="2" stroke-linecap="round"/>
    <path d="M73 126 C90 116 111 117 128 129 L139 144 Q116 165 83 154 L66 146 Q61 138 73 126Z" fill="url(#head-${id})" stroke="${club.grip}" stroke-width="2"/>
    <path d="M72 135 C92 139 113 141 135 139" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
    <path d="M77 143 C92 149 114 152 130 146" fill="none" stroke="${club.grip}" stroke-opacity=".5" stroke-width="2"/>
    <text x="89" y="141" font-family="Outfit, sans-serif" font-size="22" font-weight="800" fill="#fff" opacity=".8">${club.icon}</text>
    <circle cx="187" cy="62" r="3" fill="#fff" opacity=".9"/><circle cx="61" cy="74" r="2" fill="#fff" opacity=".8"/>
  </svg>`;
}

function statRow(label, value) {
  return `<div class="stat-row"><span>${label}</span><span class="stat-bar"><span style="width:${value * 10}%"></span></span><span class="stat-number">${value}/10</span></div>`;
}

function render() {
  const tierIndex = currentTierIndex();
  const tier = tiers[tierIndex];
  const unlocked = progress.xp >= tier.threshold;
  const complete = allClaimed();
  if (complete) selectedId = progress.equipped;
  else if (!tier.choices.includes(selectedId)) selectedId = tier.choices[0];

  document.getElementById('hero-description').textContent = complete
    ? 'Full bag. Endless perfect shots.'
    : unlocked
      ? 'Choose a club. Play the next hole.'
      : 'Sink shots. Earn XP. Upgrade.';

  document.getElementById('wallet-xp').innerHTML = `${progress.xp.toLocaleString()} <span>XP</span>`;
  document.getElementById('hole-count').textContent = `${progress.holeCount} perfect shot${progress.holeCount === 1 ? '' : 's'} so far`;
  document.getElementById('equipped-name').textContent = clubs[progress.equipped].name;
  document.getElementById('equipped-sub').textContent = clubs[progress.equipped].description;

  document.getElementById('reward-kicker').textContent = complete ? 'ALL TIERS COMPLETE' : `TIER ${String(tierIndex + 1).padStart(2, '0')} / 03`;
  document.getElementById('reward-title').textContent = complete ? 'All clubs unlocked.' : unlocked ? 'New clubs ready.' : `${Math.max(0, tier.threshold - progress.xp).toLocaleString()} XP to go.`;
  document.getElementById('meter-caption').textContent = `${progress.xp.toLocaleString()} / ${tier.threshold.toLocaleString()} XP`;
  document.getElementById('meter-status').textContent = complete ? 'ALL UNLOCKED' : unlocked ? 'READY TO UNLOCK' : 'KEEP SWINGING';
  document.getElementById('meter-fill').style.width = `${Math.min(100, progress.xp / tier.threshold * 100)}%`;
  document.getElementById('section-index').textContent = `TIER ${String(tierIndex + 1).padStart(2, '0')} / 03`;
  document.getElementById('club-heading').textContent = complete ? 'Final pick.' : unlocked ? 'Pick your club.' : 'Coming up.';
  document.getElementById('section-description').textContent = complete ? 'The bag is complete.' : unlocked ? 'One of three is yours.' : 'Earn XP to unlock one.';
  document.getElementById('selection-note-text').textContent = complete ? 'ALL REWARDS CLAIMED' : 'CHOOSE ONE OF THREE';

  const grid = document.getElementById('club-grid');
  grid.innerHTML = tier.choices.map((id, index) => {
    const club = clubs[id];
    const selected = selectedId === id;
    return `<button class="club-card ${selected ? 'selected' : ''} ${!unlocked && !complete ? 'locked' : ''}" type="button" data-club="${id}" aria-pressed="${selected}" ${complete ? 'disabled' : ''}>
      <div class="club-art ${club.art}"><span class="price-badge">${tier.threshold.toLocaleString()} XP</span><span class="art-spark one">✦</span><span class="art-spark two">✳</span>${clubArtwork(club)}<span class="card-check">${selected ? '✓' : ''}</span></div>
      <div class="card-body"><div class="card-row"><span class="card-kicker">${club.type}</span><span class="card-tag">${club.tag}</span></div><h3>${club.name}</h3>
        ${statRow('DISTANCE', club.stats[0])}${statRow('HEIGHT', club.stats[1])}${statRow('TRICKS', club.stats[2])}
        <div class="card-bottom"><span>${complete ? progress.owned.includes(id) ? 'IN YOUR BAG' : 'NOT CHOSEN' : unlocked ? 'READY TO UNLOCK' : `${Math.max(0, tier.threshold - progress.xp).toLocaleString()} XP SHORT`}</span><span class="card-arrow">↗</span></div>
      </div></button>`;
  }).join('');
  grid.querySelectorAll('[data-club]').forEach((button) => button.addEventListener('click', () => {
    selectedId = button.dataset.club;
    render();
    grid.querySelector(`[data-club="${selectedId}"]`).focus();
  }));

  const selected = clubs[selectedId];
  document.querySelector('.selection-caption').textContent = complete ? 'CURRENTLY EQUIPPED' : unlocked ? 'YOUR PICK' : 'UP NEXT';
  document.getElementById('selected-name').textContent = selected.name;
  document.getElementById('selection-price').textContent = complete ? 'UNLOCKED' : `${tier.threshold.toLocaleString()} XP`;
  const claimButton = document.getElementById('claim-button');
  claimButton.disabled = complete || !unlocked;
  claimButton.querySelector('span:first-child').textContent = complete ? 'Collection complete' : unlocked ? 'Unlock & equip' : 'Keep swinging';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

function burstConfetti(count = 70) {
  const layer = document.getElementById('confetti-layer');
  const colors = ['#e8b357', '#8ac482', '#ef8e6d', '#88bed0', '#b195d1'];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.setProperty('--left', `${Math.random() * 100}%`);
    piece.style.setProperty('--drift', `${(Math.random() - .5) * 240}px`);
    piece.style.setProperty('--fall-time', `${2.2 + Math.random() * 1.8}s`);
    piece.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    piece.style.setProperty('--color', colors[i % colors.length]);
    piece.style.animationDelay = `${Math.random() * .6}s`;
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 4600);
  }
}

document.getElementById('claim-button').addEventListener('click', () => {
  const tierIndex = currentTierIndex();
  if (allClaimed() || progress.xp < tiers[tierIndex].threshold || !tiers[tierIndex].choices.includes(selectedId)) return;
  claimSelectedId = selectedId;
  const chosen = clubs[claimSelectedId];
  const price = tiers[tierIndex].threshold;
  const dialog = document.querySelector('#claim-modal .claim-dialog');
  dialog.classList.remove('celebrating', 'revealed');
  document.getElementById('claim-step').textContent = '01 / CHECKOUT';
  document.getElementById('claim-title').textContent = 'Make it yours.';
  document.getElementById('claim-intro').textContent = 'One club from this trio. Your XP total stays yours.';
  document.getElementById('claim-art').innerHTML = clubArtwork(chosen);
  document.getElementById('claim-type').textContent = chosen.type;
  document.getElementById('claim-club-name').textContent = chosen.name;
  document.getElementById('claim-club-description').textContent = chosen.description;
  document.getElementById('claim-stats').innerHTML = ['DISTANCE', 'HEIGHT', 'TRICKS'].map((label, i) => `<div class="claim-stat"><span>${label}</span><strong>${chosen.stats[i]}/10</strong></div>`).join('');
  document.getElementById('claim-balance').textContent = `${progress.xp.toLocaleString()} XP`;
  document.getElementById('claim-cost').textContent = `${price.toLocaleString()} XP`;
  document.getElementById('claim-after').textContent = `${progress.xp.toLocaleString()} XP`;
  document.getElementById('claim-confirm-text').textContent = `Unlock & equip at ${price.toLocaleString()} XP`;
  document.getElementById('claim-announcement').textContent = '';
  document.getElementById('claim-back').hidden = false;
  document.getElementById('claim-confirm').hidden = false;
  document.getElementById('claim-confirm').disabled = false;
  document.getElementById('claim-done').hidden = true;
  showModal('claim-modal');
  document.getElementById('claim-confirm').focus();
});

document.getElementById('claim-confirm').addEventListener('click', () => {
  const tierIndex = currentTierIndex();
  if (!claimSelectedId || allClaimed() || progress.xp < tiers[tierIndex].threshold || !tiers[tierIndex].choices.includes(claimSelectedId)) return;
  const chosen = clubs[claimSelectedId];
  progress.equipped = claimSelectedId;
  progress.claimed.push(tierIndex);
  progress.owned.push(claimSelectedId);
  saveProgress();
  render();

  const dialog = document.querySelector('#claim-modal .claim-dialog');
  dialog.classList.add('celebrating');
  document.getElementById('claim-step').textContent = '02 / THE REVEAL';
  document.getElementById('claim-title').textContent = 'Unlock complete…';
  document.getElementById('claim-intro').textContent = 'Your new club is taking its place in the bag.';
  document.getElementById('claim-after').textContent = `${progress.xp.toLocaleString()} XP`;
  document.getElementById('claim-announcement').textContent = `${chosen.name} equipped. ${progress.xp.toLocaleString()} XP kept.`;
  document.getElementById('claim-back').hidden = true;
  document.getElementById('claim-confirm').hidden = true;
  document.getElementById('claim-close').focus();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  claimRevealTimer = setTimeout(() => {
    claimRevealTimer = null;
    if (document.getElementById('claim-modal').hidden) return;
    dialog.classList.remove('celebrating');
    dialog.classList.add('revealed');
    document.getElementById('claim-step').textContent = '03 / NEW CLUB UNLOCKED';
    document.getElementById('claim-title').textContent = `${chosen.name} is yours!`;
    document.getElementById('claim-intro').textContent = 'Equipped and ready. The next hole does not know what is coming.';
    document.getElementById('claim-announcement').textContent = `${chosen.name} is in your bag. New club unlocked!`;
    document.getElementById('claim-done').hidden = false;
    document.getElementById('claim-done').focus();
    burstConfetti(reducedMotion ? 20 : 105);
  }, reducedMotion ? 100 : 1250);
});

document.getElementById('claim-close').addEventListener('click', () => hideModal('claim-modal'));
document.getElementById('claim-back').addEventListener('click', () => hideModal('claim-modal'));
document.getElementById('claim-done').addEventListener('click', () => hideModal('claim-modal'));

function showModal(id) {
  modalReturnFocus = document.activeElement;
  const modal = document.getElementById(id);
  modal.hidden = false;
  document.querySelector('.app-shell').inert = true;
  document.body.style.overflow = 'hidden';
  modal.querySelector('.modal-close').focus();
}
function hideModal(id) {
  if (id === 'claim-modal') {
    clearTimeout(claimRevealTimer);
    claimRevealTimer = null;
    claimSelectedId = null;
  }
  if (id === 'practice-modal') {
    practiceGeneration += 1;
    activeShotAnimation?.cancel();
    activeShotAnimation = null;
    shotInProgress = false;
    dragStart = null;
  }
  document.getElementById(id).hidden = true;
  document.querySelector('.app-shell').inert = false;
  document.body.style.overflow = '';
  if (modalReturnFocus?.isConnected && !modalReturnFocus.disabled) modalReturnFocus.focus();
  else document.getElementById('nav-collection').focus();
  modalReturnFocus = null;
}

function openPractice() {
  practiceGeneration += 1;
  const ball = document.getElementById('practice-ball');
  ball.style.opacity = '1';
  ball.style.transform = 'translate(-50%,-50%)';
  document.getElementById('wind-effect').classList.remove('active');
  document.getElementById('power-value').textContent = 'Pull back to aim';
  document.getElementById('practice-result').textContent = 'Every swing is a winner.';
  document.getElementById('back-to-shop').hidden = true;
  document.getElementById('practice-hole-number').textContent = String(progress.holeCount + 1).padStart(2, '0');
  shotInProgress = false;
  dragStart = null;
  lastPower = 0;
  showModal('practice-modal');
}

document.getElementById('modal-close').addEventListener('click', () => hideModal('practice-modal'));
document.getElementById('back-to-shop').addEventListener('click', () => hideModal('practice-modal'));

document.getElementById('nav-collection').addEventListener('click', () => {
  const ids = [...new Set(['rookie', ...progress.owned, progress.equipped])];
  document.getElementById('collection-list').innerHTML = ids.map((id) => `<div class="collection-entry"><span class="collection-emblem">${clubs[id].icon}</span><div><strong>${clubs[id].name}</strong><small>${clubs[id].description}</small></div>${id === progress.equipped ? '<span class="collection-equipped">EQUIPPED</span>' : ''}</div>`).join('');
  showModal('collection-modal');
});
document.getElementById('collection-close').addEventListener('click', () => hideModal('collection-modal'));
document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener('click', (event) => { if (event.target === backdrop) hideModal(backdrop.id); }));
document.addEventListener('keydown', (event) => {
  const modal = document.querySelector('.modal-backdrop:not([hidden])');
  if (!modal) return;
  if (event.key === 'Escape') {
    hideModal(modal.id);
  } else if (event.key === 'Tab') {
    const focusable = [...modal.querySelectorAll('button:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => element.getClientRects().length);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

const ball = document.getElementById('practice-ball');
const aimLine = document.getElementById('aim-line');

ball.addEventListener('pointerdown', (event) => {
  if (shotInProgress) return;
  event.preventDefault();
  ball.setPointerCapture(event.pointerId);
  dragStart = { x: event.clientX, y: event.clientY };
  aimLine.style.display = 'block';
});

ball.addEventListener('pointermove', (event) => {
  if (!dragStart || shotInProgress) return;
  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;
  lastPower = Math.min(100, Math.round(Math.hypot(dx, dy) / 1.5));
  aimLine.style.width = `${Math.min(120, Math.hypot(dx, dy))}px`;
  aimLine.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  document.getElementById('power-value').textContent = `${lastPower}% power`;
});

ball.addEventListener('pointerup', () => {
  if (!dragStart || shotInProgress) return;
  dragStart = null;
  aimLine.style.display = 'none';
  takeShot();
});
ball.addEventListener('pointercancel', () => { dragStart = null; aimLine.style.display = 'none'; });
ball.addEventListener('keydown', (event) => { if ((event.key === 'Enter' || event.key === ' ') && !shotInProgress) { event.preventDefault(); lastPower = 50; takeShot(); } });

function takeShot() {
  shotInProgress = true;
  const generation = practiceGeneration;
  const course = document.getElementById('practice-course');
  const hole = course.querySelector('.practice-hole');
  const ballRect = ball.getBoundingClientRect();
  const holeRect = hole.getBoundingClientRect();
  const dx = holeRect.left + holeRect.width / 2 - (ballRect.left + ballRect.width / 2);
  const dy = holeRect.top + holeRect.height / 2 - (ballRect.top + ballRect.height / 2);
  const weak = lastPower < 25;
  if (weak) document.getElementById('wind-effect').classList.add('active');
  document.getElementById('practice-result').textContent = weak ? 'A helpful breeze picks up…' : 'Looking good…';
  const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : 1700;
  const animation = ball.animate([
    { transform: 'translate(-50%,-50%)', offset: 0 },
    { transform: `translate(calc(-50% + ${dx * .38}px),calc(-50% + ${dy * .12 - 20}px))`, offset: .4 },
    { transform: `translate(calc(-50% + ${dx * .72}px),calc(-50% + ${dy * .68 + 16}px))`, offset: .72 },
    { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.25)`, offset: 1 }
  ], { duration, easing: 'ease-in-out', fill: 'forwards' });
  activeShotAnimation = animation;
  animation.onfinish = () => {
    if (generation !== practiceGeneration) return;
    activeShotAnimation = null;
    ball.style.opacity = '0';
    animation.cancel();
    const earned = 350 + Math.min(200, progress.holeCount * 25);
    progress.xp += earned;
    progress.holeCount += 1;
    saveProgress();
    render();
    document.getElementById('practice-result').textContent = `HOLE IN ONE! +${earned} XP`;
    document.getElementById('power-value').textContent = 'Perfect, obviously.';
    document.getElementById('back-to-shop').hidden = false;
    burstConfetti(85);
  };
}

render();
