/* C++ Академия — интерфейс. Работает офлайн, прогресс хранится в localStorage. */
(function () {
'use strict';

/* ---------------- утилиты ---------------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtInline = s => esc(s).replace(/‹(.+?)›/g, '<code>$1</code>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const reduced = () => { try { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

if (!window.DATA || !window.CppInterp) {
  document.getElementById('main').innerHTML = '<div class="card"><h2>Не загрузились файлы</h2><p class="muted">Проверь, что data.js и interpreter.js лежат рядом с index.html.</p></div>';
  return;
}
const D = window.DATA, I = window.CppInterp;
const LESSONS = [], BYID = {};
D.modules.forEach(m => m.lessons.forEach(l => { l.mod = m; LESSONS.push(l); BYID[l.id] = l; }));

const css = document.createElement('style');
css.textContent = '.theory code,.qtext code,.expl code,.taskbox code,.sub code,.banner code{font:0.9em var(--mono);background:rgba(0,0,0,.4);padding:1px 5px;border-radius:5px;color:#ffe28c}' +
  '.theory h2{color:var(--acc)}.theory b{color:#fff}.lbl{font-size:12px;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);margin:2px 2px 4px}' +
  '.codewrap{overflow-y:auto}#main.nopad .lbody.theory{padding-top:8px}.stat{flex:1;text-align:center}.stat b{display:block;font-size:22px}.stat span{font-size:12px;color:var(--muted)}';
document.head.appendChild(css);

/* ---------------- состояние ---------------- */
const KEY = 'cppacademy.v1';
let storageOK = true;
const SANDBOX0 = '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Привет, C++!" << endl;\n    return 0;\n}\n';
const THEMES = [
  { id: 'night', name: 'Ночь', a: '#0e102a', b: '#22123e' },
  { id: 'sunset', name: 'Закат', a: '#2a0e1e', b: '#4a1d2f' },
  { id: 'ocean', name: 'Океан', a: '#071a2e', b: '#0b3a4a' },
  { id: 'forest', name: 'Лес', a: '#08201a', b: '#1b2f1a' }
];
function defaults() {
  return { xp: 0, done: {}, code: {}, quiz: {}, streak: 0, last: '', sandbox: SANDBOX0, sbInput: '',
    settings: { theme: 'night', fs: 16, sym: true, anim: true } };
}
function normalize(o) {
  const d = defaults();
  if (!o || typeof o !== 'object') return d;
  if (Number.isFinite(o.xp)) d.xp = Math.max(0, Math.floor(o.xp));
  if (o.done && typeof o.done === 'object') for (const k in o.done) if (BYID[k] && o.done[k]) d.done[k] = true;
  if (o.code && typeof o.code === 'object') for (const k in o.code) if (BYID[k] && typeof o.code[k] === 'string') d.code[k] = o.code[k].slice(0, 20000);
  if (o.quiz && typeof o.quiz === 'object') for (const k in o.quiz) if (D.quizzes[k] && Number.isFinite(o.quiz[k])) d.quiz[k] = clamp(Math.floor(o.quiz[k]), 0, D.quizzes[k].length);
  if (Number.isFinite(o.streak)) d.streak = Math.max(0, Math.floor(o.streak));
  if (typeof o.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.last)) d.last = o.last;
  if (typeof o.sandbox === 'string') d.sandbox = o.sandbox.slice(0, 20000);
  if (typeof o.sbInput === 'string') d.sbInput = o.sbInput.slice(0, 5000);
  const s = o.settings;
  if (s && typeof s === 'object') {
    if (THEMES.some(t => t.id === s.theme)) d.settings.theme = s.theme;
    if (Number.isFinite(s.fs)) d.settings.fs = clamp(Math.round(s.fs), 12, 22);
    if (typeof s.sym === 'boolean') d.settings.sym = s.sym;
    if (typeof s.anim === 'boolean') d.settings.anim = s.anim;
  }
  return d;
}
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return normalize(JSON.parse(raw)); } catch (e) { storageOK = false; }
  return defaults();
}
let S = load(), saveT = 0;
function saveNow() { clearTimeout(saveT); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOK = false; } }
function save() { clearTimeout(saveT); saveT = setTimeout(saveNow, 300); }
window.addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

const V = { tab: 'path', lesson: null, ltab: 'theory', quiz: null, open: {}, fails: {} };
const scrollPos = {};
const level = () => 1 + Math.floor(S.xp / 100);

/* ---------------- тосты, окна, конфетти ---------------- */
function toast(msg, kind) {
  const t = document.createElement('div');
  t.className = 'toast ' + (kind || ''); t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 2800);
}
function closeModal() { const m = $('#modal'); m.classList.remove('show'); m.innerHTML = ''; m.onclick = null; }
function modal(html) {
  try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
  const m = $('#modal'); m.innerHTML = '<div class="box"></div>';
  const box = m.firstChild; box.innerHTML = html;
  m.classList.add('show');
  m.onclick = e => { if (e.target === m) closeModal(); };
  return box;
}
function confirmBox(title, text, okLabel, cb) {
  const box = modal('<h2 style="margin-top:0">' + esc(title) + '</h2><p class="muted">' + esc(text) + '</p><div class="btns"><button class="btn" id="cn">Отмена</button><button class="btn red" id="ok">' + esc(okLabel) + '</button></div>');
  $('#cn', box).onclick = closeModal;
  $('#ok', box).onclick = () => { closeModal(); cb(); };
}
function vibrate(n) { try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} }
function confetti() {
  const c = $('#fx'); if (!c || !c.getContext || reduced()) return;
  const ctx = c.getContext('2d'); if (!ctx) return;
  c.width = innerWidth; c.height = innerHeight;
  const cols = ['#78d2ff', '#ff96c8', '#5ae196', '#ffaf46', '#c8a0ff', '#ffe28c'];
  const ps = [];
  for (let i = 0; i < 90; i++) ps.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.55, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 13 - 4, s: 4 + Math.random() * 5, c: cols[i % cols.length], r: Math.random() * 6 });
  const t0 = performance.now();
  (function step(now) {
    const dt = now - t0;
    ctx.clearRect(0, 0, c.width, c.height);
    if (dt > 2200) return;
    ps.forEach(p => {
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += 0.2;
      ctx.globalAlpha = Math.max(0, 1 - dt / 2200); ctx.fillStyle = p.c;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
    });
    requestAnimationFrame(step);
  })(t0);
}

/* ---------------- фон ---------------- */
const bg = { ctx: null, ps: [], run: false };
function bgInit() {
  const c = $('#bg'); if (!c || !c.getContext) return;
  bg.ctx = c.getContext('2d'); if (!bg.ctx) return;
  const size = () => { c.width = innerWidth; c.height = innerHeight; };
  size(); window.addEventListener('resize', size);
  for (let i = 0; i < 38; i++) bg.ps.push({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.2, v: 0.00004 + Math.random() * 0.00012, k: i % 3 });
  document.addEventListener('visibilitychange', bgStart);
  bgStart();
}
function bgDraw() {
  const c = bg.ctx, w = innerWidth, h = innerHeight;
  c.clearRect(0, 0, w, h);
  const cols = ['120,210,255', '255,150,200', '200,160,255'];
  bg.ps.forEach(p => {
    c.fillStyle = 'rgba(' + cols[p.k] + ',0.35)';
    c.beginPath(); c.arc(p.x * w, p.y * h, p.r, 0, 6.283); c.fill();
  });
}
function bgStart() {
  if (!bg.ctx || bg.run) return;
  if (!S.settings.anim || reduced() || document.hidden) { if (bg.ctx) { bg.ctx.clearRect(0, 0, innerWidth, innerHeight); if (S.settings.anim) bgDraw(); } return; }
  bg.run = true; let last = 0;
  (function loop(now) {
    if (!S.settings.anim || document.hidden) { bg.run = false; return; }
    if (now - last > 33) {
      last = now;
      bg.ps.forEach(p => { p.y -= p.v * 33; if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); } });
      bgDraw();
    }
    requestAnimationFrame(loop);
  })(0);
}

/* ---------------- оформление ---------------- */
function applyTheme() {
  const st = S.settings, t = THEMES.find(x => x.id === st.theme) || THEMES[0], r = document.documentElement.style;
  r.setProperty('--bg1', t.a); r.setProperty('--bg2', t.b);
  r.setProperty('--codefs', st.fs + 'px'); r.setProperty('--codelh', Math.round(st.fs * 1.5) + 'px');
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', t.a);
}

/* ---------------- подсветка синтаксиса ---------------- */
const KW = new Set('if else for while do switch case default break continue return struct class using namespace const static auto new delete true false nullptr typedef template public private sizeof constexpr'.split(' '));
const TY = new Set('int long short unsigned signed double float char bool void string vector size_t'.split(' '));
const SD = new Set('cout cin endl cerr getline std'.split(' '));
const TOK = /(\/\/[^\n]*)|(\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?)|('(?:\\.|[^'\\\n])*'?)|(^[ \t]*#[^\n]*)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[uUlLfF]*\b|\.\d+)|([A-Za-z_]\w*)|([\s\S])/gm;
function highlight(src) {
  const lines = []; let cur = '';
  const push = (cls, text) => {
    const parts = text.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) { lines.push(cur); cur = ''; }
      if (parts[i]) cur += cls ? '<span class="' + cls + '">' + esc(parts[i]) + '</span>' : esc(parts[i]);
    }
  };
  TOK.lastIndex = 0; let m;
  while ((m = TOK.exec(src))) {
    if (m[0] === '') { TOK.lastIndex++; continue; }
    if (m[1] || m[2]) push('t4', m[0]);
    else if (m[3] || m[4]) push('t3', m[0]);
    else if (m[5]) push('t6', m[0]);
    else if (m[6]) push('t5', m[0]);
    else if (m[7]) {
      const w = m[7];
      if (KW.has(w)) push('t1', w);
      else if (TY.has(w)) push('t2', w);
      else if (SD.has(w)) push('t6', w);
      else if (/^\s*\(/.test(src.slice(TOK.lastIndex, TOK.lastIndex + 12))) push('t7', w);
      else push('', w);
    } else push('', m[0]);
  }
  lines.push(cur);
  return lines;
}
function codeBlockHtml(code) {
  return '<pre class="code">' + highlight(code.replace(/\n$/, '')).map(l => '<span class="ln">' + l + '</span>').join('') + '</pre>';
}

/* ---------------- редактор кода ---------------- */
const SYMS = [
  ['Tab', '    ', 'wide'], ['{ }', '{\n    \n}', 'wide', -2], ['{', '{'], ['}', '}'], ['(', '('], [')', ')'], ['[', '['], [']', ']'], [';', ';'],
  ['<', '<'], ['>', '>'], ['"', '"'], ["'", "'"], ['&', '&'], ['|', '|'], ['=', '='], ['+', '+'], ['-', '-'], ['*', '*'], ['/', '/'], ['%', '%'],
  ['!', '!'], ['#', '#'], [',', ','], ['.', '.'], [':', ':'], ['←', null, '', -1], ['→', null, '', 1]
];
let symEd = null, symTouch = false, symTimer = 0;
function symInit() {
  const bar = $('#symbar');
  bar.innerHTML = SYMS.map((s, i) => '<button type="button" data-i="' + i + '" class="' + (s[2] || '') + '">' + esc(s[0]) + '</button>').join('');
  bar.addEventListener('mousedown', e => e.preventDefault());
  bar.addEventListener('touchstart', () => { symTouch = true; clearTimeout(symTimer); symTimer = setTimeout(() => { symTouch = false; }, 700); }, { passive: true });
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !symEd) return;
    const s = SYMS[+b.dataset.i], ta = symEd.ta;
    ta.focus({ preventScroll: true });
    if (s[1] === null) { const p = clamp(ta.selectionStart + s[3], 0, ta.value.length); ta.setSelectionRange(p, p); }
    else symEd.insert(s[1], s[3] || 0);
  });
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', symPlace);
    visualViewport.addEventListener('scroll', symPlace);
  }
}
function symPlace() {
  const bar = $('#symbar'), app = $('#app'), vv = window.visualViewport;
  if (!vv) { app.style.paddingBottom = bar.classList.contains('show') ? '52px' : ''; return; }
  const kb = symEd && (innerHeight - vv.height > 90);
  bar.style.bottom = Math.max(0, innerHeight - vv.height - vv.offsetTop) + 'px';
  if (kb) {
    app.style.top = vv.offsetTop + 'px'; app.style.bottom = 'auto'; app.style.height = vv.height + 'px';
    app.style.paddingBottom = bar.classList.contains('show') ? '52px' : '';
    try { window.scrollTo(0, 0); } catch (e) {}
  } else {
    app.style.top = ''; app.style.bottom = ''; app.style.height = '';
    app.style.paddingBottom = bar.classList.contains('show') ? '52px' : '';
  }
}
function symShow(ed) {
  clearTimeout(symTimer); symEd = ed;
  if (!S.settings.sym) return;
  $('#symbar').classList.add('show'); symPlace();
}
function symHide() {
  symEd = null; $('#symbar').classList.remove('show'); symPlace();
}
function symBlur(ed) {
  setTimeout(() => {
    if (symEd !== ed) return;
    if (symTouch || document.activeElement === ed.ta) return;
    symHide();
  }, 350);
}

function makeEditor(opts) {
  opts = opts || {};
  const wrap = document.createElement('div');
  wrap.className = 'ed' + (opts.small ? ' small' : '');
  wrap.innerHTML = '<pre class="ed-hl" aria-hidden="true"><code></code></pre><textarea class="ed-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea>';
  const hl = wrap.firstChild, codeEl = hl.firstChild, ta = wrap.lastChild;
  let errLine = 0;
  const api = {
    el: wrap, ta,
    get value() { return ta.value; },
    set value(v) { ta.value = v; errLine = 0; paint(); },
    setErr(n) { errLine = n; paint(); },
    focus() { ta.focus(); },
    insert(text, back) {
      const s = ta.selectionStart, e = ta.selectionEnd;
      ta.setRangeText(text, s, e, 'end');
      if (back) { const p = ta.selectionStart + back; ta.setSelectionRange(p, p); }
      changed();
    }
  };
  function sync() { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; }
  function paint() {
    codeEl.innerHTML = highlight(ta.value).map((h, i) => '<span class="ln' + (i + 1 === errLine ? ' err' : '') + '">' + h + '</span>').join('');
    sync();
  }
  function changed() { errLine = 0; paint(); if (opts.onChange) opts.onChange(ta.value); }
  ta.addEventListener('input', changed);
  ta.addEventListener('scroll', sync);
  if (!opts.small) {
    ta.addEventListener('keydown', e => {
      if (e.key === 'Tab') { e.preventDefault(); api.insert('    '); return; }
      if (e.key === 'Enter' && !e.isComposing) {
        const v = ta.value, s = ta.selectionStart, ls = v.lastIndexOf('\n', s - 1) + 1;
        const indent = /^[ \t]*/.exec(v.slice(ls, s))[0];
        const before = v[s - 1], after = v[ta.selectionEnd];
        e.preventDefault();
        if (before === '{' && after === '}') api.insert('\n' + indent + '    \n' + indent, -(indent.length + 1));
        else api.insert('\n' + indent + (before === '{' ? '    ' : ''));
      }
    });
    ta.addEventListener('focus', () => symShow(api));
    ta.addEventListener('blur', () => symBlur(api));
  }
  ta.value = opts.value || '';
  paint();
  return api;
}

/* ---------------- выполнение и проверка ---------------- */
function trunc(s, n) { s = String(s); return s.length > n ? s.slice(0, n) + '\n… (обрезано)' : s; }
function runInto(outEl, ed, code, input) {
  outEl.style.display = 'block';
  outEl.innerHTML = '<div class="muted">Выполняется…</div>';
  setTimeout(() => {
    const r = I.run(code, input);
    let html = '';
    if (r.err && r.err.kind === 'compile') {
      html = '<div class="h bad">Ошибка компиляции</div><div class="m">' + (r.err.line ? 'строка ' + r.err.line + ': ' : '') + esc(r.err.msg) + '</div>';
      if (r.err.line) ed.setErr(r.err.line);
    } else if (r.err) {
      html = '<div class="h">Вывод</div><div class="m">' + esc(trunc(r.out, 4000)) + '</div><div class="h bad" style="margin-top:8px">Ошибка выполнения</div><div class="m">' + (r.err.line ? 'строка ' + r.err.line + ': ' : '') + esc(r.err.msg) + '</div>';
      if (r.err.line) ed.setErr(r.err.line);
    } else {
      html = '<div class="h good">Вывод</div><div class="m">' + (r.out ? esc(trunc(r.out, 4000)) : '<span class="muted">(ничего не выведено)</span>') + '</div>';
      if (r.code) html += '<div class="small warn" style="margin-top:6px">main вернул код ' + r.code + '</div>';
    }
    outEl.innerHTML = html;
    outEl.scrollTop = 0;
  }, 25);
}
function markDone(l) {
  const first = !S.done[l.id];
  if (!first) return false;
  S.done[l.id] = true;
  addXP(l.xp);
  const today = dayKey(0);
  if (S.last !== today) { S.streak = S.last === dayKey(-1) ? S.streak + 1 : 1; S.last = today; }
  saveNow();
  return true;
}
function dayKey(offset) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function addXP(n) {
  const before = level(); S.xp += n;
  if (level() > before) setTimeout(() => toast('Новый уровень: ' + level() + '!', 'ok'), 700);
}
function nextLesson(l) { const i = LESSONS.indexOf(l); return LESSONS[i + 1] || null; }
function checkInto(outEl, ed, l, code) {
  outEl.style.display = 'block';
  outEl.innerHTML = '<div class="muted">Проверяю…</div>';
  setTimeout(() => {
    const res = I.check(code, l.tests), ok = res.passed === res.total;
    let html = '<div class="h ' + (ok ? 'good' : 'bad') + '">' + (ok ? 'Все тесты пройдены!' : 'Тесты: ' + res.passed + ' из ' + res.total) + '</div>';
    if (res.compileErr) {
      html += '<div class="m bad">Ошибка компиляции' + (res.compileErr.line ? ', строка ' + res.compileErr.line : '') + ': ' + esc(res.compileErr.msg) + '</div>';
      if (res.compileErr.line) ed.setErr(res.compileErr.line);
    } else {
      res.results.forEach((r, i) => {
        html += '<div class="tr"><span class="' + (r.ok ? 'good' : 'bad') + '">' + (r.ok ? '✓' : '✗') + '</span> Тест ' + (i + 1) + (r.skipped ? ' <span class="muted small">(не запускался)</span>' : '') + '</div>';
      });
      const f = res.results.find(r => !r.ok && !r.skipped);
      if (f) {
        html += '<div class="h" style="margin-top:8px">Первый неудачный тест</div><div class="m">Ввод: ' + (f.input ? esc(trunc(f.input, 300)) : '(пусто)') + '\nОжидалось:\n' + esc(trunc(f.expected, 400)) + '\nПолучено:\n' + (f.got ? esc(trunc(f.got, 400)) : '(пусто)') + '</div>';
        if (f.err) {
          html += '<div class="m bad" style="margin-top:6px">' + esc(f.err.msg) + (f.err.line ? ' (строка ' + f.err.line + ')' : '') + '</div>';
          if (f.err.line) ed.setErr(f.err.line);
        }
      }
    }
    if (ok) {
      const first = markDone(l);
      if (first) { html += '<div class="good" style="margin-top:8px;font-weight:700">+' + l.xp + ' XP</div>'; confetti(); vibrate(40); toast('Урок пройден: +' + l.xp + ' XP', 'ok'); }
      const nx = nextLesson(l);
      html += '<div class="btns" style="margin-top:8px"><button class="btn green sm" id="nx">' + (nx ? 'Следующий урок →' : 'К курсу') + '</button></div>';
    } else {
      V.fails[l.id] = (V.fails[l.id] || 0) + 1;
      vibrate(15);
    }
    outEl.innerHTML = html; outEl.scrollTop = 0;
    const nb = $('#nx', outEl);
    if (nb) nb.onclick = () => { const nx = nextLesson(l); if (nx) openLesson(nx.id, true); else closeView(); };
  }, 25);
}

/* ---------------- навигация ---------------- */
let pushed = 0;
function pushView() { try { history.pushState({ v: 1 }, ''); pushed++; return true; } catch (e) { return false; } }
function openLesson(id, replace) {
  if (V.lesson && replace) { try { history.replaceState({ v: 1 }, ''); } catch (e) {} }
  else if (!V.lesson) pushView();
  V.lesson = id; V.ltab = 'theory'; render();
}
function openQuiz(mid) {
  if (!V.quiz) pushView();
  const qs = D.quizzes[mid].map(q => {
    const order = q.o.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    return { q, order };
  });
  V.quiz = { mid, qs, i: 0, score: 0, picked: -1, done: false };
  render();
}
function closeView() { V.lesson = null; V.quiz = null; render(); }
function goBack() { if (pushed > 0) history.back(); else closeView(); }
window.addEventListener('popstate', () => {
  if (pushed > 0) pushed--;
  closeModal();
  if (V.lesson || V.quiz) closeView();
});
function setTab(t) { if (V.tab === t && !V.lesson && !V.quiz) return; scrollPos[V.tab] = $('#main').scrollTop; V.tab = t; V.lesson = null; V.quiz = null; render(); }

const TABS = [['path', '{ }', 'Курс'], ['sandbox', '▶', 'Песочница'], ['quiz', '?', 'Квизы'], ['ref', '≡', 'Справка'], ['me', '☺', 'Профиль']];
function renderTabbar() {
  $('#tabbar').innerHTML = TABS.map(t => '<button data-t="' + t[0] + '" class="' + (V.tab === t[0] ? 'on' : '') + '"><span class="ic">' + esc(t[1]) + '</span>' + t[2] + '</button>').join('');
  $('#tabbar').classList.toggle('hide', !!V.lesson);
}

function render() {
  const main = $('#main');
  symHide(); closeModal();
  main.className = ''; main.scrollTop = 0; main.onclick = null;
  renderTabbar();
  if (V.lesson) renderLesson(main);
  else if (V.quiz) renderQuizRun(main);
  else {
    ({ path: renderPath, sandbox: renderSandbox, quiz: renderQuizList, ref: renderRef, me: renderMe })[V.tab](main);
    if (V.tab !== 'sandbox' && scrollPos[V.tab]) main.scrollTop = scrollPos[V.tab];
  }
}

/* ---------------- вкладка «Курс» ---------------- */
function renderPath(main) {
  const total = LESSONS.length, doneN = LESSONS.filter(l => S.done[l.id]).length, pct = Math.round(doneN * 100 / total);
  const next = LESSONS.find(l => !S.done[l.id]);
  let html = '<h1>C++ Академия</h1><p class="sub">Учись и сразу запускай код — даже без интернета</p>';
  html += '<div class="card"><div class="row"><div class="ring" style="--p:' + pct + '"><b>' + pct + '%</b></div><div class="grow">' +
    '<div class="row"><div class="stat"><b>' + S.xp + '</b><span>XP</span></div><div class="stat"><b>' + level() + '</b><span>уровень</span></div><div class="stat"><b>' + (S.last === dayKey(0) || S.last === dayKey(-1) ? S.streak : 0) + '</b><span>дней подряд</span></div></div>' +
    '<div class="bar" style="margin-top:10px"><i style="width:' + (S.xp % 100) + '%"></i></div><div class="small muted" style="margin-top:4px">' + (100 - S.xp % 100) + ' XP до следующего уровня</div></div></div>' +
    '<div style="margin-top:12px">' + (next ? '<button class="btn primary big" data-les="' + next.id + '">' + (doneN ? 'Продолжить' : 'Начать') + ': ' + esc(next.title) + '</button>' : '<div class="banner" style="background:rgba(90,225,150,.14);border-color:rgba(90,225,150,.4)">Курс пройден! Теперь загляни в песочницу и придумай свои задачи.</div>') + '</div></div>';
  D.modules.forEach((m, mi) => {
    const dn = m.lessons.filter(l => S.done[l.id]).length;
    const open = m.id in V.open ? V.open[m.id] : (next && next.mod === m);
    html += '<div class="card mod' + (open ? ' open' : '') + '"><button class="mod-h" data-mod="' + m.id + '"><span class="dot" style="background:' + m.color + '"></span><span class="grow"><b>' + (mi + 1) + '. ' + esc(m.title) + '</b></span><span class="cnt">' + dn + '/' + m.lessons.length + '</span><span class="chev">›</span></button><div class="mod-b">';
    m.lessons.forEach(l => {
      const done = !!S.done[l.id], isNext = next === l;
      html += '<button class="les" data-les="' + l.id + '"><span class="num' + (done ? ' done' : isNext ? ' next' : '') + '">' + (done ? '✓' : LESSONS.indexOf(l) + 1) + '</span><span class="grow"><span class="ell" style="display:block">' + esc(l.title) + '</span><span class="small muted">' + (l.noTask ? 'чтение' : 'задача') + ' · ' + l.xp + ' XP</span></span></button>';
    });
    html += '</div></div>';
  });
  main.innerHTML = html;
  main.onclick = e => {
    const lb = e.target.closest('[data-les]'); if (lb) { scrollPos.path = main.scrollTop; openLesson(lb.dataset.les); return; }
    const mb = e.target.closest('[data-mod]'); if (mb) {
      const card = mb.parentNode; card.classList.toggle('open'); V.open[mb.dataset.mod] = card.classList.contains('open');
    }
  };
}

/* ---------------- урок ---------------- */
function renderTheory(src) {
  const lines = src.replace(/^\n+|\n+$/g, '').split('\n'); let out = '', para = [], code = null;
  const flush = () => { if (para.length) { out += '<p>' + fmtInline(para.join(' ')) + '</p>'; para = []; } };
  for (const ln of lines) {
    const t = ln.trim();
    if (code) {
      if (t === '@@') {
        out += codeBlockHtml(code.lines.join('\n'));
        if (code.run) { const i = renderTheory.blocks.push(code.lines.join('\n')) - 1; out += '<div class="btns" style="margin:-4px 0 12px"><button class="btn sm" data-sb="' + i + '">▶ Попробовать в песочнице</button></div>'; }
        code = null;
      } else code.lines.push(ln);
      continue;
    }
    if (t === '@@' || t === '@@run') { flush(); code = { lines: [], run: t === '@@run' }; continue; }
    if (!t) { flush(); continue; }
    if (t.startsWith('# ')) { flush(); out += '<h2>' + fmtInline(t.slice(2)) + '</h2>'; continue; }
    if (t.startsWith('- ')) { flush(); out += '<p class="li">• ' + fmtInline(t.slice(2)) + '</p>'; continue; }
    para.push(t);
  }
  flush();
  return out;
}
renderTheory.blocks = [];

function renderLesson(main) {
  const l = BYID[V.lesson];
  main.className = 'nopad';
  main.innerHTML = '<div class="topbar"><button class="back" id="bk" aria-label="Назад">‹</button><div class="ttl"><b>' + esc(l.title) + '</b><span>' + esc(l.mod.title) + ' · ' + l.xp + ' XP' + (S.done[l.id] ? ' · ✓ пройден' : '') + '</span></div></div>' +
    '<div class="lesson"><div class="tabsrow"><div class="seg" id="lt"></div></div><div id="lbody" style="flex:1;min-height:0;display:flex;flex-direction:column"></div></div>';
  $('#bk').onclick = goBack;
  const tabs = l.noTask ? [['theory', 'Теория']] : [['theory', 'Теория'], ['task', 'Задача'], ['code', 'Код']];
  const seg = $('#lt');
  const drawTabs = () => { seg.innerHTML = tabs.map(t => '<button data-k="' + t[0] + '" class="' + (V.ltab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join(''); };
  const show = k => { V.ltab = k; drawTabs(); symHide(); lessonBody(l); };
  seg.onclick = e => { const b = e.target.closest('button'); if (b) show(b.dataset.k); };
  if (l.noTask) $('.tabsrow', main).style.display = 'none';
  drawTabs(); lessonBody(l);
}
function lessonBody(l) {
  const body = $('#lbody');
  const go = k => { const b = $('#lt [data-k="' + k + '"]'); if (b) b.click(); };
  if (V.ltab === 'theory') {
    renderTheory.blocks = [];
    let html = '<div class="lbody theory">' + renderTheory(l.theory);
    if (l.noTask) html += '<button class="btn ' + (S.done[l.id] ? '' : 'green') + ' big" id="fin">' + (S.done[l.id] ? 'Курс завершён ✓' : 'Завершить курс (+' + l.xp + ' XP)') + '</button>';
    else html += '<button class="btn primary big" id="gt">К задаче →</button>';
    body.innerHTML = html + '</div>';
    const blocks = renderTheory.blocks.slice();
    body.onclick = e => {
      const sb = e.target.closest('[data-sb]');
      if (sb) { S.sandbox = blocks[+sb.dataset.sb]; save(); V.lesson = null; V.tab = 'sandbox'; if (pushed > 0) { try { history.back(); } catch (x) {} } render(); toast('Код открыт в песочнице'); }
    };
    const gt = $('#gt'); if (gt) gt.onclick = () => go('task');
    const fin = $('#fin'); if (fin) fin.onclick = () => { if (markDone(l)) { confetti(); toast('Курс завершён: +' + l.xp + ' XP', 'ok'); } closeViewSoon(); };
  } else if (V.ltab === 'task') {
    body.onclick = null;
    let html = '<div class="lbody"><div class="card"><div class="lbl">Задача</div><div class="taskbox">' + fmtInline(l.task) + '</div></div><div class="lbl">Примеры проверки</div>';
    l.tests.slice(0, 2).forEach(t => { html += '<div class="testbox">Ввод: ' + (t.in ? esc(t.in) : '(пусто)') + '\nВывод:\n' + esc(t.out) + '</div>'; });
    html += '<div class="small muted" style="margin:-4px 0 12px">Всего тестов: ' + l.tests.length + '. Проверка сравнивает вывод построчно.</div><div class="btns"><button class="btn" id="hn">Подсказка</button><button class="btn primary" id="gc">Открыть редактор</button></div><div id="hintbox" style="margin-top:10px"></div></div>';
    body.innerHTML = html;
    $('#hn').onclick = () => { $('#hintbox').innerHTML = '<div class="banner">' + fmtInline(l.hint) + '</div>'; };
    $('#gc').onclick = () => go('code');
  } else {
    body.onclick = null;
    codeTab(body, l);
  }
}
function closeViewSoon() { setTimeout(() => goBack(), 700); }

function codeTab(body, l) {
  body.innerHTML = '<div class="codewrap"><div class="lbl" style="margin:0 2px -4px">Код</div><div id="edslot" style="flex:1;min-height:0;display:flex;flex-direction:column"></div><div class="lbl" style="margin:0 2px -4px">Ввод для программы</div><div id="inslot"></div>' +
    '<div class="btns"><button class="btn primary" id="rn">▶ Запуск</button><button class="btn green" id="ck">✓ Проверить</button><button class="btn" id="mn" style="flex:none">⋯</button></div><div class="out" id="out" style="display:none"></div></div>';
  const ed = makeEditor({ value: l.id in S.code ? S.code[l.id] : l.starter, onChange: v => { S.code[l.id] = v; save(); } });
  ed.el.style.flex = '1';
  $('#edslot').appendChild(ed.el);
  const inp = makeEditor({ small: true, value: l.tests[0].in || '' });
  $('#inslot').appendChild(inp.el);
  const out = $('#out');
  $('#rn').onclick = () => runInto(out, ed, ed.value, inp.value);
  $('#ck').onclick = () => checkInto(out, ed, l, ed.value);
  $('#mn').onclick = () => {
    const box = modal('<h2 style="margin-top:0">Меню</h2><div class="btns" style="flex-direction:column"><button class="btn" id="m1">Подсказка</button><button class="btn" id="m2">Показать решение</button><button class="btn" id="m3">Сбросить код к заготовке</button><button class="btn" id="m4">Подставить ввод из теста</button></div>');
    $('#m1', box).onclick = () => { closeModal(); out.style.display = 'block'; out.innerHTML = '<div class="h">Подсказка</div><div class="m">' + fmtInline(l.hint).replace(/<\/?code>/g, '') + '</div>'; };
    $('#m2', box).onclick = () => {
      const tries = V.fails[l.id] || 0;
      const b2 = modal('<h2 style="margin-top:0">Решение</h2>' + (S.done[l.id] || tries >= 2 ? '' : '<div class="banner" style="margin-bottom:10px">Попробуй сначала сам: ты ещё не проверял решение несколько раз. Подсмотреть можно, но так запоминается хуже.</div>') + codeBlockHtml(l.solution) + '<div class="btns"><button class="btn" id="s1">Закрыть</button><button class="btn primary" id="s2">Вставить в редактор</button></div>');
      $('#s1', b2).onclick = closeModal;
      $('#s2', b2).onclick = () => { closeModal(); ed.value = l.solution; S.code[l.id] = l.solution; save(); };
    };
    $('#m3', box).onclick = () => confirmBox('Сбросить код?', 'Твой текущий код будет заменён заготовкой.', 'Сбросить', () => { ed.value = l.starter; S.code[l.id] = l.starter; save(); });
    $('#m4', box).onclick = () => { closeModal(); inp.value = l.tests[0].in || ''; };
  };
}

/* ---------------- песочница ---------------- */
function renderSandbox(main) {
  main.className = 'nopad';
  main.innerHTML = '<div class="topbar"><div class="ttl"><b>Песочница</b><span>Свободный код: пиши что угодно</span></div></div><div class="codewrap" style="padding-top:10px"><div id="edslot" style="flex:1;min-height:0;display:flex;flex-direction:column"></div><div class="lbl" style="margin:0 2px -4px">Ввод для программы</div><div id="inslot"></div><div class="btns"><button class="btn primary" id="rn">▶ Запуск</button><button class="btn" id="mn" style="flex:none">⋯</button></div><div class="out" id="out" style="display:none"></div></div>';
  const ed = makeEditor({ value: S.sandbox, onChange: v => { S.sandbox = v; save(); } });
  ed.el.style.flex = '1'; $('#edslot').appendChild(ed.el);
  const inp = makeEditor({ small: true, value: S.sbInput, onChange: v => { S.sbInput = v; save(); } });
  $('#inslot').appendChild(inp.el);
  const out = $('#out');
  $('#rn').onclick = () => runInto(out, ed, ed.value, inp.value);
  $('#mn').onclick = () => {
    const box = modal('<h2 style="margin-top:0">Песочница</h2><div class="btns" style="flex-direction:column"><button class="btn" id="m1">Шаблон: чтение чисел</button><button class="btn" id="m2">Шаблон: Hello</button><button class="btn" id="m3">Очистить</button></div>');
    $('#m1', box).onclick = () => { closeModal(); ed.value = '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> v(n);\n    for (int i = 0; i < n; i++) cin >> v[i];\n    int sum = 0;\n    for (int x : v) sum += x;\n    cout << sum << endl;\n    return 0;\n}\n'; inp.value = '3\n10 20 30'; S.sandbox = ed.value; S.sbInput = inp.value; save(); };
    $('#m2', box).onclick = () => { closeModal(); ed.value = SANDBOX0; S.sandbox = SANDBOX0; save(); };
    $('#m3', box).onclick = () => confirmBox('Очистить редактор?', 'Весь код в песочнице будет удалён.', 'Очистить', () => { ed.value = ''; S.sandbox = ''; save(); });
  };
}

/* ---------------- квизы ---------------- */
function renderQuizList(main) {
  let html = '<h1>Квизы</h1><p class="sub">Короткие тесты по темам. За каждый новый правильный ответ — 5 XP.</p>';
  D.modules.forEach((m, i) => {
    const q = D.quizzes[m.id]; if (!q) return;
    const best = S.quiz[m.id];
    html += '<div class="card"><div class="row"><span class="dot" style="background:' + m.color + '"></span><div class="grow"><b>' + (i + 1) + '. ' + esc(m.title) + '</b><div class="small muted">' + q.length + ' вопросов · ' + (best === undefined ? 'ещё не проходил' : 'лучший результат ' + best + '/' + q.length) + '</div></div><button class="btn sm primary" data-q="' + m.id + '">' + (best === undefined ? 'Начать' : 'Ещё раз') + '</button></div></div>';
  });
  main.innerHTML = html;
  main.onclick = e => { const b = e.target.closest('[data-q]'); if (b) { scrollPos.quiz = main.scrollTop; openQuiz(b.dataset.q); } };
}
function renderQuizRun(main) {
  const Q = V.quiz, m = D.modules.find(x => x.id === Q.mid), total = Q.qs.length;
  main.className = 'nopad';
  let body = '';
  if (Q.done) {
    const pct = Math.round(Q.score * 100 / total), prev = S.quiz[Q.mid] || 0;
    const gain = Math.max(0, Q.score - prev) * 5;
    if (Q.score > prev || S.quiz[Q.mid] === undefined) S.quiz[Q.mid] = Math.max(prev, Q.score);
    if (gain && !Q.paid) { Q.paid = true; addXP(gain); }
    saveNow();
    if (pct >= 80 && !Q.fx) { Q.fx = true; setTimeout(confetti, 150); }
    body = '<div class="lbody"><div class="card" style="text-align:center"><div class="ring" style="--p:' + pct + ';margin:6px auto 10px;--c:' + (pct >= 60 ? 'var(--good)' : 'var(--warn)') + '"><b>' + Q.score + '/' + total + '</b></div><h2 style="margin:4px 0">' + (pct === 100 ? 'Безупречно!' : pct >= 60 ? 'Хороший результат' : 'Стоит повторить тему') + '</h2><p class="muted" style="margin:0">' + (gain ? '+' + gain + ' XP за новые правильные ответы' : 'Рекорд пока не побит') + '</p></div><div class="btns"><button class="btn" id="qa">Ещё раз</button><button class="btn primary" id="ql">К списку</button></div></div>';
  } else {
    const cur = Q.qs[Q.i], q = cur.q, answered = Q.picked >= 0, correctPos = cur.order.indexOf(q.a);
    body = '<div class="lbody"><div class="bar" style="margin:4px 0 12px"><i style="width:' + Math.round(Q.i * 100 / total) + '%"></i></div><div class="qtext">' + fmtInline(q.q) + '</div>' + (q.code ? codeBlockHtml(q.code) : '');
    cur.order.forEach((oi, pos) => {
      let cls = 'opt';
      if (answered) { if (pos === correctPos) cls += ' ok'; else if (pos === Q.picked) cls += ' bad'; }
      body += '<button class="' + cls + '" data-p="' + pos + '"' + (answered ? ' disabled' : '') + '><span class="l">' + 'ABCD'[pos] + '</span><span class="grow">' + fmtInline(q.o[oi]) + '</span></button>';
    });
    if (answered) body += '<div class="expl"><b class="' + (Q.picked === correctPos ? 'good' : 'bad') + '">' + (Q.picked === correctPos ? 'Верно!' : 'Не совсем.') + '</b> ' + fmtInline(q.e) + '</div><button class="btn primary big" id="qn">' + (Q.i + 1 < total ? 'Дальше →' : 'Результат') + '</button>';
    body += '</div>';
  }
  main.innerHTML = '<div class="topbar"><button class="back" id="bk" aria-label="Назад">‹</button><div class="ttl"><b>Квиз: ' + esc(m.title) + '</b><span>' + (Q.done ? 'Результат' : 'Вопрос ' + (Q.i + 1) + ' из ' + total) + '</span></div></div>' + body;
  $('#bk').onclick = goBack;
  main.onclick = e => {
    const o = e.target.closest('[data-p]');
    if (o && Q.picked < 0) {
      Q.picked = +o.dataset.p;
      const cur = Q.qs[Q.i];
      if (Q.picked === cur.order.indexOf(cur.q.a)) { Q.score++; vibrate(20); } else vibrate(15);
      const top = $('.lbody', main).scrollTop; renderQuizRun(main); $('.lbody', main).scrollTop = top; return;
    }
    if (e.target.closest('#qn')) { if (Q.i + 1 < total) { Q.i++; Q.picked = -1; } else Q.done = true; renderQuizRun(main); return; }
    if (e.target.closest('#qa')) { const mid = Q.mid; V.quiz = null; openQuiz(mid); return; }
    if (e.target.closest('#ql')) goBack();
  };
}

/* ---------------- справочник ---------------- */
function renderRef(main) {
  main.innerHTML = '<h1>Справочник</h1><p class="sub">Шпаргалка по основам C++</p><input class="search" id="sq" type="search" placeholder="Поиск: vector, sort, for…" autocomplete="off" autocapitalize="off"><div id="rl"></div>';
  const draw = q => {
    q = q.trim().toLowerCase();
    const items = D.ref.filter(r => !q || (r.t + ' ' + r.d + ' ' + r.code).toLowerCase().includes(q));
    let html = items.map(r => '<details class="help"><summary>' + esc(r.t) + '</summary><p>' + fmtInline(r.d) + '</p>' + codeBlockHtml(r.code) + '</details>').join('');
    if (!items.length) html = '<p class="muted">Ничего не найдено. Попробуй другое слово.</p>';
    if (!q) html += '<h2>Частые вопросы</h2>' + D.faq.map(f => '<details class="help"><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>').join('');
    $('#rl').innerHTML = html;
  };
  $('#sq').oninput = e => draw(e.target.value);
  draw('');
}

/* ---------------- профиль ---------------- */
function renderMe(main) {
  const st = S.settings, doneN = LESSONS.filter(l => S.done[l.id]).length;
  const quizN = Object.keys(S.quiz).length;
  main.innerHTML = '<h1>Профиль</h1>' +
    '<div class="card"><div class="row"><div class="stat"><b>' + level() + '</b><span>уровень</span></div><div class="stat"><b>' + S.xp + '</b><span>XP</span></div><div class="stat"><b>' + doneN + '/' + LESSONS.length + '</b><span>уроков</span></div><div class="stat"><b>' + quizN + '/' + D.modules.length + '</b><span>квизов</span></div></div>' + (storageOK ? '' : '<div class="banner" style="margin-top:10px">Браузер не разрешает сохранять данные (приватный режим?). Прогресс пропадёт при закрытии.</div>') + '</div>' +
    '<h2>Оформление</h2><div class="card"><div class="themes" id="th">' + THEMES.map(t => '<button class="theme' + (st.theme === t.id ? ' on' : '') + '" data-th="' + t.id + '" style="background:linear-gradient(160deg,' + t.a + ',' + t.b + ')">' + t.name + '</button>').join('') + '</div>' +
    '<div class="field"><span>Размер кода: <b id="fsv">' + st.fs + '</b> px</span><input type="range" id="fs" min="12" max="22" step="1" value="' + st.fs + '"></div>' +
    '<div class="field"><span>Панель символов над клавиатурой</span><button class="sw' + (st.sym ? ' on' : '') + '" id="sw1" aria-label="Панель символов"></button></div>' +
    '<div class="field"><span>Анимация фона</span><button class="sw' + (st.anim ? ' on' : '') + '" id="sw2" aria-label="Анимация фона"></button></div></div>' +
    '<h2>Резервная копия</h2><div class="card"><p class="small muted" style="margin-top:0">Скопируй текст и сохрани в заметках — так можно перенести прогресс на другое устройство.</p><textarea class="plain" id="bk" spellcheck="false" autocapitalize="off"></textarea><div class="btns" style="margin-top:8px"><button class="btn" id="b1">Скопировать</button><button class="btn primary" id="b2">Загрузить</button></div></div>' +
    '<h2>Установка на телефон</h2><details class="help"><summary>iPhone / iPad (Safari)</summary><ol><li>Открой сайт в <b>Safari</b>.</li><li>Нажми «Поделиться» (квадрат со стрелкой).</li><li>Выбери «На экран “Домой”».</li></ol></details><details class="help"><summary>Android (Chrome)</summary><ol><li>Открой сайт в Chrome.</li><li>Меню ⋮ → «Установить приложение» или «Добавить на главный экран».</li></ol></details><details class="help"><summary>Работа без интернета</summary><p>Один раз открой приложение с интернетом и подожди пару секунд. Дальше оно запускается и без сети.</p></details>' +
    '<h2>Опасная зона</h2><div class="card"><button class="btn red big" id="rs">Сбросить прогресс</button></div><p class="small muted" style="text-align:center">C++ Академия · v1</p>';
  const bk = $('#bk'); bk.value = JSON.stringify(S);
  $('#th').onclick = e => { const b = e.target.closest('[data-th]'); if (!b) return; st.theme = b.dataset.th; applyTheme(); saveNow(); $$('#th .theme').forEach(x => x.classList.toggle('on', x === b)); };
  $('#fs').oninput = e => { st.fs = +e.target.value; $('#fsv').textContent = st.fs; applyTheme(); save(); };
  $('#sw1').onclick = e => { st.sym = !st.sym; e.currentTarget.classList.toggle('on', st.sym); saveNow(); };
  $('#sw2').onclick = e => { st.anim = !st.anim; e.currentTarget.classList.toggle('on', st.anim); saveNow(); bg.run = false; bgStart(); };
  $('#b1').onclick = () => {
    bk.focus(); bk.select();
    try { navigator.clipboard.writeText(bk.value).then(() => toast('Скопировано', 'ok'), () => toast('Выдели текст и скопируй вручную')); } catch (e) { toast('Выдели текст и скопируй вручную'); }
  };
  $('#b2').onclick = () => {
    let o; try { o = JSON.parse(bk.value); } catch (e) { toast('Не получилось прочитать текст копии', 'bad'); return; }
    if (!o || typeof o !== 'object' || !('xp' in o)) { toast('Это не похоже на копию прогресса', 'bad'); return; }
    confirmBox('Загрузить копию?', 'Текущий прогресс на этом устройстве будет заменён.', 'Загрузить', () => { S = normalize(o); saveNow(); applyTheme(); toast('Прогресс загружен', 'ok'); render(); });
  };
  $('#rs').onclick = () => confirmBox('Сбросить весь прогресс?', 'Уроки, XP, квизы и твой код будут удалены. Настройки оформления сохранятся.', 'Сбросить', () => { const set = S.settings; S = defaults(); S.settings = set; saveNow(); toast('Прогресс сброшен'); render(); });
}

/* ---------------- запуск ---------------- */
$('#tabbar').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.t); });
applyTheme(); symInit(); bgInit(); render();
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
})();
