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

function host(backingStore = store) {
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
    devicePixelRatio: 1, handlers: {},
    addEventListener(event, handler) { this.handlers[event] = handler; },
    matchMedia() { return { matches: true }; },
    location: { href: '' }
  };
  const context = vm.createContext({
    document, window, Math, console,
    localStorage: {
      getItem(key) { return backingStore.get(key) ?? null; },
      setItem(key, value) { backingStore.set(key, String(value)); },
      removeItem(key) { backingStore.delete(key); }
    },
    location: window.location,
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
  assert.equal(shop.run('progress.xp'), 0, 'new players should start with no XP');
  shop.run('progress.xp = 2000; saveProgress()');
  shop.run("openGearDetail('club', 'meteor')");
  assert.equal(shop.run("document.getElementById('detail-panel').hidden"), false);
  assert.ok(shop.run("document.getElementById('detail-compare').innerHTML.includes('Equipped')"),
    'gear detail should offer equipped gear comparison');
  assert.ok(shop.run("document.getElementById('detail-chart').innerHTML.includes('candidate-bar')"),
    'gear detail should show visual stat differences');
  assert.equal(shop.run("document.getElementById('detail-add').disabled"), false);
  shop.elements.get('detail-add').handlers.click();
  assert.equal(shop.run("document.getElementById('claim-modal').hidden"), false,
    'adding from detail should open the right cart');
  assert.equal(shop.run("document.querySelector('.app-shell').inert"), false,
    'cart should leave the shop browsable');
  assert.equal(shop.run("document.getElementById('cart-ball-item').hidden"), true,
    'cart should only show selected items');
  shop.run("openClaimCart('meteor')");
  assert.equal(shop.run('cartBallId'), null, 'a club click should not add a ball silently');
  assert.ok(shop.run("document.getElementById('pair-suggestion').innerHTML.includes('Add Sunburst')"), 'affordable pairing should be suggested');
  assert.equal(shop.run("document.getElementById('topbar-cart-count').textContent"), 1);
  shop.run("hideModal('claim-modal')");
  assert.equal(shop.run('claimSelectedId'), 'meteor', 'closing the drawer should keep the cart');
  assert.equal(JSON.parse(store.get('hole-in-one-cart-v1')).club, 'meteor');
  shop.run("openClaimCart('meteor', 'sunburst')");
  assert.equal(shop.run("document.getElementById('claim-needed').textContent"), '1,900 XP');
  assert.equal(shop.run("document.getElementById('claim-confirm-text').textContent"), 'Purchase both');
  shop.elements.get('claim-confirm').handlers.click();
  let saved = JSON.parse(store.get(progressKey));
  assert.equal(saved.xp, 100, 'combined purchase must spend both item prices');
  assert.equal(saved.equipped, 'meteor');
  assert.equal(saved.equippedBall, 'sunburst');
  assert.equal(store.has('hole-in-one-cart-v1'), false, 'purchase should clear the saved cart');
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
  assert.equal(JSON.parse(store.get(progressKey)).xp, 100);

  // Simulate earning enough XP, then claim the next club and ball together.
  reloaded.run('progress.xp = 5000; saveProgress()');
  reloaded.run("openClaimCart('orbit', 'ember')");
  assert.equal(reloaded.run("document.getElementById('claim-needed').textContent"), '5,000 XP');
  reloaded.elements.get('claim-confirm').handlers.click();
  saved = JSON.parse(store.get(progressKey));
  assert.equal(saved.xp, 0, 'second purchase must spend both item prices');
  assert.equal(saved.equipped, 'orbit');
  assert.equal(saved.equippedBall, 'ember');
  assert.deepEqual([...saved.claimed], [0, 1]);
  assert.deepEqual([...saved.claimedBallTiers], [0, 1]);

  // Generated choices must remain stable across reloads and use the same
  // spendable-XP cart rule as the six curated drops.
  const tierSevenClub = catalog.clubTiers[6].choices[0];
  const tierSevenBall = catalog.ballTiers[6].choices[0];
  reloaded.run(`progress.xp = tiers[6].threshold + ballTiers[6].threshold;
    progress.claimed = [0,1,2,3,4,5]; progress.claimedBallTiers = [0,1,2,3,4,5]; saveProgress()`);
  const tierSeven = host(); tierSeven.load('script.js');
  tierSeven.run(`openClaimCart('${tierSevenClub}', '${tierSevenBall}')`);
  tierSeven.elements.get('claim-confirm').handlers.click();
  saved = JSON.parse(store.get(progressKey));
  assert.equal(saved.xp, 0);
  assert.equal(saved.equipped, tierSevenClub);
  assert.equal(saved.equippedBall, tierSevenBall);
  assert.ok(saved.claimed.includes(6) && saved.claimedBallTiers.includes(6));

  // The final milestone is reachable, consumes XP, and cleanly caps
  // both collections after one combined purchase.
  const finalIndex = catalog.clubTiers.length - 1;
  const finalClub = catalog.clubTiers[finalIndex].choices[2];
  const finalBall = catalog.ballTiers[finalIndex].choices[2];
  tierSeven.run(`progress.xp = tiers[999].threshold + ballTiers[999].threshold;
    progress.claimed = Array.from({length:999}, (_, i) => i);
    progress.claimedBallTiers = Array.from({length:999}, (_, i) => i); saveProgress()`);
  const finalShop = host(); finalShop.load('script.js');
  finalShop.run(`openClaimCart('${finalClub}', '${finalBall}')`);
  finalShop.elements.get('claim-confirm').handlers.click();
  saved = JSON.parse(store.get(progressKey));
  assert.equal(saved.xp, 0);
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

function checkStaleShopSave() {
  const isolated = new Map();
  isolated.set(progressKey, JSON.stringify({
    xp: 2600, holeCount: 7, equipped: 'meteor', equippedBall: 'sunburst',
    owned: ['rookie', 'meteor'], ownedBalls: ['classic', 'sunburst'],
    claimed: [0], claimedBallTiers: [0]
  }));
  const stale = host(isolated); stale.load('script.js');
  stale.run("openClaimCart('orbit', null)");
  assert.equal(stale.run('claimSelectedId'), 'orbit');
  // Another tab wins a ball, equips it, and earns XP while this cart is open.
  const newer = JSON.parse(isolated.get(progressKey));
  newer.xp = 5200; newer.holeCount = 9; newer.equippedBall = 'ember';
  newer.ownedBalls.push('ember'); newer.claimedBallTiers.push(1);
  isolated.set(progressKey, JSON.stringify(newer));
  stale.elements.get('claim-confirm').handlers.click();
  const saved = JSON.parse(isolated.get(progressKey));
  assert.equal(saved.xp, 2600, 'stale shop tab failed to deduct the club price from current XP');
  assert.equal(saved.holeCount, 9, 'stale shop tab erased newer shot count');
  assert.equal(saved.equipped, 'orbit', 'purchased club was not equipped');
  assert.equal(saved.equippedBall, 'ember', 'club-only purchase overwrote newer ball equipment');
  assert.ok(saved.ownedBalls.includes('ember') && saved.claimedBallTiers.includes(1),
    'stale shop tab erased a newer ball purchase');

  const inverseStore = new Map([[progressKey, JSON.stringify({
    xp: 2600, holeCount: 7, equipped: 'meteor', equippedBall: 'sunburst',
    owned: ['rookie', 'meteor'], ownedBalls: ['classic', 'sunburst'],
    claimed: [0], claimedBallTiers: [0]
  })]]);
  const staleBallCart = host(inverseStore); staleBallCart.load('script.js');
  staleBallCart.run("openClaimCart(null, 'ember')");
  const newerClub = JSON.parse(inverseStore.get(progressKey));
  newerClub.xp = 5200; newerClub.holeCount = 10; newerClub.equipped = 'orbit';
  newerClub.owned.push('orbit'); newerClub.claimed.push(1);
  inverseStore.set(progressKey, JSON.stringify(newerClub));
  staleBallCart.elements.get('claim-confirm').handlers.click();
  const savedBallCart = JSON.parse(inverseStore.get(progressKey));
  assert.equal(savedBallCart.xp, 2800);
  assert.equal(savedBallCart.holeCount, 10);
  assert.equal(savedBallCart.equippedBall, 'ember', 'purchased ball was not equipped');
  assert.equal(savedBallCart.equipped, 'orbit', 'ball-only purchase overwrote newer club equipment');
  assert.ok(savedBallCart.owned.includes('orbit') && savedBallCart.claimed.includes(1));
}

function checkLocalReset() {
  const isolated = new Map([
    [progressKey, JSON.stringify({ xp: 999999, holeCount: 99, equipped: 'meteor',
      equippedBall: 'sunburst', owned: ['rookie', 'meteor'], ownedBalls: ['classic', 'sunburst'],
      claimed: [0, 1], claimedBallTiers: [0, 1] })],
    ['hole-in-one-course-v1', JSON.stringify({ level: 250, completed: true })],
    ['hole-in-one-tutorial-seen-v1', 'true']
  ]);
  const preview = host(isolated);
  const source = fs.readFileSync(path.join(root, 'tests/preview-shop.html'), 'utf8');
  const inline = source.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(inline, 'shop preview reset script is missing');
  vm.runInContext(inline[1], preview.context, { filename: 'tests/preview-shop.html:inline' });
  preview.elements.get('reset-starter').handlers.click();
  const progress = JSON.parse(isolated.get(progressKey));
  assert.equal(progress.xp, 0); assert.equal(progress.holeCount, 0);
  assert.equal(progress.equipped, 'rookie'); assert.equal(progress.equippedBall, 'classic');
  assert.deepEqual(progress.claimed, []); assert.deepEqual(progress.claimedBallTiers, []);
  assert.deepEqual(JSON.parse(isolated.get('hole-in-one-course-v1')), { level: 1, completed: false });
  assert.equal(isolated.has('hole-in-one-tutorial-seen-v1'), false);
  assert.equal(preview.context.location.href, '../index.html');
}

function checkCupRegressions() {
  const game = host(new Map()); game.load('game.js');
  const turn = game.run(`(() => {
    courseState={level:1,completed:false};setLayout(1);phase='ready';ball={...START};
    startShot(50,{x:160,y:0});
    ball={x:CUP.x-1.5,z:CUP.z+.3,y:0};
    ball.y=courseSurfaceAt(ball.x,ball.z,ball.y)+BALL_RADIUS;
    shot.velocity={x:0,y:0,z:2};shot.spinSign=0;shot.elapsed=0;
    const v=shot.velocity, dt=1/120, toCup=cupDirection(), dist=toCup.distance;
    const bowl=Math.max(0,1-dist/3.3), near=1/(1+Math.pow(dist/1.05,4));
    const slopeForce=bowl*(.4+2.7*bowl),drag=(.22+2.3*near)*shot.ballProfile.dragMultiplier;
    const ground=courseSurfaceAt(ball.x,ball.z,ball.y);
    const ax=toCup.x*slopeForce-v.x*drag-(courseSurfaceAt(ball.x+.03,ball.z,ball.y)-ground)/.03*3.8;
    const az=toCup.z*slopeForce-v.z*drag-(courseSurfaceAt(ball.x,ball.z+.03,ball.y)-ground)/.03*3.8;
    const expected=Math.hypot(v.x+ax*dt,v.z+az*dt);
    const preAngle=Math.atan2(v.z+az*dt,v.x+ax*dt);
    const target=Math.atan2(toCup.z,toCup.x);
    const preError=Math.abs(Math.atan2(Math.sin(target-preAngle),Math.cos(target-preAngle)));
    stepPhysics(dt);
    const actual=Math.hypot(shot.velocity.x,shot.velocity.z);
    const postAngle=Math.atan2(shot.velocity.z,shot.velocity.x);
    const postError=Math.abs(Math.atan2(Math.sin(target-postAngle),Math.cos(target-postAngle)));
    return {expected,actual,preError,postError};
  })()`);
  assert.ok(Math.abs(turn.actual-turn.expected)<1e-5,
    `near-cup heading turn changed speed (${turn.expected} -> ${turn.actual})`);
  assert.ok(turn.postError<turn.preError, 'near-cup turn did not steer toward cup');

  const backstop = game.run(`(() => {
    courseState={level:1,completed:false};setLayout(1);phase='ready';ball={...START};
    startShot(70,{x:160,y:0});
    const wall=backstopGeometry(), t=wall.tangent;
    const point=along=>({x:wall.x+t.x*along,z:wall.z+t.z*along});
    const before=point(-BALL_RADIUS-.03),after=point(-BALL_RADIUS+.025);
    ball={...after,y:layout.heightAt(after.x,after.z)+BALL_RADIUS};
    shot.velocity={x:t.x*3,y:0,z:t.z*3};shot.elapsed=.5;
    backstopContact(before);
    const bounced=shot.velocity.x*t.x+shot.velocity.z*t.z;
    const corrected=(ball.x-wall.x)*t.x+(ball.z-wall.z)*t.z;
    if(bounced>=0||Math.abs(corrected+BALL_RADIUS)>.0001)
      throw Error('Front backstop did not visibly bank the ball at its face');
    phase='ready';ball={...START};startShot(70,{x:160,y:0});
    const rear=point(wall.thickness+BALL_RADIUS+.12);
    ball={...rear,y:layout.heightAt(rear.x,rear.z)+BALL_RADIUS};
    shot.velocity={x:-t.x*2.5,y:0,z:-t.z*2.5};shot.elapsed=.5;
    let flapSeen=false,flapDelay=0,steps=0;
    for(;steps<120*60&&phase==='running';steps++){
      stepPhysics(1/120);
      if(shot&&shot.backstopFlapAt!==undefined){flapSeen=true;flapDelay=Math.max(flapDelay,shot.elapsed-shot.backstopFlapAt);}
    }
    return {bounced,corrected,flapSeen,flapDelay,phase,seconds:steps/120};
  })()`);
  assert.ok(backstop.flapSeen, 'rear arrival did not trigger hinged flap');
  assert.ok(backstop.flapDelay>=.22, 'rear flap did not stay active long enough to open');
  assert.equal(backstop.phase,'complete','rear overflow stalled behind backstop');
  return { turn, backstop };
}

function checkDefaultRenderer() {
  const game = host(new Map());
  let created = 0, resized = 0;
  game.context.window.Game3D = { create(canvas) {
    assert.equal(canvas.id, 'scene-3d');
    created++;
    return { resize() { resized++; }, render() {}, destroy() {} };
  } };
  game.load('game.js');
  assert.equal(created, 1, 'normal game route must initialize 3D');
  assert.equal(resized, 1, '3D canvas must size on startup');
  assert.equal(game.run('renderer3D !== null'), true);

  const classic = host(new Map());
  classic.context.window.Game3D = { create() { return null; } };
  classic.load('game.js');
  assert.equal(classic.run('renderer3D === null'), true,
    'classic canvas should remain available without WebGL2');
}

function checkCourse(catalog) {
  const input = host(new Map());
  input.load('game.js');
  const shell = input.elements.get('.game-shell');
  const shotArea = { closest() { return null; } };
  const pointer = (x, y) => ({ pointerId: 7, clientX: x, clientY: y, target: shotArea, preventDefault() {} });
  shell.handlers.pointerdown(pointer(640, 630));
  shell.handlers.pointermove(pointer(510, 585));
  assert.ok(input.run('power') > 0, 'pulling back should build shot power');
  shell.handlers.pointerup(pointer(510, 585));
  assert.equal(input.run('phase'), 'running', 'releasing over the shot dock should swing');
  assert.ok(input.run('shot.power') > 0, 'release lost the player’s pullback power');
  const fallbackInput = host(new Map());
  fallbackInput.load('game.js');
  const fallbackShell = fallbackInput.elements.get('.game-shell');
  fallbackShell.setPointerCapture = () => { throw new Error('capture unavailable'); };
  fallbackShell.handlers.pointerdown(pointer(640, 630));
  fallbackInput.context.window.handlers.pointerup(pointer(510, 585));
  assert.equal(fallbackInput.run('phase'), 'running', 'window release should swing without pointer capture');

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
checkLocalReset();
checkDefaultRenderer();
const cupRegressions = checkCupRegressions();
const result = checkCourse(catalog);
checkStaleShopSave();
console.log(`PASS shop: ${catalog.clubTiers.length} club tiers, ${catalog.ballTiers.length} ball tiers, combined cart through final tier, XP, reload`);
console.log('PASS shop stale tabs: newer XP, shot count, club/ball gear and unlocks survive single-item purchases');
console.log('PASS local reset: XP, gear, course and tutorial flag return to starter state');
console.log('PASS renderer: normal game initializes 3D, unavailable WebGL falls back to classic canvas');
console.log(`PASS cup/backstop: speed-preserving turn, front bank, timed rear flap and cup in ${cupRegressions.backstop.seconds.toFixed(1)}s`);
console.log(`PASS course: ${result.count} shot traces${result.fullCount ? ` including all ${result.fullCount} blueprints` : ''}, ${result.different} unique layouts, ${result.routeShapes} route shapes across ${result.routeFamilies} turn patterns, minimum prop gap ${result.minSpacing.toFixed(2)}`);
console.log(`PASS reward/persistence: longest ${result.longest.toFixed(1)}s, maximum frame step ${result.largestStep.toFixed(2)}, final cup radius ${result.furthestFinish.toFixed(2)}`);
console.log(`PASS tree collision: ${result.treeContact.separation.toFixed(2)} world-unit clearance and outward bounce`);
console.log(`PASS flag overshoot: damped reflection, no repeated callout, cup in ${result.flagContact.seconds.toFixed(1)}s`);
