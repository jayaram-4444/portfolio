/* Jayaram H portfolio: archery target, count-up, role tabs, turnover bars, accordion, filters, reticle */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reading progress bar and nav scroll-spy (one rAF-throttled handler) */
  const bar = $('.progress'), links = $$('.nav-link');
  const targets = links.map(l => $(l.getAttribute('href')));
  let ticking = false;
  const update = () => {
    const de = document.documentElement, max = de.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(scrollY / max, 1).toFixed(4) : 0);
    let cur = -1;
    targets.forEach((t, i) => { const r = t.getBoundingClientRect(); if (r.top <= 140 && r.bottom > 140) cur = i; });
    if (innerHeight + scrollY >= de.scrollHeight - 4) cur = targets.length - 1;
    links.forEach((l, i) => {
      l.classList.toggle('active', i === cur);
      if (i === cur) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
    });
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();

  /* Mobile menu */
  const toggle = $('.nav-toggle'), menu = $('#menu');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  links.forEach(l => l.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* Scroll-triggered reveals */
  const io = new IntersectionObserver(entries => {
    let k = 0;
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.style.animationDelay = (k++ * 90) + 'ms';
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* Achievement filter tabs */
  const subs = $$('.achievement-subsection'), tabs = $$('.filter-tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => { const on = t === tab; t.classList.toggle('active', on); t.setAttribute('aria-pressed', String(on)); });
    const f = tab.dataset.f;
    subs.forEach(s => s.classList.add('is-out'));
    setTimeout(() => {
      subs.forEach(s => { s.hidden = !(f === 'all' || s.dataset.cat === f); s.classList.add('in'); });
      requestAnimationFrame(() => { subs.forEach(s => s.classList.remove('is-out')); update(); });
    }, reduce ? 0 : 260);
  }));

  /* Copy to clipboard with toast, and print */
  const toast = $('.toast');
  let timer;
  const say = msg => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  $$('.copy-btn').forEach(btn => btn.addEventListener('click', async () => {
    const v = btn.dataset.copy;
    try { await navigator.clipboard.writeText(v); }
    catch (err) {
      const t = document.createElement('textarea');
      t.value = v; t.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
    }
    say('Copied ' + v);
  }));
  $$('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));

  /* Helpers: haptics and particle bursts */
  const buzz = ms => { if (navigator.vibrate) navigator.vibrate(ms); };
  const cols = ['#A65E34', '#F5EFE6', '#D9A47E', '#7A492A'];
  const burst = (x, y, n = 12) => {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'bit';
      p.style.cssText = `left:${x}px;top:${y}px;background:${cols[i % 4]};border-radius:${i % 2 ? '50%' : '2px'};--dx:${(Math.random() - 0.5) * 240}px;--dy:${-60 - Math.random() * 140}px;--r:${Math.random() * 360 - 180}deg`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1000);
    }
  };

  /* Count-up numbers */
  const nums = $$('[data-count]');
  if (!reduce) {
    const fmt = (n, v) => (n.dataset.pre || '') + v.toFixed(+n.dataset.dec || 0) + (n.dataset.suf || '');
    nums.forEach(n => { n.textContent = fmt(n, 0); });
    const co = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      const n = e.target, end = +n.dataset.count, start = performance.now();
      const step = t => {
        const p = Math.min((t - start) / 1600, 1);
        n.textContent = fmt(n, end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.6 });
    nums.forEach(n => co.observe(n));
  }

  /* Marquee loop */
  const mq = $('.mq');
  if (mq) mq.insertAdjacentHTML('beforeend', mq.innerHTML);

  /* Archery target: click, tap or press Enter to shoot */
  const tgt = $('#target'), arrows = $('.arrows'), NS = 'http://www.w3.org/2000/svg';
  let shots = 0, total = 0;
  const shoot = (cx, cy) => {
    const r = tgt.getBoundingClientRect();
    const x = (cx - r.left) / r.width * 200, y = (cy - r.top) / r.height * 200;
    const d = Math.hypot(x - 100, y - 100) / 100;
    const pts = d < 0.4 ? 10 : d < 0.55 ? 8 : d < 0.7 ? 6 : d < 0.85 ? 4 : 2;
    const ox = 260 - x, oy = 260 - y, len = Math.hypot(ox, oy), ux = ox / len, uy = oy / len;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    g.innerHTML = '<circle class="rip" r="7" fill="none" stroke="#F5EFE6" stroke-width="1"/><g class="fly"><g class="wob">' +
      `<line x1="0" y1="0" x2="${ux * 40}" y2="${uy * 40}" stroke="#F5EFE6" stroke-width="1.6" stroke-linecap="round"/>` +
      `<line x1="${ux * 31}" y1="${uy * 31}" x2="${ux * 40}" y2="${uy * 40}" stroke="#A65E34" stroke-width="4.2" stroke-linecap="round"/>` +
      '<circle r="1.5" fill="#24160E"/></g></g>';
    arrows.appendChild(g);
    while (arrows.children.length > 10) arrows.firstChild.remove();
    if (!reduce && g.animate) {
      $('.fly', g).animate([{ transform: `translate(${ux * 90}px,${uy * 90}px)`, opacity: 0 }, { transform: 'translate(0,0)', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' });
      $('.wob', g).animate([{ transform: 'rotate(0)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(1.5deg)' }, { transform: 'rotate(0)' }], { duration: 420, delay: 250 });
      $('.rip', g).animate([{ transform: 'scale(.2)', opacity: 0.9 }, { transform: 'scale(1.9)', opacity: 0 }], { duration: 600, delay: 250, fill: 'backwards' });
    }
    shots++; total += pts;
    $('#n').textContent = shots; $('#sc').textContent = total; $('#last').textContent = pts;
    buzz(12);
    if (pts === 10) { say('Bullseye! 10 points'); burst(cx, cy, 16); }
  };
  tgt.addEventListener('click', e => shoot(e.clientX, e.clientY));
  tgt.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    const r = tgt.getBoundingClientRect(), a = Math.random() * Math.PI * 2, dist = Math.sqrt(Math.random()) * r.width * 0.48;
    shoot(r.left + r.width / 2 + Math.cos(a) * dist, r.top + r.height / 2 + Math.sin(a) * dist);
  });
  $('#reset').addEventListener('click', () => {
    arrows.replaceChildren(); shots = 0; total = 0;
    $('#n').textContent = 0; $('#sc').textContent = 0; $('#last').textContent = 0;
  });

  /* Role tabs, turnover bars, project accordion, chips */
  const rtabs = $$('.rtab'), rpanels = $$('.rpanel');
  rtabs.forEach((t, i) => t.addEventListener('click', () => {
    rtabs.forEach((o, j) => { o.classList.toggle('on', i === j); o.setAttribute('aria-pressed', String(i === j)); });
    rpanels.forEach((p, j) => { p.hidden = i !== j; });
    buzz(8);
  }));
  const barEls = $$('.bar'), readout = $('#readout');
  barEls.forEach((b, i) => b.addEventListener('click', () => {
    barEls.forEach(o => o.classList.toggle('on', o === b));
    const v = +b.dataset.v;
    readout.textContent = i
      ? b.dataset.fy + ': +' + ((v / +barEls[i - 1].dataset.v - 1) * 100).toFixed(2) + '% vs ' + barEls[i - 1].dataset.fy
      : b.dataset.fy + ': base year, \u20B9' + v.toFixed(2) + ' Cr';
    buzz(8);
  }));
  $$('.phead').forEach(h => h.addEventListener('click', () => {
    h.setAttribute('aria-expanded', String(h.closest('.proj').classList.toggle('open')));
    buzz(8);
  }));
  $$('.skill-chip').forEach(c => c.addEventListener('click', () => {
    c.classList.toggle('on');
    const r = c.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top, 8);
  }));

  /* Card spotlight and cursor reticle */
  $$('.section-card').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));
  const ret = $('.reticle');
  if (ret && !reduce && matchMedia('(pointer:fine)').matches) {
    let rx = -100, ry = -100, tx = -100, ty = -100;
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY; ret.style.opacity = 1;
      ret.classList.toggle('big', !!e.target.closest('a,button,.target'));
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => { ret.style.opacity = 0; });
    const loop = () => {
      rx += (tx - rx) * 0.22; ry += (ty - ry) * 0.22;
      ret.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }
})();
