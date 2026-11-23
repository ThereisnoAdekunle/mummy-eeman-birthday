(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: "0px 0px -55px 0px" });
  document.querySelectorAll(".reveal").forEach((el, index) => {
    if (!el.style.getPropertyValue("--delay")) {
      el.style.setProperty("--delay", `${Math.min(index % 5, 4) * 90}ms`);
    }
    revealObserver.observe(el);
  });

  document.querySelectorAll(".wish-card").forEach(card => {
    card.addEventListener("click", () => {
      const open = card.getAttribute("aria-expanded") === "true";
      card.setAttribute("aria-expanded", String(!open));
      playChime();
      if (!open) burst(window.innerWidth / 2, window.innerHeight * .55, 16);
    });
  });

  let audioContext = null;
  let soundOn = false;
  function tone(freq, delay = 0, duration = .55, volume = .035) {
    if (!soundOn) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioContext ||= new AC();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime + delay;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + .035);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.start(now); osc.stop(now + duration + .03);
  }
  function playChime() { tone(659.25, 0, .45); tone(783.99, .12, .55); tone(1046.5, .25, .8, .025); }
  const soundToggle = document.getElementById("soundToggle");
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    document.getElementById("soundText").textContent = soundOn ? "sound on" : "sound off";
    if (soundOn) playChime();
  });

  const frames = [...document.querySelectorAll(".photo-frame")];
  const photoHint = document.getElementById("photoHint");
  const ENTRANCE_STYLES = 6;
  let entranceCycle = 0;

  function clearVariants(frame) {
    frame.className = frame.className.replace(/\bv\d+\b/g, "").replace(/\s+/g, " ").trim();
  }

  function showPhotos() {
    const style = entranceCycle % ENTRANCE_STYLES;
    entranceCycle++;
    frames.forEach(frame => {
      clearVariants(frame);
      frame.classList.remove("leave", "settled");
      void frame.offsetWidth;
      frame.classList.add("show", `v${style}`);
    });
    photoHint.classList.add("hide");
  }

  function hidePhotos() {
    frames.forEach(frame => {
      if (!frame.classList.contains("show")) return;
      clearVariants(frame);
      frame.classList.remove("settled");
      void frame.offsetWidth;
      frame.classList.add("leave");
    });
    photoHint.classList.remove("hide");
  }

  frames.forEach(frame => {
    frame.addEventListener("animationend", event => {
      if (event.target !== frame) return;
      if (frame.classList.contains("leave")) {
        frame.classList.remove("leave", "show", "settled");
        clearVariants(frame);
      } else if (frame.classList.contains("show")) {
        frame.classList.add("settled");
        clearVariants(frame);
      }
    });
  });

  const candles = [...document.querySelectorAll(".candle")];
  const status = document.getElementById("cakeStatus");
  const relight = document.getElementById("relight");
  let celebrationStarted = false;
  candles.forEach((candle, index) => {
    candle.addEventListener("click", () => {
      if (candle.classList.contains("out")) return;
      candle.classList.add("out");
      tone(260 - index * 25, 0, .22, .025);
      burst(candle.getBoundingClientRect().left + 5, candle.getBoundingClientRect().top, 10);
      const remaining = candles.filter(c => !c.classList.contains("out")).length;
      if (remaining) status.textContent = `${remaining} ${remaining === 1 ? "little flame" : "little flames"} left...`;
      if (!remaining && !celebrationStarted) {
        celebrationStarted = true;
        status.textContent = "wish made. may all the beautiful things find you. ✨";
        relight.classList.add("show");
        playChime();
        showPhotos();
        burst(window.innerWidth / 2, window.innerHeight * .48, 95);
        setTimeout(() => burst(window.innerWidth * .18, window.innerHeight * .45, 45), 350);
        setTimeout(() => burst(window.innerWidth * .82, window.innerHeight * .45, 45), 700);
      }
    });
  });
  relight.addEventListener("click", () => {
    candles.forEach(c => c.classList.remove("out"));
    celebrationStarted = false;
    relight.classList.remove("show");
    status.textContent = "three little flames, one big wish";
    hidePhotos();
  });

  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  let width = 0, height = 0, dpr = 1;
  const dust = [], bursts = [];
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = width + "px"; canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize(); window.addEventListener("resize", resize);
  if (!reduceMotion) {
    for (let i = 0; i < 48; i++) dust.push({
      x: Math.random() * width, y: Math.random() * height,
      r: Math.random() * 1.7 + .4, speed: Math.random() * .28 + .08,
      alpha: Math.random() * .5 + .12, drift: (Math.random() - .5) * .2
    });
  }
  function burst(x, y, amount = 30) {
    if (reduceMotion) return;
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.8 + 1;
      bursts.push({x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, size: Math.random() * 3 + 1, hue: Math.random() > .5 ? "#e6c27f" : "#f5e5c5"});
    }
  }
  function animate() {
    ctx.clearRect(0, 0, width, height);
    dust.forEach(p => {
      p.y -= p.speed; p.x += p.drift;
      if (p.y < -5) { p.y = height + 5; p.x = Math.random() * width; }
      ctx.globalAlpha = p.alpha * (.65 + Math.sin(Date.now() / 1100 + p.x) * .35);
      ctx.fillStyle = "#e6c27f"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i]; p.x += p.vx; p.y += p.vy; p.vy += .045; p.vx *= .99; p.life -= .012;
      if (p.life <= 0) { bursts.splice(i, 1); continue; }
      ctx.globalAlpha = p.life; ctx.fillStyle = p.hue;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduceMotion) requestAnimationFrame(animate);
  }
  if (!reduceMotion) animate();

  // Hide placeholders when photos load successfully
  document.querySelectorAll(".photo-inner img").forEach(img => {
    const hidePlaceholder = () => {
      const placeholder = img.nextElementSibling;
      if (placeholder && placeholder.classList.contains("photo-placeholder")) {
        placeholder.style.display = "none";
      }
    };
    img.addEventListener("load", hidePlaceholder);
    img.addEventListener("error", () => {
      img.style.display = "none";
      img.parentElement.classList.add("no-photo");
    });
    if (img.complete) {
      if (img.naturalWidth > 0) hidePlaceholder();
      else {
        img.style.display = "none";
        img.parentElement.classList.add("no-photo");
      }
    }
  });
})();