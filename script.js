const STORAGE_KEY = 'hole-in-one-progress-v1';
const balls = window.BallUpgrades.catalog;
const ballTiers = window.BallUpgrades.tiers;

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
  aurora: { name: 'Aurora Ace', description: 'For the most beautiful possible detour.', type: 'LEGEND IRON', tag: 'RARE FIND', art: 'aurora', color: '#4caa97', grip: '#31736f', stats: [8, 9, 10], icon: '❋' },
  wildfire: { name: 'Wildfire', description: 'The fairway lights up when you swing.', type: 'INFERNO DRIVER', tag: 'HOT SHOT', art: 'wildfire', color: '#ed8242', grip: '#9b3e32', stats: [11, 8, 10], icon: '✹', rarity: 4 },
  starlift: { name: 'Starlift', description: 'A silver streak across the sky.', type: 'ORBIT WEDGE', tag: 'SKY HIGH', art: 'starlift', color: '#7f9be6', grip: '#465a9c', stats: [9, 12, 10], icon: '✧', rarity: 4 },
  ripple: { name: 'Ripple Maker', description: 'Turns every bank shot into a show.', type: 'WAVE IRON', tag: 'TRICK MASTER', art: 'ripple', color: '#51b9ba', grip: '#367c87', stats: [10, 10, 12], icon: '≋', rarity: 4 },
  thunderhead: { name: 'Thunderhead', description: 'A storm packed into a perfect swing.', type: 'STORM DRIVER', tag: 'POWER PLAY', art: 'thunderhead', color: '#a277d2', grip: '#60458f', stats: [13, 10, 11], icon: 'ϟ', rarity: 5 },
  sunforge: { name: 'Sunforge', description: 'Forged for impossible launches.', type: 'SOLAR WEDGE', tag: 'GOLDEN HOUR', art: 'sunforge', color: '#efb655', grip: '#a06035', stats: [11, 14, 10], icon: '☼', rarity: 5 },
  mirage: { name: 'Mirage Maker', description: 'One swing, a dozen ways to win.', type: 'ILLUSION IRON', tag: 'SHOWSTOPPER', art: 'mirage', color: '#d67ead', grip: '#88446d', stats: [11, 11, 14], icon: '◇', rarity: 5 },
  supernova: { name: 'Supernova', description: 'The whole course feels the launch.', type: 'GALAXY DRIVER', tag: 'MYTHIC', art: 'supernova', color: '#e57f58', grip: '#7e3d70', stats: [16, 12, 13], icon: '✺', rarity: 6 },
  skycrown: { name: 'Skycrown', description: 'For the longest, brightest flight.', type: 'CELESTIAL WEDGE', tag: 'MYTHIC', art: 'skycrown', color: '#76b6df', grip: '#4d599e', stats: [13, 16, 12], icon: '♛', rarity: 6 },
  kaleido: { name: 'Kaleido King', description: 'Every bounce draws a new masterpiece.', type: 'PRISM IRON', tag: 'MYTHIC', art: 'kaleido', color: '#b68cdb', grip: '#5f6da2', stats: [12, 13, 16], icon: '✦', rarity: 6 }
};

const tiers = [
  { threshold: 1000, choices: ['meteor', 'cloud', 'lightning'] },
  { threshold: 2600, choices: ['orbit', 'lotus', 'volt'] },
  { threshold: 5200, choices: ['nebula', 'rocket', 'aurora'] },
  { threshold: 9000, choices: ['wildfire', 'starlift', 'ripple'] },
  { threshold: 15000, choices: ['thunderhead', 'sunforge', 'mirage'] },
  { threshold: 24000, choices: ['supernova', 'skycrown', 'kaleido'] }
];
const progression = window.GearProgression;
if (progression) {
  for (let tier = 7; tier <= progression.MAX_TIER; tier++) {
    const choices = [0, 1, 2].map(choice => {
      const club = progression.club(tier, choice);
      clubs[club.id] = club;
      return club.id;
    });
    tiers.push({ threshold: progression.threshold('club', tier), choices });
  }
}
const tierLabel = (index) => progression?.label(index + 1) || ['FIRST DROP', 'BOOSTED', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'][index] || 'NEW DROP';

const initialProgress = { xp: 0, holeCount: 0, equipped: 'rookie', claimed: [], owned: ['rookie'] };
let progress = loadProgress();
let selectedId = null;
let selectedBallId = null;
let toastTimer;
let shotInProgress = false;
let dragStart = null;
let lastPower = 0;
let practiceGeneration = 0;
let activeShotAnimation = null;
let modalReturnFocus = null;
let claimRevealTimer = null;
let claimSelectedId = null;
let cartBallId = null;

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Number.isFinite(saved.xp) && Number.isInteger(saved.holeCount) && clubs[saved.equipped] && Array.isArray(saved.claimed)) {
      return window.BallUpgrades.normalize({ ...saved, xp: Math.max(0, saved.xp), holeCount: Math.max(0, saved.holeCount), equipped: saved.equipped,
        claimed: [...new Set(saved.claimed)].filter((id) => Number.isInteger(id) && id >= 0 && id < tiers.length),
        owned: [...new Set(['rookie', ...(Array.isArray(saved.owned) ? saved.owned : []), saved.equipped])].filter((id) => clubs[id]) });
    }
  } catch (_) { /* Browser storage can be unavailable in private sessions. */ }
  return window.BallUpgrades.normalize({ ...initialProgress, claimed: [], owned: ['rookie'] });
}

function saveProgress({ clubChanged = false, ballChanged = false, xpChange = null, holesChange = 0 } = {}) {
  let latest = progress;
  try {
    if (localStorage.getItem(STORAGE_KEY) !== null) latest = loadProgress();
  } catch (_) { /* Keep in-memory progress when browser storage is unavailable. */ }
  progress = {
    ...latest,
    ...progress,
    xp: Math.max(0, xpChange === null ? progress.xp : latest.xp + xpChange),
    holeCount: holesChange ? latest.holeCount + holesChange : Math.max(latest.holeCount, progress.holeCount),
    equipped: clubChanged ? progress.equipped : latest.equipped,
    equippedBall: ballChanged ? progress.equippedBall : latest.equippedBall,
    claimed: [...new Set([...latest.claimed, ...progress.claimed])],
    owned: [...new Set([...latest.owned, ...progress.owned])],
    claimedBallTiers: [...new Set([...latest.claimedBallTiers, ...progress.claimedBallTiers])],
    ownedBalls: [...new Set([...latest.ownedBalls, ...progress.ownedBalls])]
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* Keep this session playable without storage. */ }
}

function currentTierIndex() {
  const index = tiers.findIndex((_, i) => !progress.claimed.includes(i));
  return index === -1 ? tiers.length - 1 : index;
}

function allClaimed() { return progress.claimed.length >= tiers.length; }
function currentBallTierIndex() {
  const index = ballTiers.findIndex((_, i) => !progress.claimedBallTiers.includes(i));
  return index === -1 ? ballTiers.length - 1 : index;
}
function allBallsClaimed() { return progress.claimedBallTiers.length >= ballTiers.length; }

function clubArtwork(club) {
  const id = club.id || club.art;
  const elevated = club.rarity >= 4;
  return `<svg viewBox="0 0 260 170" aria-hidden="true" focusable="false">
    <defs><linearGradient id="shaft-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f9faf2"/><stop offset=".48" stop-color="#afc5ac"/><stop offset="1" stop-color="#60836c"/></linearGradient><linearGradient id="head-${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="${club.color}"/><stop offset="1" stop-color="${club.grip}"/></linearGradient></defs>
    <circle cx="125" cy="87" r="59" fill="#fff" opacity=".12"/>
    ${elevated ? `<circle cx="126" cy="86" r="72" fill="none" stroke="${club.color}" stroke-width="${club.rarity - 1}" opacity=".48" stroke-dasharray="${club.rarity === 6 ? '2 8' : '12 12'}"/><path d="M35 87h20m143 0h20M126 4v15m0 135v15" stroke="${club.color}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` : ''}
    <path d="M113 128 L178 20" stroke="#688575" stroke-width="8" stroke-linecap="round"/>
    <path d="M113 128 L178 20" stroke="url(#shaft-${id})" stroke-width="5" stroke-linecap="round"/>
    <path d="M166 39 L180 17" stroke="${club.grip}" stroke-width="10" stroke-linecap="round"/>
    <path d="M166 39 L180 17" stroke="#fff" stroke-opacity=".38" stroke-width="2" stroke-linecap="round"/>
    <path d="M73 126 C90 116 111 117 128 129 L139 144 Q116 165 83 154 L66 146 Q61 138 73 126Z" fill="url(#head-${id})" stroke="${club.grip}" stroke-width="2"/>
    <path d="M72 135 C92 139 113 141 135 139" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
    <path d="M77 143 C92 149 114 152 130 146" fill="none" stroke="${club.grip}" stroke-opacity=".5" stroke-width="2"/>
    <text x="89" y="141" font-family="Outfit, sans-serif" font-size="22" font-weight="800" fill="#fff" opacity=".8">${club.icon}</text>
    ${club.rank ? `<text x="113" y="149" text-anchor="middle" font-family="Outfit, sans-serif" font-size="9" font-weight="900" fill="#fff" opacity=".9">${String(club.rank).padStart(3, '0')}</text>` : ''}
    ${elevated ? `<path d="M79 124Q103 111 128 127" fill="none" stroke="#fff9d6" stroke-width="3" opacity=".8"/><circle cx="101" cy="150" r="4" fill="#fff8cf"/>` : ''}
    <circle cx="187" cy="62" r="3" fill="#fff" opacity=".9"/><circle cx="61" cy="74" r="2" fill="#fff" opacity=".8"/>
  </svg>`;
}

function statRow(label, value) {
  return `<div class="stat-row"><span>${label}</span><strong class="stat-number">${value}</strong></div>`;
}
function priceBadge(value) {
  return value >= 1000000 ? `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M XP` : `${value.toLocaleString()} XP`;
}

function render() {
  const tierIndex = currentTierIndex();
  const tier = tiers[tierIndex];
  const unlocked = progress.xp >= tier.threshold;
  const complete = allClaimed();
  if (complete) selectedId = progress.equipped;
  else if (!tier.choices.includes(selectedId)) selectedId = tier.choices[0];

  document.getElementById('hero-description').textContent = complete
    ? allBallsClaimed() ? 'More adventures await.' : 'Ball upgrades await.'
    : unlocked
      ? 'Pick a club + ball. Play a hole.'
      : 'Sink shots. Upgrade.';

  const wallet = document.getElementById('wallet-xp');
  wallet.innerHTML = `${progress.xp.toLocaleString()} <span>XP</span>`;
  wallet.classList.toggle('large-total', progress.xp >= 1000000);
  wallet.classList.toggle('very-large-total', progress.xp >= 100000000);
  document.getElementById('hole-count').textContent = `${progress.holeCount} perfect shot${progress.holeCount === 1 ? '' : 's'} so far`;
  document.getElementById('equipped-name').textContent = clubs[progress.equipped].name;
  document.getElementById('equipped-sub').textContent = clubs[progress.equipped].description;
  document.getElementById('equipped-ball-name').textContent = balls[progress.equippedBall].name;
  document.getElementById('equipped-ball-dot').style.setProperty('--equipped-ball-color', balls[progress.equippedBall].color);

  document.getElementById('reward-kicker').textContent = complete ? 'NEXT DROP' : `TIER ${String(tierIndex + 1).padStart(2, '0')}`;
  const rewardTitle = document.getElementById('reward-title');
  if (complete || unlocked) rewardTitle.textContent = complete ? 'More clubs are brewing.' : 'New clubs ready.';
  else rewardTitle.innerHTML = `<span class="xp-inline">${Math.max(0, tier.threshold - progress.xp).toLocaleString()} XP</span> to go.`;
  document.getElementById('meter-caption').textContent = `${progress.xp.toLocaleString()} / ${tier.threshold.toLocaleString()} XP`;
  document.getElementById('meter-status').textContent = complete ? 'COMING SOON' : unlocked ? 'READY TO BUY' : 'KEEP SWINGING';
  document.getElementById('meter-fill').style.width = `${Math.min(100, progress.xp / tier.threshold * 100)}%`;
  document.getElementById('section-index').textContent = `TIER ${String(tierIndex + 1).padStart(2, '0')} · ${tierLabel(tierIndex)}`;
  document.getElementById('club-heading').textContent = complete ? 'More clubs incoming.' : unlocked ? 'Pick your club.' : 'Coming up.';
  document.getElementById('section-description').textContent = complete ? 'The next drop is taking shape.' : unlocked ? 'One of three is yours.' : 'Keep sinking shots.';
  document.getElementById('selection-note-text').textContent = complete ? 'MORE TO COME' : 'CHOOSE ONE OF THREE';

  const grid = document.getElementById('club-grid');
  grid.innerHTML = tier.choices.map((id, index) => {
    const club = clubs[id];
    const selected = selectedId === id;
    return `<button class="club-card ${selected ? 'selected' : ''} ${unlocked && !complete ? 'available' : ''} ${!unlocked && !complete ? 'locked' : ''}" type="button" data-club="${id}" aria-pressed="${selected}" ${complete ? 'disabled' : ''}>
      <div class="club-art ${club.art}" ${club.rank ? `style="--club-color:${club.color};--club-grip:${club.grip}"` : ''}><span class="price-badge" title="${tier.threshold.toLocaleString()} XP">${priceBadge(tier.threshold)}</span><span class="art-spark one">✦</span><span class="art-spark two">✳</span>${clubArtwork(club)}<span class="card-check">${selected ? '✓' : ''}</span></div>
      <div class="card-body"><div class="card-row"><span class="card-kicker">${club.type}</span><span class="card-tag">${club.tag}</span></div><h3>${club.name}</h3>
        ${statRow('DISTANCE', club.stats[0])}${statRow('HEIGHT', club.stats[1])}${statRow('TRICKS', club.stats[2])}
        <div class="card-bottom"><span>${complete ? progress.owned.includes(id) ? 'IN YOUR BAG' : 'NOT CHOSEN' : unlocked ? 'ADD TO CART' : `<span class="xp-inline">${Math.max(0, tier.threshold - progress.xp).toLocaleString()} XP</span> SHORT`}</span><span class="card-arrow">↗</span></div>
      </div></button>`;
  }).join('');
  grid.querySelectorAll('[data-club]').forEach((button) => button.addEventListener('click', () => {
    selectedId = button.dataset.club;
    if (unlocked) openClaimCart(selectedId);
    else {
      render();
      grid.querySelector(`[data-club="${selectedId}"]`).focus();
    }
  }));

  const selected = clubs[selectedId];
  document.querySelector('.selection-caption').textContent = complete ? 'CURRENTLY EQUIPPED' : unlocked ? 'YOUR PICK' : 'UP NEXT';
  document.getElementById('selected-name').textContent = selected.name;
  document.getElementById('selection-price').textContent = complete ? 'UNLOCKED' : `${tier.threshold.toLocaleString()} XP`;
  const claimButton = document.getElementById('claim-button');
  claimButton.disabled = complete || !unlocked;
  claimButton.querySelector('span:first-child').textContent = complete ? 'New drop coming soon' : unlocked ? 'Add to cart' : 'Keep swinging';

  const ballTierIndex = currentBallTierIndex();
  const ballTier = ballTiers[ballTierIndex];
  const ballsComplete = allBallsClaimed();
  const ballsUnlocked = !ballsComplete && progress.xp >= ballTier.threshold;
  if (ballsComplete) selectedBallId = progress.equippedBall;
  else if (!ballTier.choices.includes(selectedBallId)) selectedBallId = ballTier.choices[0];
  document.getElementById('ball-section-index').textContent = ballsComplete ? 'NEXT BALL DROP' : `BALL DROP ${String(ballTierIndex + 1).padStart(2, '0')} · ${tierLabel(ballTierIndex)}`;
  document.getElementById('ball-heading').textContent = ballsComplete ? 'More balls incoming.' : ballsUnlocked ? 'Pick your ball.' : 'Next ball drop.';
  document.getElementById('ball-section-description').innerHTML = ballsComplete ? 'The next drop is taking shape.' : ballsUnlocked ? 'One of three. Add it to your cart.' : `<span class="xp-inline">${(ballTier.threshold - progress.xp).toLocaleString()} XP</span> to buy.`;
  const ballGrid = document.getElementById('ball-grid');
  ballGrid.innerHTML = ballTier.choices.map((id) => {
    const item = balls[id];
    const selected = selectedBallId === id;
    const state = ballsComplete ? progress.ownedBalls.includes(id) ? 'IN YOUR BAG' : 'NOT CHOSEN' : ballsUnlocked ? 'ADD TO CART' : `<span class="xp-inline">${(ballTier.threshold - progress.xp).toLocaleString()} XP</span> SHORT`;
    return `<button class="ball-card ${selected ? 'selected' : ''} ${ballsUnlocked ? 'available' : 'locked'}" type="button" data-ball="${id}" aria-pressed="${selected}" ${ballsComplete ? 'disabled' : ''}><div class="ball-art ${item.rank ? 'generated' : ''}" ${item.rank ? `style="--ball-color:${item.color};--ball-accent:${item.accent}"` : ''}><span class="price-badge" title="${ballTier.threshold.toLocaleString()} XP">${priceBadge(ballTier.threshold)}</span>${window.BallUpgrades.artwork(id)}<span class="card-check">${selected ? '✓' : ''}</span></div><div class="ball-card-body"><div class="card-row"><span class="card-kicker">${item.type}</span><span class="card-tag">${item.tag}</span></div><h3>${item.name}</h3><div class="ball-stats">${statRow('BOUNCE', item.stats[0])}${statRow('SPIN', item.stats[1])}${statRow('ROLL', item.stats[2])}</div><div class="card-bottom"><span>${state}</span><span class="card-arrow">↗</span></div></div></button>`;
  }).join('');
  ballGrid.querySelectorAll('[data-ball]').forEach((button) => button.addEventListener('click', () => {
    selectedBallId = button.dataset.ball;
    if (ballsUnlocked) openClaimCart(null, selectedBallId);
    else { render(); ballGrid.querySelector(`[data-ball="${selectedBallId}"]`)?.focus(); }
  }));
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

function openClaimCart(clubId = null, ballId = null) {
  progress = loadProgress();
  const clubTier = tiers[currentTierIndex()];
  const ballTier = ballTiers[currentBallTierIndex()];
  const canClub = !allClaimed() && progress.xp >= clubTier.threshold;
  const canBall = !allBallsClaimed() && progress.xp >= ballTier.threshold;
  claimSelectedId = canClub && clubTier.choices.includes(clubId) ? clubId : null;
  cartBallId = canBall && ballTier.choices.includes(ballId) ? ballId : null;
  // A club and ball fit in the same two-click purchase when the balance covers both.
  if (claimSelectedId && !cartBallId && canBall && progress.xp >= clubTier.threshold + ballTier.threshold)
    cartBallId = ballTier.choices.includes(selectedBallId) ? selectedBallId : ballTier.choices[0];
  else if (cartBallId && !claimSelectedId && canClub && progress.xp >= clubTier.threshold + ballTier.threshold)
    claimSelectedId = clubTier.choices.includes(selectedId) ? selectedId : clubTier.choices[0];
  if (!claimSelectedId && !cartBallId) return;

  const dialog = document.querySelector('#claim-modal .claim-dialog');
  dialog.classList.remove('celebrating', 'revealed');
  document.getElementById('claim-close').setAttribute('aria-label', 'Close cart');
  document.getElementById('claim-title').textContent = 'Ready to roll?';
  document.getElementById('claim-intro').textContent = 'Choose your gear. Spend XP. Take it to the course.';
  const clubChoices = document.getElementById('claim-cart-choices');
  clubChoices.innerHTML = canClub
    ? `<button class="cart-choice cart-none" type="button" data-cart-club="" aria-pressed="false">No club</button>${clubTier.choices.map(id => `<button class="cart-choice" type="button" data-cart-club="${id}" aria-pressed="false">${clubs[id].name}</button>`).join('')}`
    : `<span class="cart-unavailable">${allClaimed() ? 'New club drop incoming' : `${Math.max(0, clubTier.threshold - progress.xp).toLocaleString()} XP to next club`}</span>`;
  clubChoices.querySelectorAll('[data-cart-club]').forEach(button => button.addEventListener('click', () => updateCartChoice(button.dataset.cartClub || null)));
  const ballChoices = document.getElementById('claim-ball-choices');
  ballChoices.innerHTML = canBall
    ? `<button class="cart-choice cart-none" type="button" data-cart-ball="" aria-pressed="false">No ball</button>${ballTier.choices.map((id, i) => `<button class="cart-choice cart-ball-choice" type="button" data-cart-ball="${id}" aria-pressed="false"><span class="cart-ball-dot" style="--cart-ball:${balls[id].color}"></span><span>${balls[id].name}${i === 0 ? '<small>★ POPULAR</small>' : ''}</span></button>`).join('')}`
    : `<span class="cart-unavailable">${allBallsClaimed() ? 'New ball drop incoming' : `${Math.max(0, ballTier.threshold - progress.xp).toLocaleString()} XP to next ball`}</span>`;
  ballChoices.querySelectorAll('[data-cart-ball]').forEach(button => button.addEventListener('click', () => updateCartBallChoice(button.dataset.cartBall || null)));
  document.getElementById('claim-announcement').textContent = '';
  document.getElementById('claim-back').hidden = false;
  document.getElementById('claim-confirm').hidden = false;
  document.getElementById('claim-done').hidden = true;
  clubChoices.hidden = false;
  ballChoices.hidden = false;
  renderCart();
  showModal('claim-modal');
  document.getElementById('claim-confirm').focus();
}

function updateCartChoice(id) {
  if (id && (allClaimed() || !tiers[currentTierIndex()].choices.includes(id))) return;
  claimSelectedId = id;
  if (id) selectedId = id;
  render();
  renderCart();
}
function updateCartBallChoice(id) {
  if (id && (allBallsClaimed() || !ballTiers[currentBallTierIndex()].choices.includes(id))) return;
  cartBallId = id;
  if (id) selectedBallId = id;
  render();
  renderCart();
}
function renderCart() {
  const itemCount = Number(!!claimSelectedId) + Number(!!cartBallId);
  const clubCost = claimSelectedId ? tiers[currentTierIndex()].threshold : 0;
  const ballCost = cartBallId ? ballTiers[currentBallTierIndex()].threshold : 0;
  const needed = clubCost + ballCost;
  document.getElementById('claim-intro').textContent = itemCount === 2
    ? 'Two upgrades. One satisfying checkout.'
    : 'Your next upgrade is one tap away.';
  document.getElementById('claim-step').textContent = `YOUR CART / ${itemCount} ITEM${itemCount === 1 ? '' : 'S'}`;
  document.getElementById('claim-art').innerHTML = `<div class="cart-art-pair">${claimSelectedId ? `<div class="cart-art-club">${clubArtwork(clubs[claimSelectedId])}</div>` : ''}${cartBallId ? `<div class="cart-art-ball">${window.BallUpgrades.artwork(cartBallId)}</div>` : ''}</div>`;
  document.getElementById('claim-cost').textContent = clubCost ? `${clubCost.toLocaleString()} XP` : '—';
  document.getElementById('claim-ball-cost').textContent = ballCost ? `${ballCost.toLocaleString()} XP` : '—';
  document.getElementById('claim-balance').textContent = `${progress.xp.toLocaleString()} XP`;
  document.getElementById('claim-needed').textContent = needed ? `${needed.toLocaleString()} XP` : '—';
  document.getElementById('claim-after').textContent = needed > progress.xp ? `${(needed - progress.xp).toLocaleString()} XP SHORT` : `${(progress.xp - needed).toLocaleString()} XP`;
  document.getElementById('claim-confirm-price').textContent = needed ? `${needed.toLocaleString()} XP` : '';
  document.getElementById('claim-confirm-text').textContent = itemCount === 2 ? 'Purchase both' : claimSelectedId ? 'Purchase club' : cartBallId ? 'Purchase ball' : 'Choose gear';
  document.getElementById('claim-confirm').disabled = !itemCount || progress.xp < needed;
  document.querySelectorAll('[data-cart-club]').forEach(button => {
    const selected = (button.dataset.cartClub || null) === claimSelectedId;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected);
  });
  document.querySelectorAll('[data-cart-ball]').forEach(button => {
    const selected = (button.dataset.cartBall || null) === cartBallId;
    button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected);
  });
}

document.getElementById('claim-button').addEventListener('click', () => openClaimCart(selectedId));

document.getElementById('claim-confirm').addEventListener('click', () => {
  progress = loadProgress();
  const clubTierIndex = currentTierIndex();
  const ballTierIndex = currentBallTierIndex();
  const validClub = claimSelectedId && !allClaimed() && tiers[clubTierIndex].choices.includes(claimSelectedId);
  const validBall = cartBallId && !allBallsClaimed() && ballTiers[ballTierIndex].choices.includes(cartBallId);
  const needed = (validClub ? tiers[clubTierIndex].threshold : 0) + (validBall ? ballTiers[ballTierIndex].threshold : 0);
  if ((claimSelectedId && !validClub) || (cartBallId && !validBall) || (!validClub && !validBall) || progress.xp < needed) {
    hideModal('claim-modal');
    render();
    showToast('Your cart refreshed. Pick the next drop.');
    return;
  }
  const chosenClub = validClub ? clubs[claimSelectedId] : null;
  const chosenBall = validBall ? balls[cartBallId] : null;
  if (validClub) {
    progress.equipped = claimSelectedId;
    progress.claimed.push(clubTierIndex);
    progress.owned.push(claimSelectedId);
  }
  if (validBall) {
    progress.equippedBall = cartBallId;
    progress.claimedBallTiers.push(ballTierIndex);
    progress.ownedBalls.push(cartBallId);
  }
  saveProgress({ clubChanged: !!validClub, ballChanged: !!validBall, xpChange: -needed });
  render();

  const dialog = document.querySelector('#claim-modal .claim-dialog');
  dialog.classList.add('celebrating');
  document.getElementById('claim-step').textContent = 'PURCHASED / REVEALING';
  document.getElementById('claim-title').textContent = validClub && validBall ? 'Double upgrade!' : 'It is yours!';
  document.getElementById('claim-intro').textContent = validClub && validBall ? 'Club and ball are taking their places in the bag.' : validClub ? 'Your new club is taking its place in the bag.' : 'Your new ball is ready to roll.';
  document.getElementById('claim-after').textContent = `${progress.xp.toLocaleString()} XP`;
  document.getElementById('claim-announcement').textContent = `${[chosenClub?.name, chosenBall?.name].filter(Boolean).join(' + ')} equipped. ${progress.xp.toLocaleString()} XP left.`;
  document.getElementById('claim-cart-choices').hidden = true;
  document.getElementById('claim-ball-choices').hidden = true;
  document.getElementById('claim-back').hidden = true;
  document.getElementById('claim-confirm').hidden = true;
  document.getElementById('claim-close').focus();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  burstConfetti(reducedMotion ? 15 : 55);
  claimRevealTimer = setTimeout(() => {
    claimRevealTimer = null;
    if (document.getElementById('claim-modal').hidden) return;
    dialog.classList.remove('celebrating');
    dialog.classList.add('revealed');
    document.getElementById('claim-step').textContent = validClub && validBall ? 'NEW CLUB + BALL UNLOCKED' : validClub ? 'NEW CLUB UNLOCKED' : 'NEW BALL UNLOCKED';
    document.getElementById('claim-title').textContent = validClub && validBall ? 'A perfect pair!' : `${(chosenClub || chosenBall).name} is yours!`;
    document.getElementById('claim-intro').textContent = 'Equipped. Time for the first swing.';
    document.getElementById('claim-announcement').textContent = `${[chosenClub?.name, chosenBall?.name].filter(Boolean).join(' + ')} is in your bag.`;
    document.getElementById('claim-done').hidden = false;
    document.getElementById('claim-close').setAttribute('aria-label', 'Close gear reveal');
    document.getElementById('claim-done').focus();
    burstConfetti(reducedMotion ? 15 : 70);
  }, reducedMotion ? 100 : 1250);
});

document.getElementById('claim-close').addEventListener('click', () => hideModal('claim-modal'));
document.getElementById('claim-back').addEventListener('click', () => hideModal('claim-modal'));
document.getElementById('claim-done').addEventListener('click', () => { window.location.href = './game.html'; });

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
    cartBallId = null;
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
  const ballIds = [...new Set(['classic', ...progress.ownedBalls, progress.equippedBall])];
  document.getElementById('collection-list').innerHTML = `<div class="collection-group-title">CLUBS</div>${ids.map((id) => `<div class="collection-entry"><span class="collection-emblem">${clubs[id].icon}</span><div><strong>${clubs[id].name}</strong><small>${clubs[id].description}</small></div>${id === progress.equipped ? '<span class="collection-equipped">EQUIPPED</span>' : ''}</div>`).join('')}<div class="collection-group-title">BALLS</div>${ballIds.map((id) => `<div class="collection-entry"><span class="collection-emblem collection-ball-emblem" style="--collection-ball:${balls[id].color}">●</span><div><strong>${balls[id].name}</strong><small>${balls[id].type}</small></div>${id === progress.equippedBall ? '<span class="collection-equipped">EQUIPPED</span>' : ''}</div>`).join('')}`;
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
    const latest = loadProgress();
    const earned = 180 + Math.min(120, latest.holeCount * 12);
    saveProgress({ xpChange: earned, holesChange: 1 });
    render();
    document.getElementById('practice-result').textContent = `HOLE IN ONE! +${earned} XP`;
    document.getElementById('power-value').textContent = 'Perfect, obviously.';
    document.getElementById('back-to-shop').hidden = false;
    burstConfetti(85);
  };
}

render();
