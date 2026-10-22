/* Deterministic gear beyond the six hand-designed drops. Tier numbers are 1-based.
   Every player sees the same three choices at each of the 1,000 milestones. */
(function () {
  const MAX_TIER = 1000;
  const eras = ['Ignition', 'Afterglow', 'Starlight', 'Hyperdrive', 'Supercharged', 'Solar Flare', 'Stardust', 'Moonshot', 'Gravity Rush', 'Nebula', 'Nova', 'Infinity'];
  const clubKinds = [
    { name: 'Driver', type: 'POWER DRIVER', tag: 'DISTANCE', icon: '✷', bias: [4, 1, 0], hue: 20 },
    { name: 'Wedge', type: 'SKY WEDGE', tag: 'AIR TIME', icon: '✧', bias: [0, 4, 1], hue: 187 },
    { name: 'Iron', type: 'TRICK IRON', tag: 'WILD CARD', icon: '✦', bias: [1, 0, 4], hue: 276 }
  ];
  const ballKinds = [
    { name: 'Rebound', type: 'BOUNCE BALL', tag: 'BIG BOUNCE', pattern: 'bolt', bias: [4, 1, 0], hue: 20 },
    { name: 'Whirl', type: 'SPIN BALL', tag: 'MAX SPIN', pattern: 'spiral', bias: [0, 4, 1], hue: 188 },
    { name: 'Glide', type: 'ROLL BALL', tag: 'LONG ROLL', pattern: 'wave', bias: [1, 0, 4], hue: 275 }
  ];
  const marks = ['star', 'diamond', 'ring', 'flame', 'quasar', 'crown', 'daybreak', 'disco'];
  function valid(tier, choice) { return Number.isInteger(tier) && tier >= 7 && tier <= MAX_TIER && Number.isInteger(choice) && choice >= 0 && choice < 3; }
  function era(tier) { return eras[Math.min(eras.length - 1, Math.floor((tier - 7) / 83))]; }
  function color(hue, saturation, lightness) { return `hsl(${((hue % 360) + 360) % 360} ${saturation}% ${lightness}%)`; }
  function stats(tier, bias) {
    const value = 16 + Math.floor((tier - 6) * 1.25);
    return bias.map(amount => value + amount);
  }
  function threshold(kind, tier) {
    if (!Number.isInteger(tier) || tier < 7 || tier > MAX_TIER) return null;
    const n = tier - 6;
    return kind === 'ball' ? 23000 + 4600 * n + 118 * n * n : 24000 + 4800 * n + 120 * n * n;
  }
  function clubId(tier, choice) { return `club-t${tier}-${'abc'[choice]}`; }
  function ballId(tier, choice) { return `ball-t${tier}-${'abc'[choice]}`; }
  function club(tier, choice) {
    if (!valid(tier, choice)) return null;
    const kind = clubKinds[choice];
    const hue = kind.hue + tier * 137.508;
    const name = `${era(tier)} ${kind.name} ${String(tier).padStart(3, '0')}`;
    return { id: clubId(tier, choice), name, description: `Tier ${tier} ${kind.name.toLowerCase()} with a brighter finish.`, type: kind.type, tag: kind.tag,
      art: 'generated', color: color(hue, 77, 55), grip: color(hue + 7, 55, 30), stats: stats(tier, kind.bias),
      icon: kind.icon, rarity: Math.min(11, 6 + Math.floor((tier - 7) / 100)), rank: tier, family: choice };
  }
  function ball(tier, choice) {
    if (!valid(tier, choice)) return null;
    const kind = ballKinds[choice];
    const hue = kind.hue + tier * 137.508;
    return { id: ballId(tier, choice), name: `${era(tier)} ${kind.name} ${String(tier).padStart(3, '0')}`,
      type: kind.type, tag: kind.tag, description: `Tier ${tier} ball with a new finish.`,
      color: color(hue, 84, 69), accent: color(hue + 10, 68, 40), stats: stats(tier, kind.bias),
      pattern: tier % 5 === 0 ? marks[Math.floor(tier / 5) % marks.length] : kind.pattern,
      rarity: Math.min(11, 6 + Math.floor((tier - 7) / 100)), rank: tier, family: choice };
  }
  function label(tier) { return tier <= 6 ? ['FIRST DROP', 'BOOSTED', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'][tier - 1] : `${era(tier).toUpperCase()} DROP`; }
  window.GearProgression = { MAX_TIER, threshold, clubId, ballId, club, ball, label };
}());
