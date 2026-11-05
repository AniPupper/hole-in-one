/* Local, edited CC0 recordings. Source and license details: assets/audio/SOURCES.md */
(() => {
  'use strict';
  const STORAGE_KEY = 'hole-in-one-sound-muted-v1';
  const asset = (name) => new URL(`./assets/audio/${name}.mp3`, document.baseURI).href;
  const templates = {};
  const playing = new Set();
  let muted = false, ambience = null, audioContext = null, rolling = null, rollBuffer = null;
  try { muted = localStorage.getItem(STORAGE_KEY) === 'true'; } catch (_) {}

  function template(name) {
    if (!templates[name]) {
      const element = new Audio(asset(name));
      element.preload = 'auto';
      templates[name] = element;
    }
    return templates[name];
  }
  function play(name, volume = 1, rate = 1) {
    if (muted) return null;
    const element = template(name).cloneNode();
    element.volume = Math.min(1, Math.max(0, volume));
    element.playbackRate = rate;
    playing.add(element);
    element.addEventListener('ended', () => playing.delete(element), { once: true });
    element.addEventListener('error', () => playing.delete(element), { once: true });
    const result = element.play();
    if (result?.catch) result.catch(() => playing.delete(element));
    return element;
  }
  function stop(element) {
    if (!element) return;
    element.pause();
    element.currentTime = 0;
    playing.delete(element);
  }
  function startAmbience() {
    if (muted || ambience) return;
    ambience = play('ambience', .35);
    if (ambience) ambience.loop = true;
  }
  function stopAmbience() { stop(ambience); ambience = null; }

  function context() {
    if (muted) return null;
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }
  function roll(speed = 0, onGround = false) {
    if (muted || !onGround || speed < .35) { stopRolling(); return; }
    const ctx = context();
    if (!ctx) return;
    if (!rolling) {
      if (!rollBuffer) {
        rollBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const samples = rollBuffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = rollBuffer;
      source.loop = true;
      filter.type = 'bandpass';
      filter.Q.value = .5;
      gain.gain.value = .0001;
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      rolling = { source, filter, gain };
    }
    const pace = Math.min(1, speed / 12);
    rolling.filter.frequency.setTargetAtTime(450 + pace * 950, ctx.currentTime, .05);
    rolling.gain.gain.setTargetAtTime(.004 + pace * .018, ctx.currentTime, .05);
  }
  function stopRolling() {
    if (!rolling || !audioContext) return;
    const { source, gain } = rolling;
    gain.gain.cancelScheduledValues(audioContext.currentTime);
    gain.gain.setTargetAtTime(.0001, audioContext.currentTime, .025);
    setTimeout(() => { try { source.stop(); } catch (_) {} }, 160);
    rolling = null;
  }

  function ui() { play('wood', .16); }
  const driverClubs = new Set(['meteor', 'orbit', 'nebula', 'wildfire', 'thunderhead', 'supernova']);
  const wedgeClubs = new Set(['cloud', 'lotus', 'rocket', 'starlift', 'sunforge', 'skycrown']);
  function swing(clubId = 'rookie', power = 60) {
    startAmbience();
    const generated = /^club-t\d+-([abc])$/.exec(clubId);
    const family = driverClubs.has(clubId) || generated?.[1] === 'a' ? 'driver'
      : wedgeClubs.has(clubId) || generated?.[1] === 'b' ? 'wedge' : 'club';
    const strength = Math.min(1, Math.max(0, power / 100));
    play(family, (.60 + strength * .31) * (family === 'wedge' ? .84 : 1));
  }
  function event(kind, label = '') {
    if (label === 'CANNON LOADING') { play('wood', .24, .75); return; }
    if (label === 'CANNON FIRED') { play('cannon', .72); return; }
    if (label === 'LAUNCH PAD!') {
      play('wood', .56, .78);
      play('wind', .26, 1.35);
      return;
    }
    if (kind === 'cup') { play('cup', .95); return; }
    if (kind === 'wind') { play('wind', .5); return; }
    if (kind === 'river') { play('river-splash', .32, 1.12); return; }
    if (kind === 'tunnel' || kind === 'loop') { play('wind', .34, 1.15); return; }
    if (kind === 'windmill') {
      play('wind', .28, 1.2);
      play('wood', .67);
      return;
    }
    if (kind === 'blade') { play('metal', .66); return; }
    if (kind === 'mole') { play('wood', .58, .85); return; }
    if (kind === 'tree') { play('wood', .77, .91); return; }
    // The sharp club-face layer gives rail contacts the crack missing before.
    play('wood', kind === 'bank' ? .87 : .72, .98 + Math.random() * .06);
    if (kind === 'bank') play('club', .22, 1.14);
  }
  function win() {
    stopAmbience();
    setTimeout(() => play('applause', .25), 230);
  }
  function confetti() { play('confetti', .83); }
  function purchase() { play('party-horn', .45); }

  function updateButton(button) {
    if (!button) return;
    button.classList.toggle('muted', muted);
    button.setAttribute('aria-pressed', String(!muted));
    button.setAttribute('aria-label', muted ? 'Turn sound on' : 'Mute sound');
    button.title = muted ? 'Turn sound on' : 'Mute sound';
    const label = button.querySelector('[data-sound-label]');
    const icon = button.querySelector('[data-sound-icon]');
    if (label) label.textContent = muted ? 'Sound off' : 'Sound on';
    if (icon) icon.textContent = muted ? '◌' : '◉';
  }
  function bind(button) {
    if (!button) return;
    updateButton(button);
    button.addEventListener('click', () => {
      muted = !muted;
      if (muted) {
        stopRolling();
        stopAmbience();
        for (const element of [...playing]) stop(element);
      }
      try { localStorage.setItem(STORAGE_KEY, String(muted)); } catch (_) {}
      updateButton(button);
      if (!muted) ui();
    });
  }
  window.HoleInOneSound = { ui, swing, event, win, confetti, purchase, roll, stopRolling, bind, isMuted: () => muted };
})();
