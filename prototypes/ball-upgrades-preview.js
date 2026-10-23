/* Shared ball catalog for the Pro Shop and the course. XP is an unlock threshold,
   never a currency deducted from the player's lifetime total. */
(function () {
  const catalog = {
    classic: { name: 'Classic White', type: 'STARTER BALL', tag: 'ORIGINAL', description: 'The trusty first swing.', color: '#f8f7ed', accent: '#d86e3d', stats: [4, 4, 5], pattern: 'dot' },
    sunburst: { name: 'Sunburst', type: 'GLOW BALL', tag: 'FAN FAVORITE', description: 'A little sunshine on every bounce.', color: '#ffc95a', accent: '#e06a35', stats: [7, 5, 4], pattern: 'rays' },
    tidal: { name: 'Tidal', type: 'FLOW BALL', tag: 'SMOOTH ROLL', description: 'Finds the current. Rides it.', color: '#79d2d2', accent: '#317d9e', stats: [5, 8, 5], pattern: 'wave' },
    spark: { name: 'Spark', type: 'BOUNCE BALL', tag: 'BIG ENERGY', description: 'Every wall is a launchpad.', color: '#f5a3be', accent: '#b64a80', stats: [9, 4, 7], pattern: 'bolt' },
    ember: { name: 'Ember', type: 'FIRE BALL', tag: 'HOT STREAK', description: 'A blazing trail to the cup.', color: '#ed8b54', accent: '#a73d29', stats: [8, 6, 7], pattern: 'flame' },
    orbit: { name: 'Orbit', type: 'GRAVITY BALL', tag: 'CURVE KING', description: 'Takes the scenic route.', color: '#a9a0f5', accent: '#5446a9', stats: [6, 9, 7], pattern: 'ring' },
    vortex: { name: 'Vortex', type: 'SPIN BALL', tag: 'WILD CARD', description: 'More spin. More spectacle.', color: '#90db9d', accent: '#277e65', stats: [7, 10, 6], pattern: 'spiral' },
    nova: { name: 'Nova', type: 'STAR BALL', tag: 'COSMIC', description: 'Born for impossible angles.', color: '#f9da89', accent: '#aa6034', stats: [9, 8, 8], pattern: 'star' },
    phoenix: { name: 'Phoenix', type: 'LEGEND BALL', tag: 'LIFTOFF', description: 'Always comes back hotter.', color: '#f27f77', accent: '#973d5d', stats: [10, 8, 9], pattern: 'flame' },
    prism: { name: 'Prism', type: 'RAINBOW BALL', tag: 'RARE FIND', description: 'Every roll has a color.', color: '#b5e6eb', accent: '#9759ac', stats: [8, 10, 10], pattern: 'diamond' },
    comet: { name: 'Comet Tail', type: 'METEOR BALL', tag: 'STREAK', description: 'Leaves a trail of little stars.', color: '#ffbe73', accent: '#c75650', stats: [11, 9, 10], pattern: 'comet', rarity: 4 },
    lagoon: { name: 'Lagoon', type: 'TIDAL BALL', tag: 'SMOOTH', description: 'Rolls like a wave through every turn.', color: '#83dfdc', accent: '#337eaa', stats: [9, 11, 11], pattern: 'lagoon', rarity: 4 },
    disco: { name: 'Disco Dash', type: 'PARTY BALL', tag: 'SHOWTIME', description: 'A celebration in motion.', color: '#f3a8d5', accent: '#a653ad', stats: [10, 10, 12], pattern: 'disco', rarity: 4 },
    thunder: { name: 'Thunder Roll', type: 'STORM BALL', tag: 'HIGH VOLTAGE', description: 'Bounces with a thunderclap.', color: '#b6a1ee', accent: '#5949a8', stats: [13, 11, 11], pattern: 'thunder', rarity: 5 },
    eclipse: { name: 'Eclipse', type: 'ORBIT BALL', tag: 'RARE', description: 'A bright edge on every impossible shot.', color: '#f6d283', accent: '#5c527b', stats: [11, 13, 11], pattern: 'eclipse', rarity: 5 },
    bloom: { name: 'Bloom Burst', type: 'GARDEN BALL', tag: 'FLAIR', description: 'Every landing comes up flowers.', color: '#f5a7ad', accent: '#bd5777', stats: [11, 11, 13], pattern: 'bloom', rarity: 5 },
    quasar: { name: 'Quasar', type: 'GALAXY BALL', tag: 'MYTHIC', description: 'A whole galaxy at full speed.', color: '#b4b3fb', accent: '#624baf', stats: [16, 12, 13], pattern: 'quasar', rarity: 6 },
    daybreak: { name: 'Daybreak', type: 'SOLAR BALL', tag: 'MYTHIC', description: 'The sunrise follows your shot.', color: '#ffe088', accent: '#db7542', stats: [13, 16, 12], pattern: 'daybreak', rarity: 6 },
    royal: { name: 'Royal Flush', type: 'CROWN BALL', tag: 'MYTHIC', description: 'The king of bank shots.', color: '#b4e1eb', accent: '#5d72ac', stats: [12, 13, 16], pattern: 'crown', rarity: 6 }
  };
  const tiers = [
    { threshold: 900, choices: ['sunburst', 'tidal', 'spark'] },
    { threshold: 2400, choices: ['ember', 'orbit', 'vortex'] },
    { threshold: 5000, choices: ['nova', 'phoenix', 'prism'] },
    { threshold: 8500, choices: ['comet', 'lagoon', 'disco'] },
    { threshold: 14500, choices: ['thunder', 'eclipse', 'bloom'] },
    { threshold: 23000, choices: ['quasar', 'daybreak', 'royal'] }
  ];
  const progression = window.GearProgression;
  if (progression) {
    for (let tier = 7; tier <= progression.MAX_TIER; tier++) {
      const choices = [0, 1, 2].map(choice => {
        const item = progression.ball(tier, choice);
        catalog[item.id] = item;
        return item.id;
      });
      tiers.push({ threshold: progression.threshold('ball', tier), choices });
    }
  }
  function get(id) { return catalog[id] || catalog.classic; }
  function normalize(progress) {
    const equippedBall = catalog[progress.equippedBall] ? progress.equippedBall : 'classic';
    const ownedBalls = [...new Set(['classic', ...(Array.isArray(progress.ownedBalls) ? progress.ownedBalls : []), equippedBall])].filter(id => catalog[id]);
    const claimedBallTiers = [...new Set(Array.isArray(progress.claimedBallTiers) ? progress.claimedBallTiers : [])]
      .filter(index => Number.isInteger(index) && index >= 0 && index < tiers.length);
    return { ...progress, equippedBall, ownedBalls, claimedBallTiers };
  }
  function artwork(id) {
    const ball = get(id);
    const slug = catalog[id] ? id : 'classic';
    const marks = {
      dot: '<circle cx="100" cy="100" r="8" fill="var(--accent)"/>',
      rays: '<circle cx="100" cy="100" r="18" fill="var(--accent)"/><path d="M100 49v20m0 62v20M49 100h20m62 0h20M65 65l14 14m42 42 14 14m0-70-14 14m-42 42-14 14"/>',
      wave: '<path d="M47 79q22-21 44 0t44 0m-88 30q22-21 44 0t44 0m-71 28q22-21 44 0t44 0"/>',
      bolt: '<path d="M108 49 72 104h27l-9 48 42-63h-28z" fill="var(--accent)"/>',
      flame: '<path d="M99 45c5 23-23 30-9 52 2-13 14-21 18-27 1 25 27 30 18 58-6 21-42 27-53 6-15-29 11-48 26-89z" fill="var(--accent)"/>',
      ring: '<ellipse cx="100" cy="100" rx="53" ry="21" transform="rotate(-28 100 100)"/><circle cx="100" cy="100" r="15" fill="var(--accent)"/>',
      spiral: '<path d="M111 101c0-18-28-19-29-1-1 22 35 31 49 7 18-31-22-64-56-41-38 26-21 78 28 83"/>',
      star: '<path d="m100 49 12 35 37 1-30 22 11 36-30-22-30 22 11-36-30-22 37-1z" fill="var(--accent)"/>',
      diamond: '<path d="m100 48 43 51-43 53-43-53z"/><path d="M57 99h86M100 48l-17 51 17 53 17-53z"/>',
      comet: '<circle cx="88" cy="107" r="24"/><path d="M102 85 147 54M110 100l39-15M104 121l35 9"/>',
      lagoon: '<path d="M50 96q25-45 49 0t51 0M51 118q24-32 48 0t50 0"/><circle cx="101" cy="72" r="10"/>',
      disco: '<path d="M67 62h66l16 39-49 47-49-47zM51 101h98M67 62l33 86 33-86"/>',
      thunder: '<path d="M111 48 76 101h23l-12 51 43-65h-25z"/><path d="M58 66l-9-10M145 137l10 9"/>',
      eclipse: '<circle cx="96" cy="101" r="38"/><path d="M117 55a50 50 0 1 1-25 94"/>',
      bloom: '<circle cx="100" cy="100" r="12"/><path d="M100 88c-23-36-47-7-13 12-33 3-27 39 3 19 9 34 40 22 21-7 35-17 12-43-11-22z"/>',
      quasar: '<circle cx="100" cy="100" r="19"/><path d="M100 45v30m0 50v30M45 100h30m50 0h30M61 61l22 22m34 34 22 22m0-78-22 22m-34 34-22 22"/>',
      daybreak: '<path d="M54 121h92M68 111a32 32 0 0 1 64 0M100 46v22M60 66l16 16m64-16-16 16"/>',
      crown: '<path d="m54 78 24 19 22-36 22 36 24-19-10 57H64z"/><circle cx="100" cy="109" r="8"/>'
    };
    const rank = Number.isInteger(ball.rank) ? ball.rank : 0;
    const pips = rank ? Math.min(7, 2 + Math.floor((rank - 7) / 170)) : 0;
    const orbitPips = Array.from({ length: pips }, (_, i) => {
      const angle = -Math.PI / 2 + (i / pips) * Math.PI * 2;
      return `<circle cx="${(100 + Math.cos(angle) * 87).toFixed(1)}" cy="${(102 + Math.sin(angle) * 87).toFixed(1)}" r="${rank >= 500 ? 5 : 4}" fill="#fff9dc" stroke="${ball.accent}" stroke-width="2"/>`;
    }).join('');
    const rankBadge = rank ? `<rect x="72" y="146" width="56" height="23" rx="11.5" fill="${ball.accent}" stroke="#fff8e8" stroke-width="2"/><text x="100" y="162" text-anchor="middle" font-family="Outfit, sans-serif" font-size="15" font-weight="900" fill="#fff">${String(rank).padStart(3, '0')}</text>` : '';
    return `<svg class="ball-illustration" viewBox="0 0 200 200" aria-hidden="true" focusable="false" style="--ball:${ball.color};--accent:${ball.accent}"><defs><radialGradient id="ball-${slug}" cx="32%" cy="24%" r="75%"><stop stop-color="#fff"/><stop offset=".35" stop-color="${ball.color}"/><stop offset="1" stop-color="${ball.accent}"/></radialGradient></defs>${ball.rarity ? `<circle cx="100" cy="102" r="86" fill="none" stroke="${ball.accent}" stroke-width="${Math.min(9, ball.rarity - 1)}" opacity=".68" stroke-dasharray="${ball.rarity >= 9 ? '24 8' : ball.rarity === 6 ? '3 8' : '13 11'}"/>${orbitPips}` : ''}<circle cx="100" cy="102" r="73" fill="url(#ball-${slug})"/>${rank ? `<path d="M45 73q55-45 110 0M46 132q54 43 108 0" fill="none" stroke="#fff7df" stroke-opacity=".53" stroke-width="4" stroke-linecap="round"/>` : ''}<g fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${marks[ball.pattern]}</g>${rankBadge}<circle cx="74" cy="64" r="16" fill="#fff" opacity=".28"/><circle cx="100" cy="102" r="73" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/></svg>`;
  }
  function draw(ctx, x, y, radius, time, id) {
    const ball = get(id);
    if (id === 'classic') return;
    const r = radius;
    ctx.save();
    const inheritedAlpha = ctx.globalAlpha;
    if (ball.rarity) {
      ctx.globalAlpha = inheritedAlpha * .62;
      ctx.strokeStyle = ball.accent;
      ctx.lineWidth = Math.max(1.5, r * .12);
      ctx.shadowColor = ball.color;
      ctx.shadowBlur = Math.min(14, r * .65);
      ctx.beginPath(); ctx.arc(x, y, r * 1.015, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.beginPath(); ctx.arc(x, y, r * .96, 0, Math.PI * 2); ctx.clip();
    const tint = ctx.createRadialGradient(x - r * .36, y - r * .4, 1, x, y, r);
    tint.addColorStop(0, '#fffdf4'); tint.addColorStop(.33, ball.color); tint.addColorStop(1, ball.accent);
    ctx.globalAlpha = inheritedAlpha * .95; ctx.fillStyle = tint; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = inheritedAlpha * .85; ctx.strokeStyle = ball.accent; ctx.fillStyle = ball.accent;
    ctx.lineWidth = Math.max(1.7, r * .11); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const spin = time * .0013;
    ctx.translate(x, y); ctx.rotate(spin);
    switch (ball.pattern) {
      case 'rays':
        ctx.beginPath(); ctx.arc(0, 0, r * .22, 0, 7); ctx.fill();
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .45, Math.sin(a) * r * .45); ctx.lineTo(Math.cos(a) * r * .7, Math.sin(a) * r * .7); ctx.stroke(); } break;
      case 'wave':
        for (let i = -1; i <= 1; i++) { const yy = i * r * .28; ctx.beginPath(); ctx.moveTo(-r * .65, yy); ctx.bezierCurveTo(-r * .25, yy - r * .3, r * .2, yy + r * .3, r * .65, yy); ctx.stroke(); } break;
      case 'bolt':
        ctx.beginPath(); ctx.moveTo(r * .1, -r * .7); ctx.lineTo(-r * .28, r * .05); ctx.lineTo(r * .04, r * .05); ctx.lineTo(-r * .1, r * .7); ctx.lineTo(r * .42, -r * .15); ctx.lineTo(r * .1, -r * .15); ctx.closePath(); ctx.fill(); break;
      case 'flame':
        ctx.beginPath(); ctx.moveTo(0, -r * .72); ctx.bezierCurveTo(-r * .1, -r * .18, -r * .62, -r * .14, -r * .45, r * .35); ctx.bezierCurveTo(-r * .26, r * .82, r * .42, r * .8, r * .47, r * .25); ctx.bezierCurveTo(r * .48, -r * .1, r * .08, -r * .24, 0, -r * .72); ctx.fill(); break;
      case 'ring':
        ctx.beginPath(); ctx.ellipse(0, 0, r * .75, r * .3, -.5, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * .18, 0, 7); ctx.fill(); break;
      case 'spiral':
        ctx.beginPath(); for (let i = 0; i < 30; i++) { const a = i * .47, rr = r * (.05 + i * .02); const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.stroke(); break;
      case 'star':
        ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .28 : r * .68; const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); ctx.fill(); break;
      case 'diamond':
        ctx.beginPath(); ctx.moveTo(0, -r * .7); ctx.lineTo(r * .63, 0); ctx.lineTo(0, r * .7); ctx.lineTo(-r * .63, 0); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r * .63, 0); ctx.lineTo(r * .63, 0); ctx.moveTo(0, -r * .7); ctx.lineTo(-r * .2, 0); ctx.lineTo(0, r * .7); ctx.lineTo(r * .2, 0); ctx.lineTo(0, -r * .7); ctx.stroke(); break;
      case 'comet':
        ctx.beginPath(); ctx.arc(-r * .2, r * .12, r * .29, 0, 7); ctx.fill();
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(r * .05, i * r * .19); ctx.lineTo(r * (.5 + (i === 0 ? .16 : 0)), -r * .55 + i * r * .24); ctx.stroke(); } break;
      case 'lagoon':
        for (let i = -1; i <= 1; i++) { const yy = i * r * .24; ctx.beginPath(); ctx.moveTo(-r * .68, yy); ctx.quadraticCurveTo(-r * .3, yy - r * .36, 0, yy); ctx.quadraticCurveTo(r * .34, yy + r * .35, r * .68, yy); ctx.stroke(); } break;
      case 'disco':
        ctx.beginPath(); ctx.moveTo(-r * .58, -r * .35); ctx.lineTo(r * .58, -r * .35); ctx.lineTo(r * .69, r * .02); ctx.lineTo(0, r * .68); ctx.lineTo(-r * .69, r * .02); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r * .65, 0); ctx.lineTo(r * .65, 0); ctx.moveTo(0, -r * .35); ctx.lineTo(0, r * .66); ctx.stroke(); break;
      case 'thunder':
        ctx.beginPath(); ctx.moveTo(r * .12, -r * .72); ctx.lineTo(-r * .26, 0); ctx.lineTo(0, 0); ctx.lineTo(-r * .12, r * .72); ctx.lineTo(r * .43, -r * .12); ctx.lineTo(r * .13, -r * .12); ctx.closePath(); ctx.fill(); break;
      case 'eclipse':
        ctx.beginPath(); ctx.arc(0, 0, r * .52, 0, 7); ctx.fill();
        ctx.fillStyle = ball.color; ctx.beginPath(); ctx.arc(r * .21, -r * .17, r * .46, 0, 7); ctx.fill(); break;
      case 'bloom':
        for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * .32, Math.sin(a) * r * .32, r * .29, r * .17, a, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#fff8df'; ctx.beginPath(); ctx.arc(0, 0, r * .14, 0, 7); ctx.fill(); break;
      case 'quasar':
        ctx.beginPath(); ctx.arc(0, 0, r * .21, 0, 7); ctx.fill();
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * .36, Math.sin(a) * r * .36); ctx.lineTo(Math.cos(a) * r * .72, Math.sin(a) * r * .72); ctx.stroke(); } break;
      case 'daybreak':
        ctx.beginPath(); ctx.moveTo(-r * .68, r * .24); ctx.lineTo(r * .68, r * .24); ctx.moveTo(-r * .43, r * .19); ctx.arc(0, r * .19, r * .43, Math.PI, Math.PI * 2); ctx.stroke();
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * .35, -r * .38); ctx.lineTo(i * r * .46, -r * .6); ctx.stroke(); } break;
      case 'crown':
        ctx.beginPath(); ctx.moveTo(-r * .65, -r * .38); ctx.lineTo(-r * .31, -r * .1); ctx.lineTo(0, -r * .65); ctx.lineTo(r * .31, -r * .1); ctx.lineTo(r * .65, -r * .38); ctx.lineTo(r * .5, r * .52); ctx.lineTo(-r * .5, r * .52); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, r * .2, r * .09, 0, 7); ctx.fill(); break;
      default: {
        const glyph = '✦';
        ctx.font = `900 ${Math.max(9, r * 1.02)}px Arial, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(glyph, 0, r * .03);
      }
    }
    ctx.restore();
    if (ball.rank) {
      const count = Math.min(4, 1 + Math.floor((ball.rarity - 6) / 2));
      ctx.save();
      ctx.globalAlpha = inheritedAlpha * .9;
      ctx.fillStyle = '#fff9df';
      ctx.strokeStyle = ball.accent;
      ctx.lineWidth = Math.max(1, r * .06);
      for (let i = 0; i < count; i++) {
        const angle = time * .00065 + i * Math.PI * 2 / count;
        const px = x + Math.cos(angle) * r * 1.2;
        const py = y + Math.sin(angle) * r * 1.2;
        ctx.beginPath(); ctx.arc(px, py, Math.max(1.5, r * .12), 0, 7); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  }
  window.BallUpgrades = { catalog, tiers, get, normalize, artwork, draw };
}());
