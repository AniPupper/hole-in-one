'use strict';

// Dependency-free integration smoke test. Runs the actual shop and course
// scripts against a tiny DOM/canvas host, without opening a browser or writing
// to the player's localStorage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const progressKey = 'hole-in-one-progress-v1';
const fullSweep = process.argv.includes('--full');
const store = new Map();

function host() {
  const elements = new Map();
  const gradient = { addColorStop() {} };
  const canvas = new Proxy({
    createLinearGradient() { return gradient; },
    createRadialGradient() { return gradient; },
    measureText(value) { return { width: String(value).length * 7 }; }
  }, { get(target, name) { return name in target ? target[name] : () => {}; } });
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      id, hidden: false, disabled: false, inert: false, textContent: '', innerHTML: '',
      handlers: {}, style: { setProperty() {} },
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(event, handler) { this.handlers[event] = handler; },
      querySelector(selector) { return element(`${id} ${selector}`); },
      querySelectorAll() { return []; },
      setAttribute() {}, focus() {}, appendChild() {}, remove() {},
      getBoundingClientRect() { return { width: 1280, height: 720, left: 0, top: 0 }; },
      getContext() { return canvas; }, setPointerCapture() {}
    });
    return elements.get(id);
  }
  const document = {
    body: element('body'), activeElement: element('body'),
    getElementById: element,
    querySelector(selector) { return element(selector); },
    querySelectorAll() { return []; },
    createElement(tag) { return element(`new-${tag}-${elements.size}`); },
    addEventListener() {}
  };
  const window = {
    devicePixelRatio: 1, addEventListener() {},
    matchMedia() { return { matches: true }; },
    location: { href: '' }
  };
  const context = vm.createContext({
    document, window, Math, console,
    localStorage: {
      getItem(key) { return store.get(key) ?? null; },
      setItem(key, value) { store.set(key, String(value)); }
    },
    performance: { now: () => 1000 },
    requestAnimationFrame() {}, setTimeout() { return 1; }, clearTimeout() {}
  });
  function load(file) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file }); }
  function run(code) { return vm.runInContext(code, context); }
  load('gear-progression.js');
  load('ball-upgrades.js');
  load('course-blueprints.js');
  return { context, elements, load, run };
}

function checkCatalog(shop) {
  const result = shop.run(`(() => ({
    clubTiers: tiers.map(t => ({ threshold: t.threshold, choices: t.choices })),
    ballTiers: ballTiers.map(t => ({ threshold: t.threshold, choices: t.choices })),
    clubs: Object.keys(clubs), balls: Object.keys(balls)
  }))()`);
  for (const [label, group, catalog] of [
    ['club', result.clubTiers, result.clubs], ['ball', result.ballTiers, result.balls]
  ]) {
    assert.equal(group.length, 1000, `${label} progression needs 1,000 tiers`);
    let previous = 0;
    const seen = new Set();
    for (const tier of group) {
      assert.ok(tier.threshold > previous, `${label} thresholds must rise`);
      assert.equal(tier.choices.length, 3, `${label} tier must offer three choices`);
      assert.equal(new Set(tier.choices).size, 3, `${label} tier has duplicate choices`);
      for (const id of tier.choices) {
        assert.ok(catalog.includes(id), `${label} ${id} is missing from catalog`);
        assert.ok(!seen.has(id), `${label} ${id} appears in multiple tiers`);
        seen.add(id);
      }
      previous = tier.threshold;
    }
  }
  return result;
}

function checkShop() {
  const shop = host();
  shop.load('script.js');
  const catalog = checkCatalog(shop);
  assert.equal(shop.run('progress.xp'), 1240);
  shop.run("openClaimCart('meteor', 'sunburst')");
  assert.equal(shop.run("document.getElementById('claim-needed').textContent"), '1,000 XP');
  assert.equal(shop.run("document.getElementById('claim-confirm-text').textContent"), 'Purchase both');
  shop.elements.get('claim-confirm').handlers.click();
  let saved = JSON.parse(store.get(progressKey));
  assert.equal(saved.xp, 1240, 'combined purchase deducted lifetime XP');
  assert.equal(saved.equipped, 'meteor');
  assert.equal(saved.equippedBall, 'sunburst');
  assert.deepEqual([...saved.claimed], [0]);
  assert.deepEqual([...saved.claimedBallTiers], [0]);

  // A reload must preserve both items. A locked tier must reject a purchase.
  const reloaded = host();
  reloaded.load('script.js');
  assert.equal(reloaded.run('progress.equipped'), 'meteor');
  assert.equal(reloaded.run('progress.equippedBall'), 'sunburst');
  reloaded.run("openClaimCart('orbit', 'ember')");
  assert.equal(reloaded.run('claimSelectedId'), null);
  assert.equal(reloaded.run('cartBallId'), null);
  reloaded.elements.get('claim-confirm').handlers.click();
  assert.equal(JSON.parse(store.get(progressKey)).xp, 1240);

  // Simulate earning enough XP, then claim the next club and ball together.
  reloaded.run('progress.xp = 2600; saveProgress()');
  reloaded.run("openClaimCart('orbit', 'ember')");
  assert.equal(reloaded.run("document.getElementById('claim-needed').textContent"), '2,600 XP');
  reloaded.elements.get('claim-confirm').handlers.click();
  saved = JSON.parse(store.get(progressKey));
  assert.equal(saved.xp, 2600, 'second purchase deducted lifetime XP');
  assert.equal(saved.equipped, 'orbit');
  assert.equal(saved.equippedBall, 'ember');
  assert.deepEqual([...saved.claimed], [0, 1]);
  assert.deepEqual([...saved.claimedBallTiers], [0, 1]);

  // Generated choices must remain stable across reloads and use the same
  // lifetime-XP cart rule as the six curated drops.
  const tierSevenClub = catalog.clubTiers[6].choices[0];
  const tierSevenBall = catalog.ballTiers[6].choices[0];
  reloaded.run(`progress.xp = Math.max(tiers[6].threshold, ballTiers[6].threshold);
    progress.claimed = [0,1,2,3,4,5]; progress.claimedBallTiers = [0,1,2,3,4,5]; saveProgress()`);
  const tierSeven = host(); tierSeven.load('script.js');
  tierSeven.run(`openClaimCart('${tierSevenClub}', '${tierSevenBall}')`);
  tierSeven.elements.get('claim-confirm').handlers.click();
  saved = JSON.parse(store.get(progressKey));
  assert.equal(saved.xp, catalog.clubTiers[6].threshold);
  assert.equal(saved.equipped, tierSevenClub);
  assert.equal(saved.equippedBall, tierSevenBall);
  assert.ok(saved.claimed.includes(6) && saved.claimedBallTiers.includes(6));

  // The final milestone is reachable, does not consume XP, and cleanly caps
  // both collections after one combined purchase.
  const finalIndex = catalog.clubTiers.length - 1;
  const finalClub = catalog.clubTiers[finalIndex].choices[2];
  const finalBall = catalog.ballTiers[finalIndex].choices[2];
  tierSeven.run(`progress.xp = Math.max(tiers[999].threshold, ballTiers[999].threshold);
    progress.claimed = Array.from({length:999}, (_, i) => i);
    progress.claimedBallTiers = Array.from({length:999}, (_, i) => i); saveProgress()`);
  const finalShop = host(); finalShop.load('script.js');
  finalShop.run(`openClaimCart('${finalClub}', '${finalBall}')`);
  finalShop.elements.get('claim-confirm').handlers.click();
  saved = JSON.parse(store.get(progressKey));
  assert.equal(saved.xp, catalog.clubTiers[999].threshold);
  assert.equal(saved.equipped, finalClub);
  assert.equal(saved.equippedBall, finalBall);
  assert.equal(saved.claimed.length, 1000);
  assert.equal(saved.claimedBallTiers.length, 1000);
  const capped = host(); capped.load('script.js');
  assert.equal(capped.run('allClaimed() && allBallsClaimed()'), true);
  assert.equal(capped.run('progress.equipped'), finalClub);
  assert.equal(capped.run('progress.equippedBall'), finalBall);
  return catalog;
}

function checkCourse(catalog) {
  const game = host();
  game.load('game.js');
  game.run('frame(1016)');
  for (const tier of catalog.clubTiers) for (const id of tier.choices) {
    const appearance = game.run(`clubAppearance('${id}')`);
    assert.ok(appearance[0] !== 'putter', `equipped club ${id} fell back to Rookie artwork`);
    assert.ok(appearance[1] && appearance[2], `equipped club ${id} lacks head or grip color`);
  }
  const layoutCheck = game.run(`(() => {
    let minSpacing = Infinity, different = 0, last = '', pronouncedBends = 0;
    let leftBends = 0, rightBends = 0, sharpestStep = 0;
    const routeShapes = new Set(), routeFamilies = new Set(), titles = new Set(), signatures = new Set();
    if (window.CourseBlueprints.courses.length !== 250) throw Error('Expected 250 checked-in blueprints');
    for (let level = 1; level <= 250; level++) {
      const a = courseLayout(level), b = courseLayout(level);
      const path = [0,.2,.4,.6,.8,1].map(t => a.centerline(t));
      if (JSON.stringify([a.features,path,a.cup]) !== JSON.stringify([b.features,[0,.2,.4,.6,.8,1].map(t=>b.centerline(t)),b.cup]))
        throw Error('Non-deterministic hole ' + level);
      if (titles.has(a.title)) throw Error('Repeated title: ' + a.title);
      titles.add(a.title);
      const signature = JSON.stringify([a.span, a.cup, path, a.features]);
      if (signatures.has(signature)) throw Error('Repeated route/prop plan at hole ' + level);
      signatures.add(signature);
      if (signature !== last) different++;
      last = signature;
      // Ignore length and cup location: actual bends must vary, not just props.
      const offsets = [.2, .4, .6, .8].map(t =>
        a.centerline(t).z - (a.start.z + (a.cup.z-a.start.z)*t));
      routeShapes.add(offsets.map(value => Math.round(value * 10) / 10).join(','));
      routeFamilies.add(offsets.map(value => value > .35 ? 'R' : value < -.35 ? 'L' : '-').join(''));
      if (Math.max(...offsets.map(Math.abs)) >= .75) pronouncedBends++;
      if (offsets.some(value => value > .75)) rightBends++;
      if (offsets.some(value => value < -.75)) leftBends++;
      const samples = Array.from({length:41}, (_, i) => a.centerline(i/40));
      for (let i = 2; i < samples.length; i++) {
        const u = samples[i-1], v = samples[i-2], w = samples[i];
        const first = Math.atan2(u.z-v.z, u.x-v.x), next = Math.atan2(w.z-u.z, w.x-u.x);
        sharpestStep = Math.max(sharpestStep, Math.abs(Math.atan2(Math.sin(next-first), Math.cos(next-first))));
      }
      for (let i = 0; i <= 100; i++) {
        const t = i/100, height = a.railHeightAt(t);
        if (!Number.isFinite(height) || height < .15 || height > .56) throw Error('Invalid rail at hole ' + level);
      }
      for (let i = 0; i < a.features.length; i++) for (let j = i + 1; j < a.features.length; j++) {
        const p = a.features[i], q = a.features[j];
        minSpacing = Math.min(minSpacing, Math.hypot(p.x-q.x, p.z-q.z));
      }
    }
    for (const level of [251, 501]) {
      const a = courseLayout(level), b = courseLayout(level), base = courseLayout(1);
      if (!a.title.includes('Encore')) throw Error('Missing Encore title for hole ' + level);
      if (JSON.stringify([a.title,a.cup,a.centerline(.25),a.centerline(.5),a.centerline(.75)]) !==
          JSON.stringify([b.title,b.cup,b.centerline(.25),b.centerline(.5),b.centerline(.75)]))
        throw Error('Non-deterministic Encore hole ' + level);
      const shift = Math.max(Math.abs(a.cup.z-base.cup.z), ...[.25,.5,.75].map(t=>Math.abs(a.centerline(t).z-base.centerline(t).z)));
      if (shift < .4) throw Error('Encore route has no visible variation at hole ' + level);
    }
    return { minSpacing, different, titles: titles.size, routeShapes: routeShapes.size,
      routeFamilies: routeFamilies.size, pronouncedBends, leftBends, rightBends, sharpestStep };
  })()`);
  assert.equal(layoutCheck.different, 250, 'two courses reused the same layout');
  assert.equal(layoutCheck.titles, 250, 'two courses reused the same title');
  assert.ok(layoutCheck.minSpacing > 1.5, `course features overlap: ${layoutCheck.minSpacing.toFixed(2)} world units`);
  assert.ok(layoutCheck.routeShapes >= 220, 'later holes repeat the same path bends');
  assert.ok(layoutCheck.routeFamilies >= 8, 'routes need distinct turn patterns');
  assert.ok(layoutCheck.pronouncedBends >= 200, 'too many routes are nearly straight');
  assert.ok(layoutCheck.leftBends >= 70 && layoutCheck.rightBends >= 70, 'routes only turn one way');
  assert.ok(layoutCheck.sharpestStep < .5, 'route has a sharp rail cusp');

  const sweep = game.run(`(() => {
    let count = 0, longest = 0, largestStep = 0, furthestFinish = 0, fullCount = 0;
    const finalClub = window.GearProgression.clubId(1000,2);
    const finalBall = window.GearProgression.ballId(1000,2);
    function trace(level,power,vector) {
      phase = 'ready'; courseState = { level, completed: false }; setLayout(level);
      ball = {...START}; trail = []; shot = null; sparkles = [];
      updateCamera(1000);
      const beforeXp = savedProgress.xp, beforeCount = savedProgress.holeCount;
      startShot(power, vector);
      let steps = 0;
      for (; steps < 120 * 60 && phase === 'running'; steps++) {
        const before = {...ball}; stepPhysics(1/120);
        largestStep = Math.max(largestStep, Math.hypot(ball.x-before.x, ball.y-before.y, ball.z-before.z));
      }
      if (phase !== 'complete') throw Error('Shot stalled at hole ' + level + ', power ' + power + ', aim ' + JSON.stringify(vector));
      if (savedProgress.holeCount !== beforeCount + 1) throw Error('Incorrect hole-in-one count at level ' + level);
      if (savedProgress.xp <= beforeXp) throw Error('No XP reward at level ' + level);
      const rewardedXp = savedProgress.xp;
      stepPhysics(1/120);
      if (savedProgress.xp !== rewardedXp) throw Error('Duplicate XP reward at level ' + level);
      furthestFinish = Math.max(furthestFinish, Math.hypot(ball.x-CUP.x, ball.z-CUP.z));
      longest = Math.max(longest, steps/120); count++;
    }
    savedProgress.equipped='rookie'; savedProgress.equippedBall='classic'; save(PROGRESS_KEY,savedProgress);
    const levels = [1,2,4,5,7,10,20,50,100,150,200,250];
    const vectors = [{x:160,y:0}, {x:0,y:160}, {x:-160,y:0}];
    for(const level of levels) for(const power of [0,100]) for(const vector of vectors) trace(level,power,vector);
    for(const tier of [7,500,1000]) {
      savedProgress.equipped=window.GearProgression.clubId(tier,0);
      savedProgress.equippedBall=window.GearProgression.ballId(tier,0);
      save(PROGRESS_KEY,savedProgress);
      for(const level of [7,100,250]) {
        trace(level,0,{x:160,y:0}); trace(level,58,{x:0,y:160}); trace(level,100,{x:-160,y:0});
      }
    }
    if (${fullSweep ? 'true' : 'false'}) {
      savedProgress.equipped='rookie'; savedProgress.equippedBall='classic'; save(PROGRESS_KEY,savedProgress);
      for(let level=1;level<=250;level++){trace(level,58,{x:160,y:0});fullCount++;}
    }
    savedProgress.equipped=finalClub; savedProgress.equippedBall=finalBall; save(PROGRESS_KEY,savedProgress);
    return { count, fullCount, longest, largestStep, furthestFinish };
  })()`);
  assert.equal(sweep.count, 99 + (fullSweep ? 250 : 0));
  assert.ok(sweep.longest < 60, `shot exceeded one minute (${sweep.longest.toFixed(1)}s)`);
  assert.ok(sweep.largestStep < 1, `ball teleported ${sweep.largestStep.toFixed(2)} world units in a physics frame`);
  assert.ok(sweep.furthestFinish < .55, 'shot ended away from cup');

  // An off-course tree trunk should behave like the sphere drawn on its base:
  // no penetration, and a ball moving into it must bounce away visibly.
  const treeContact = game.run(`(() => {
    courseState = { level: 5, completed: false }; setLayout(5);
    const tree = layout.trees[0], radius = .10 * tree.scale + BALL_RADIUS;
    ball = { x: tree.x + radius * .5, y: layout.heightAt(tree.x, tree.z) + BALL_RADIUS, z: tree.z };
    shot = { velocity: { x: -2, y: 0, z: 0 }, ballProfile: ballPhysicsProfile('classic'),
      elapsed: 1, lastBumper: -10, effect: null };
    contactBumper(tree.x, tree.z, radius, layout.heightAt(tree.x, tree.z), 'tree');
    return { separation: Math.hypot(ball.x-tree.x, ball.z-tree.z), velocityX: shot.velocity.x, radius };
  })()`);
  assert.ok(treeContact.separation >= treeContact.radius - 1e-8, 'ball penetrated a tree trunk');
  assert.ok(treeContact.velocityX > 0, 'tree trunk did not reflect the incoming ball');

  const flagContact = game.run(`(() => {
    courseState={level:1,completed:false};setLayout(1);phase='ready';ball={...START};
    savedProgress.equipped='rookie';savedProgress.equippedBall='classic';save(PROGRESS_KEY,savedProgress);
    const beforeXp=savedProgress.xp,beforeCount=savedProgress.holeCount;
    startShot(100,{x:160,y:0});
    const poleX=CUP.x+.72;
    ball={x:poleX-.1,y:.04+BALL_RADIUS,z:CUP.z};
    shot.velocity={x:3,y:0,z:0};shot.elapsed=1;
    const cue=$('callout-text').textContent;
    contactFlagPole();
    const firstSpeed=Math.hypot(shot.velocity.x,shot.velocity.z), firstEffect=shot.effect;
    if(shot.velocity.x>=0||firstSpeed>=3)throw Error('Pole added speed instead of a soft cup-side reflection');
    if($('callout-text').textContent!==cue)throw Error('Pole emitted FLAG TAP callout');
    ball.x=poleX-.1;shot.velocity.x=.8;
    contactFlagPole();
    if(shot.effect!==firstEffect||$('callout-text').textContent!==cue)
      throw Error('Repeated pole contact reset the effect or callout');
    const secondSpeed=Math.hypot(shot.velocity.x,shot.velocity.z);
    if(secondSpeed>=.8)throw Error('Repeated pole contact added speed');
    let steps=0;for(;steps<120*60&&phase==='running';steps++)stepPhysics(1/120);
    const rewarded=savedProgress.xp>beforeXp&&savedProgress.holeCount===beforeCount+1;
    savedProgress.equipped=window.GearProgression.clubId(1000,2);
    savedProgress.equippedBall=window.GearProgression.ballId(1000,2);
    save(PROGRESS_KEY,savedProgress);
    return {phase,firstSpeed,secondSpeed,seconds:steps/120,rewarded};
  })()`);
  assert.equal(flagContact.phase,'complete','overshoot pole contact stalled the hole');
  assert.ok(flagContact.rewarded,'pole reflection did not finish with one reward');

  // A new page context must read earned XP and the equipped shop items.
  const reloaded = host();
  reloaded.load('game.js');
  assert.equal(reloaded.run('savedProgress.equipped'), catalog.clubTiers[999].choices[2]);
  assert.equal(reloaded.run('savedProgress.equippedBall'), catalog.ballTiers[999].choices[2]);
  assert.equal(reloaded.run('savedProgress.xp'), game.run('savedProgress.xp'));
  return { ...layoutCheck, ...sweep, treeContact, flagContact };
}

const catalog = checkShop();
const result = checkCourse(catalog);
console.log(`PASS shop: ${catalog.clubTiers.length} club tiers, ${catalog.ballTiers.length} ball tiers, combined cart through final tier, XP, reload`);
console.log(`PASS course: ${result.count} shot traces${result.fullCount ? ` including all ${result.fullCount} blueprints` : ''}, ${result.different} unique layouts, ${result.routeShapes} route shapes across ${result.routeFamilies} turn patterns, minimum prop gap ${result.minSpacing.toFixed(2)}`);
console.log(`PASS reward/persistence: longest ${result.longest.toFixed(1)}s, maximum frame step ${result.largestStep.toFixed(2)}, final cup radius ${result.furthestFinish.toFixed(2)}`);
console.log(`PASS tree collision: ${result.treeContact.separation.toFixed(2)} world-unit clearance and outward bounce`);
console.log(`PASS flag overshoot: damped reflection, no repeated callout, cup in ${result.flagContact.seconds.toFixed(1)}s`);
