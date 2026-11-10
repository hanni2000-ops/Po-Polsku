/* global PLCore */
(function () {
  'use strict';
  const C = PLCore;
  const LS_KEY = 'plVokabelApp.v1';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ---------- Zustand ----------
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.vocab)) return s;
      }
    } catch (e) { /* leer starten */ }
    return { vocab: [], settings: { gender: 'f', diacriticsRequired: false } };
  }
  let state = load();
  function save() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  function uid() { return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  // Polnischer Text + deutsche Übersetzung auf Knopfdruck
  function plDe(plText, deText) {
    return '<span class="pl-text">' + plText + '</span>' +
      (deText ? ' <button type="button" class="de-toggle">DE</button><span class="de-text hidden">' + esc(deText) + '</span>' : '');
  }
  document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('de-toggle')) {
      const span = e.target.parentElement.querySelector('.de-text');
      if (span) span.classList.toggle('hidden');
    }
  });

  // ---------- Tabs ----------
  $$('.tab').forEach(btn => btn.addEventListener('click', () => {
    $$('.tab').forEach(b => b.classList.remove('active'));
    $$('.tabpage').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $('#tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'statistik') renderStats();
    if (btn.dataset.tab === 'ueben') refreshSetup();
  }));

  // ---------- Wochen ----------
  function weekKeyLabel(key) {
    const m = String(key).match(/^(\d{4})-KW(\d{2})$/);
    return m ? 'KW ' + parseInt(m[2], 10) + '/' + m[1] : key;
  }
  function allWeeks() {
    const set = new Set(state.vocab.map(v => v.week).filter(Boolean));
    set.add(C.currentWeek().key);
    return Array.from(set).sort().reverse();
  }
  function refreshWeekSelects() {
    const weeks = allWeeks();
    const dl = $('#week-list');
    dl.innerHTML = weeks.map(w => '<option value="' + esc(w) + '">' + esc(weekKeyLabel(w)) + '</option>').join('');
    const cur = C.currentWeek().key;
    $('#f-week').value = cur;
    const fw = $('#filter-week');
    fw.innerHTML = '<option value="">Alle Wochen</option>' + weeks.map(w => '<option value="' + esc(w) + '">' + esc(weekKeyLabel(w)) + '</option>').join('');
    const sw = $('#setup-week');
    sw.innerHTML = weeks.map(w => '<option value="' + esc(w) + '"' + (w === cur ? ' selected' : '') + '>' + esc(weekKeyLabel(w)) + '</option>').join('');
  }

  // ---------- Vokabeln: Formular ----------
  function resetForm() {
    $('#vocab-form').reset();
    $('#f-id').value = '';
    $('#f-week').value = C.currentWeek().key;
    $('#vocab-form-title').textContent = 'Neue Vokabel';
    $('#vocab-cancel').classList.add('hidden');
  }
  $('#vocab-cancel').addEventListener('click', resetForm);

  function parseCustom(id) {
    const v = $(id).value.trim();
    if (!v) return null;
    return v.split(',').map(x => x.trim()).filter(Boolean);
  }
  $('#vocab-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const pl = $('#f-pl').value.trim();
    const de = $('#f-de').value.trim();
    if (!pl || !de) return;
    const entry = {
      id: $('#f-id').value || uid(),
      pl, de,
      pos: $('#f-pos').value,
      week: $('#f-week').value.trim() || C.currentWeek().key,
      plexpl: $('#f-plexpl').value.trim(),
      example: $('#f-example').value.trim(),
      custom: {
        present: parseCustom('#f-custom-present'),
        past: parseCustom('#f-custom-past'),
        future: parseCustom('#f-custom-future')
      },
      stats: null
    };
    const existing = state.vocab.find(v => v.id === entry.id);
    if (existing) {
      entry.stats = existing.stats;
      Object.assign(existing, entry);
    } else {
      state.vocab.push(entry);
    }
    save();
    resetForm();
    renderVocabList();
    refreshWeekSelects();
  });

  // ---------- Vokabeln: Liste ----------
  function statsBadge(v) {
    const s = v.stats;
    if (!s || !s.attempts) return '<span class="badge">nie ćwiczone</span>';
    const pct = Math.round(100 * s.correct / s.attempts);
    const cls = pct >= 70 ? 'ok' : 'bad';
    return '<span class="badge ' + cls + '">' + s.correct + '/' + s.attempts + ' (' + pct + '%)</span>';
  }
  function renderVocabList() {
    const fw = $('#filter-week').value;
    const q = $('#filter-search').value.trim().toLowerCase();
    let list = state.vocab.slice();
    if (fw) list = list.filter(v => v.week === fw);
    if (q) list = list.filter(v => (v.pl + ' ' + v.de + ' ' + (v.plexpl || '')).toLowerCase().includes(q));
    list.sort((a, b) => a.week === b.week ? a.pl.localeCompare(b.pl, 'pl') : b.week.localeCompare(a.week));
    const tb = $('#vocab-table tbody');
    tb.innerHTML = list.map(v =>
      '<tr>' +
      '<td><strong>' + esc(v.pl) + '</strong>' + (C.isReflexive(v.pl) ? ' <span class="muted">(się)</span>' : '') + '</td>' +
      '<td>' + esc(v.de) + '</td>' +
      '<td>' + esc(v.pos) + '</td>' +
      '<td>' + esc(weekKeyLabel(v.week)) + '</td>' +
      '<td>' + statsBadge(v) + '</td>' +
      '<td><button class="small" data-edit="' + v.id + '">Bearbeiten</button> ' +
      '<button class="small danger" data-del="' + v.id + '">Löschen</button></td>' +
      '</tr>'
    ).join('');
    $('#vocab-empty').classList.toggle('hidden', list.length > 0);
  }
  $('#filter-week').addEventListener('change', renderVocabList);
  $('#filter-search').addEventListener('input', renderVocabList);
  $('#vocab-table tbody').addEventListener('click', (e) => {
    const editId = e.target.dataset && e.target.dataset.edit;
    const delId = e.target.dataset && e.target.dataset.del;
    if (editId) {
      const v = state.vocab.find(x => x.id === editId);
      if (!v) return;
      $('#f-id').value = v.id;
      $('#f-pl').value = v.pl;
      $('#f-de').value = v.de;
      $('#f-pos').value = v.pos;
      $('#f-week').value = v.week;
      $('#f-plexpl').value = v.plexpl || '';
      $('#f-example').value = v.example || '';
      $('#f-custom-present').value = v.custom && v.custom.present ? v.custom.present.join(', ') : '';
      $('#f-custom-past').value = v.custom && v.custom.past ? v.custom.past.join(', ') : '';
      $('#f-custom-future').value = v.custom && v.custom.future ? v.custom.future.join(', ') : '';
      $('#vocab-form-title').textContent = 'Vokabel bearbeiten';
      $('#vocab-cancel').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (delId) {
      state.vocab = state.vocab.filter(x => x.id !== delId);
      save();
      renderVocabList();
      refreshWeekSelects();
    }
  });

  // ---------- Statistik ----------
  function renderStats() {
    const weeks = allWeeks().filter(w => state.vocab.some(v => v.week === w));
    let rows = weeks.map(w => {
      const items = state.vocab.filter(v => v.week === w);
      const done = items.filter(v => v.stats && v.stats.attempts > 0).length;
      const okc = items.filter(v => v.stats && v.stats.attempts > 0 && v.stats.correct / v.stats.attempts >= 0.7).length;
      return '<tr><td>' + esc(weekKeyLabel(w)) + '</td><td>' + items.length + '</td><td>' + done + '</td><td>' + okc + '</td></tr>';
    }).join('');
    const all = state.vocab;
    const totA = all.reduce((n, v) => n + (v.stats ? v.stats.attempts : 0), 0);
    const totC = all.reduce((n, v) => n + (v.stats ? v.stats.correct : 0), 0);
    const weak = C.sortByHistory(all.filter(v => v.stats && v.stats.attempts > 0)).slice(0, 8);
    $('#stats-body').innerHTML =
      '<div class="stats-grid"><div>' +
      '<h3>Gesamt</h3><p>Vokabeln: <strong>' + all.length + '</strong><br>Übungsversuche: <strong>' + totA + '</strong><br>Richtig: <strong>' + totC + '</strong>' + (totA ? ' (' + Math.round(100 * totC / totA) + '%)' : '') + '</p>' +
      '</div><div><h3>Pro Woche</h3><table><thead><tr><th>Woche</th><th>Anzahl</th><th>geübt</th><th>„sitzen“ (≥70%)</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="4" class="muted">noch keine Daten</td></tr>') + '</tbody></table></div></div>' +
      '<h3>Schwächste Vokabeln (nach Übungshistorie)</h3>' +
      (weak.length
        ? '<table><thead><tr><th>Polnisch</th><th>Deutsch</th><th>Quote</th></tr></thead><tbody>' +
          weak.map(v => '<tr><td>' + esc(v.pl) + '</td><td>' + esc(v.de) + '</td><td>' + Math.round(100 * v.stats.correct / v.stats.attempts) + '%</td></tr>').join('') +
          '</tbody></table>'
        : '<p class="muted">Noch keine Übungen gemacht.</p>');
  }

  // ---------- Einstellungen ----------
  function renderSettings() {
    $$('input[name="gender"]').forEach(r => { r.checked = (r.value === state.settings.gender); });
    $('#set-diacritics').checked = !!state.settings.diacriticsRequired;
  }
  $$('input[name="gender"]').forEach(r => r.addEventListener('change', () => {
    state.settings.gender = r.value; save();
  }));
  $('#set-diacritics').addEventListener('change', (e) => {
    state.settings.diacriticsRequired = e.target.checked; save();
  });
  $('#btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pl-vokabeln.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('#btn-import').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(rd.result);
        if (data && Array.isArray(data.vocab)) {
          state = { vocab: data.vocab, settings: Object.assign({ gender: 'f', diacriticsRequired: false }, data.settings || {}) };
          save(); renderAll();
          alert('Import erfolgreich: ' + data.vocab.length + ' Vokabeln.');
        } else { alert('Ungültige Datei.'); }
      } catch (err) { alert('Ungültige Datei.'); }
    };
    rd.readAsText(f);
    e.target.value = '';
  });
  $('#btn-wipe').addEventListener('click', () => {
    if (confirm('Wirklich ALLE Vokabeln und Statistiken löschen?')) {
      state = { vocab: [], settings: state.settings };
      save(); renderAll();
    }
  });
  $('#btn-seed').addEventListener('click', () => {
    if (state.vocab.length && !confirm('Beispieldaten zusätzlich laden?')) return;
    const cur = C.currentWeek();
    const prev = C.isoWeek(new Date(Date.now() - 7 * 86400000));
    const seed = [
      { pl: 'czytać', de: 'lesen', pos: 'Verb', week: cur.key, plexpl: 'oglądać tekst i rozumieć słowa', example: 'Czytam książkę po polsku.' },
      { pl: 'lubić', de: 'mögen / gern haben', pos: 'Verb', week: cur.key, plexpl: 'mieć coś bardzo chętnie', example: 'Lubię polską muzykę.' },
      { pl: 'mieszkać', de: 'wohnen', pos: 'Verb', week: cur.key, plexpl: 'żyć w jakimś miejscu', example: 'Mieszkam w Krakowie.' },
      { pl: 'pracować', de: 'arbeiten', pos: 'Verb', week: cur.key, plexpl: 'wykonywać zawód, mieć pracę', example: 'Pracuję w biurze.' },
      { pl: 'rozumieć', de: 'verstehen', pos: 'Verb', week: cur.key, plexpl: 'znać znaczenie słów', example: 'Rozumiem trochę po polsku.' },
      { pl: 'myć się', de: 'sich waschen', pos: 'Verb', week: cur.key, plexpl: 'czyścić ciało wodą i mydłem', example: 'Myję się rano i wieczorem.' },
      { pl: 'nazywać się', de: 'heißen', pos: 'Verb', week: cur.key, plexpl: 'mieć imię i nazwisko', example: 'Jak się nazywasz?' },
      { pl: 'uczyć się', de: 'lernen', pos: 'Verb', week: cur.key, plexpl: 'zdobywać wiedzę', example: 'Uczę się polskiego na uniwersytecie.' },
      { pl: 'wstawać', de: 'aufstehen', pos: 'Verb', week: cur.key, plexpl: 'wychodzić z łóżka rano', example: 'Wstaję o siódmej rano.' },
      { pl: 'jeść', de: 'essen', pos: 'Verb', week: cur.key, plexpl: 'spożywać posiłek', example: 'Jem śniadanie o ósmej.' },
      { pl: 'iść', de: 'gehen', pos: 'Verb', week: cur.key, plexpl: 'poruszać się pieszo', example: 'Idę teraz do domu.' },
      { pl: 'mieć', de: 'haben', pos: 'Verb', week: cur.key, plexpl: 'posiadać coś', example: 'Mam dużo czasu w weekend.' },
      { pl: 'książka', de: 'Buch', pos: 'Substantiv', week: cur.key, plexpl: 'rzecz z tekstem do czytania', example: 'Ta książka jest bardzo ciekawa.' },
      { pl: 'dom', de: 'Haus / Zuhause', pos: 'Substantiv', week: cur.key, plexpl: 'miejsce, w którym mieszkamy', example: 'Mój dom jest nieduży, ale wygodny.' },
      { pl: 'rano', de: 'morgens / am Morgen', pos: 'Adverb', week: cur.key, plexpl: 'wczesna pora dnia', example: 'Rano piję kawę z mlekiem.' },
      { pl: 'jechać', de: 'fahren', pos: 'Verb', week: prev.key, plexpl: 'poruszać się pojazdem', example: 'Jadę autobusem na zajęcia.' },
      { pl: 'kupować', de: 'kaufen', pos: 'Verb', week: prev.key, plexpl: 'płacić za coś w sklepie', example: 'Kupuję chleb i mleko.' },
      { pl: 'rozmawiać', de: 'sich unterhalten / sprechen', pos: 'Verb', week: prev.key, plexpl: 'prowadzić rozmowę z kimś', example: 'Rozmawiam z kolegą przez telefon.' },
      { pl: 'sklep', de: 'Laden / Geschäft', pos: 'Substantiv', week: prev.key, plexpl: 'miejsce, gdzie się kupuje', example: 'Idę do sklepu po zakupy.' },
      { pl: 'rano wczoraj', de: 'gestern Morgen', pos: 'Redewendung', week: prev.key, plexpl: 'rano dnia poprzedniego', example: 'Wczoraj rano byłem w pracy.' }
    ];
    seed.forEach(s => state.vocab.push(Object.assign({ id: uid(), custom: {}, stats: null }, s)));
    save(); renderAll();
  });

  // ---------- Übungs-Setup ----------
  function refreshSetup() {
    const modus = document.querySelector('input[name="modus"]:checked').value;
    const week = modus === 'week' ? $('#setup-week').value : null;
    let pool = state.vocab.slice();
    if (week) pool = pool.filter(v => v.week === week);
    const verbs = pool.filter(v => v.pos === 'Verb').length;
    $('#setup-hint').textContent = pool.length + ' Vokabeln im Pool' + (verbs ? ', davon ' + verbs + ' Verben' : '') + '.';
  }
  $$('input[name="modus"]').forEach(r => r.addEventListener('change', refreshSetup));
  $('#setup-week').addEventListener('change', refreshSetup);

  // ---------- Session ----------
  let session = null;

  function selectedPool() {
    const modus = document.querySelector('input[name="modus"]:checked').value;
    let pool = state.vocab.slice();
    if (modus === 'week') pool = pool.filter(v => v.week === $('#setup-week').value);
    return C.sortByHistory(pool);
  }

  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  $('#start-uebung').addEventListener('click', () => {
    const typ = document.querySelector('input[name="typ"]:checked').value;
    const count = Math.max(3, Math.min(50, parseInt($('#setup-count').value, 10) || 10));
    let pool = selectedPool();
    if (typ === 'koniugacja') pool = pool.filter(v => v.pos === 'Verb');
    if (!pool.length) { alert('Keine passenden Vokabeln in diesem Modus.'); return; }
    const picked = shuffle(pool).slice(0, count);
    const rounds = [];
    const types = typ === 'mieszane' ? ['lucka', 'dopasowanie', 'zdanie', 'koniugacja'] : [typ];
    if (typ === 'dopasowanie') {
      rounds.push({ type: 'dopasowanie', items: picked.slice(0, Math.min(6, picked.length)) });
      picked.slice(Math.min(6, picked.length)).forEach(it => rounds.push({ type: 'lucka', items: [it] }));
    } else {
      picked.forEach((it, i) => {
        let t = types[i % types.length];
        if (t === 'koniugacja' && it.pos !== 'Verb') t = 'lucka';
        rounds.push({ type: t, items: [it] });
      });
    }
    session = { rounds, ri: 0, correct: 0, total: 0 };
    $('#setup-card').classList.add('hidden');
    $('#summary-card').classList.add('hidden');
    $('#session-card').classList.remove('hidden');
    renderRound();
  });

  $('#session-abort').addEventListener('click', endSession);
  $('#summary-again').addEventListener('click', () => {
    $('#summary-card').classList.add('hidden');
    $('#setup-card').classList.remove('hidden');
  });
  $('#summary-back').addEventListener('click', () => {
    $('#summary-card').classList.add('hidden');
    $('#setup-card').classList.remove('hidden');
  });

  function updateStats(item, type, correct) {
    if (!item.stats) item.stats = { attempts: 0, correct: 0, lastPracticed: 0, byType: {} };
    item.stats.attempts++;
    if (correct) item.stats.correct++;
    item.stats.lastPracticed = Date.now();
    item.stats.byType[type] = item.stats.byType[type] || { attempts: 0, correct: 0 };
    item.stats.byType[type].attempts++;
    if (correct) item.stats.byType[type].correct++;
    save();
  }

  function renderRound() {
    if (!session || session.ri >= session.rounds.length) { endSession(); return; }
    const round = session.rounds[session.ri];
    $('#session-progress').textContent = 'Runde ' + (session.ri + 1) + '/' + session.rounds.length;
    $('#session-score').textContent = '✔ ' + session.correct + '/' + session.total;
    const body = $('#session-body');
    body.innerHTML = '';
    if (round.type === 'lucka') renderLucka(round.items[0], body);
    else if (round.type === 'dopasowanie') renderMatch(round.items, body);
    else if (round.type === 'zdanie') renderSentence(round.items[0], body);
    else if (round.type === 'koniugacja') renderConj(round.items[0], body);
  }

  function nextRound() {
    session.ri++;
    renderRound();
  }

  function endSession() {
    if (session) {
      $('#summary-body').innerHTML =
        '<p>Du hast <strong>' + session.correct + ' von ' + session.total + '</strong> richtig beantwortet.</p>' +
        (session.total ? '<p>Quote: <strong>' + Math.round(100 * session.correct / session.total) + '%</strong></p>' : '') +
        '<p class="muted">Die Statistik wurde gespeichert – schau in den Tab „Statistik“.</p>';
      session = null;
    }
    $('#session-card').classList.add('hidden');
    $('#setup-card').classList.add('hidden');
    $('#summary-card').classList.remove('hidden');
    renderVocabList();
    refreshWeekSelects();
  }

  // ---------- Übungstyp 1: Lückentext ----------
  function renderLucka(item, body) {
    $('#session-title').textContent = 'Lückentext';
    const pool = session.rounds.flatMap(r => r.items).filter(x => x.id !== item.id && x.pos === item.pos);
    const distractors = shuffle(pool.length >= 3 ? pool : session.rounds.flatMap(r => r.items).filter(x => x.id !== item.id)).slice(0, 3).map(x => x.pl);
    const options = shuffle([item.pl].concat(distractors.filter(d => d !== item.pl)).slice(0, 4));
    let prompt;
    if (item.example && C.containsWord(item.example, item.pl, false)) {
      const re = new RegExp('(' + item.pl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s+się)?)', 'i');
      prompt = plDe(
        'Uzupełnij lukę: „' + esc(item.example.replace(re, '___')) + '“',
        'Setze das Wort in den Satz ein: „' + esc(item.example.replace(re, '___')) + '“ (' + esc(item.de) + ')'
      );
    } else {
      prompt = plDe(
        'Które słowo po polsku oznacza „' + esc(item.de) + '“?',
        'Welches polnische Wort bedeutet „' + esc(item.de) + '“?'
      );
    }
    body.innerHTML = '<p>' + prompt + '</p><div class="options">' +
      options.map(o => '<button type="button" data-opt="' + esc(o) + '">' + esc(o) + '</button>').join('') + '</div>' +
      '<div class="feedback hidden" id="fb"></div>';
    body.querySelectorAll('.options button').forEach(btn => btn.addEventListener('click', () => {
      const chosen = btn.dataset.opt;
      const right = C.answersMatch(chosen, item.pl, false);
      btn.classList.add(right ? 'correct' : 'wrong');
      body.querySelectorAll('.options button').forEach(b => {
        b.disabled = true;
        if (C.answersMatch(b.dataset.opt, item.pl, false)) b.classList.add('correct');
      });
      session.total++; if (right) session.correct++;
      updateStats(item, 'lucka', right);
      const fb = $('#fb');
      fb.classList.remove('hidden');
      fb.classList.add(right ? 'ok' : 'bad');
      fb.innerHTML = right
        ? '<strong>Dobrze!</strong> „' + esc(item.pl) + '“ = ' + esc(item.de) + '.'
        : 'Prawidłowa odpowiedź: <span class="right-answer">' + esc(item.pl) + '</span> = ' + esc(item.de) +
          (item.example ? '<br>Przykład: „' + esc(item.example) + '“' : '');
      fb.insertAdjacentHTML('beforeend', '<div style="margin-top:.6rem"><button type="button" class="primary" id="next-btn">Dalej ▶</button></div>');
      $('#next-btn').addEventListener('click', nextRound);
      $('#session-score').textContent = '✔ ' + session.correct + '/' + session.total;
    }));
  }

  // ---------- Übungstyp 2: Zuordnen ----------
  function renderMatch(items, body) {
    $('#session-title').textContent = 'Dopasowanie';
    const pairs = items.map(it => ({ id: it.id, pl: it.pl, expl: it.plexpl || it.de, item: it }));
    const left = shuffle(pairs);
    const right = shuffle(pairs);
    body.innerHTML =
      '<p>' + plDe('Połącz każde słowo z jego wyjaśnieniem (kliknij najpierw słowo, potem wyjaśnienie).',
        'Verbinde jedes Wort mit seiner Erklärung (zuerst Wort, dann Erklärung anklicken).') + '</p>' +
      '<div class="match-grid"><div class="match-col" id="m-left">' +
      left.map(p => '<button type="button" data-id="' + p.id + '">' + esc(p.pl) + '</button>').join('') +
      '</div><div class="match-col" id="m-right">' +
      right.map(p => '<button type="button" data-id="' + p.id + '">' + esc(p.expl) + '</button>').join('') +
      '</div></div><div class="feedback hidden" id="fb"></div>';
    let selLeft = null;
    const mistakes = {};
    const leftBtns = {}; const rightBtns = {};
    body.querySelectorAll('#m-left button').forEach(b => { leftBtns[b.dataset.id] = b; });
    body.querySelectorAll('#m-right button').forEach(b => { rightBtns[b.dataset.id] = b; });
    let remaining = pairs.length;
    function finishIfDone() {
      if (remaining > 0) return;
      session.total += pairs.length;
      pairs.forEach(p => { const ok = !mistakes[p.id]; session.correct += ok ? 1 : 0; updateStats(p.item, 'dopasowanie', ok); });
      $('#session-score').textContent = '✔ ' + session.correct + '/' + session.total;
      const fb = $('#fb');
      fb.classList.remove('hidden', 'bad'); fb.classList.add('ok');
      fb.innerHTML = '<strong>Gotowe!</strong> Wszystkie pary połączone.' +
        '<div style="margin-top:.6rem"><button type="button" class="primary" id="next-btn">Dalej ▶</button></div>';
      $('#next-btn').addEventListener('click', nextRound);
    }
    body.querySelector('#m-left').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.classList.contains('matched')) return;
      body.querySelectorAll('#m-left button').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      selLeft = b.dataset.id;
    });
    body.querySelector('#m-right').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.classList.contains('matched') || !selLeft) return;
      if (b.dataset.id === selLeft) {
        b.classList.add('matched'); leftBtns[selLeft].classList.add('matched');
        remaining--;
        selLeft = null;
        finishIfDone();
      } else {
        mistakes[selLeft] = true; mistakes[b.dataset.id] = true;
        b.classList.add('wrongflash');
        setTimeout(() => b.classList.remove('wrongflash'), 500);
      }
    });
  }

  // ---------- Übungstyp 3: Eigenen Satz bilden (mit Korrektur) ----------
  function renderSentence(item, body) {
    $('#session-title').textContent = 'Własne zdanie';
    const isVerb = item.pos === 'Verb';
    let tense = null, person = null, forms = null;
    if (isVerb) {
      const tkeys = ['present', 'past', 'future'];
      tense = tkeys[Math.floor(Math.random() * tkeys.length)];
      person = Math.floor(Math.random() * 6);
      forms = C.formsFor(item, tense, state.settings.gender);
    }
    const tensePl = isVerb ? C.TENSES[tense].pl : '';
    const personPl = isVerb ? C.PERSONS[person] : '';
    body.innerHTML =
      '<p>' + plDe(
        'Napisz jedno zdanie po polsku ze słowem <strong>„' + esc(item.pl) + '“</strong>' +
        (isVerb ? ' w czasie <strong>' + tensePl + '</strong>, <strong>' + personPl + '</strong>' : '') + '.',
        'Schreibe einen polnischen Satz mit <strong>„' + esc(item.pl) + '“</strong> (' + esc(item.de) + ')' +
        (isVerb ? ' im <strong>' + C.TENSES[tense].de + '</strong>, <strong>' + personPl + '</strong>' : '') + '.'
      ) + '</p>' +
      '<textarea id="sentence-input" placeholder="Napisz tutaj po polsku…"></textarea>' +
      '<div style="margin-top:.5rem"><button type="button" class="primary" id="check-sentence">Sprawdź</button></div>' +
      '<div class="feedback hidden" id="fb"></div>';
    let attempts = 0;
    $('#check-sentence').addEventListener('click', () => {
      attempts++;
      const text = $('#sentence-input').value;
      const hasWord = C.containsWord(text, item.pl, state.settings.diacriticsRequired);
      const hasForm = isVerb ? C.containsWord(text, forms[person], state.settings.diacriticsRequired) : true;
      const fb = $('#fb');
      fb.classList.remove('hidden');
      if (hasWord && hasForm) {
        session.total++; session.correct++;
        updateStats(item, 'zdanie', true);
        $('#session-score').textContent = '✔ ' + session.correct + '/' + session.total;
        fb.classList.add('ok'); fb.classList.remove('bad');
        fb.innerHTML = '<strong>Świetnie!</strong> Dobry Satz! 👍' +
          (item.example ? '<br>Porównanie: „' + esc(item.example) + '“' : '') +
          '<div style="margin-top:.6rem"><button type="button" class="primary" id="next-btn">Dalej ▶</button></div>';
        $('#next-btn').addEventListener('click', nextRound);
        return;
      }
      fb.classList.add('bad'); fb.classList.remove('ok');
      let html = '<strong>Jeszcze nie.</strong> ' + plDe('Sprawdź jeszcze raz.', 'Schau noch einmal genau hin.');
      if (!hasWord) html += '<br>' + plDe('Użyj słowa „' + esc(item.pl) + '“.', 'Verwende das Wort „' + esc(item.pl) + '“.');
      if (isVerb && !hasForm) {
        const stem = C.stemForDisplay(item.pl);
        html += '<br>' + plDe(
          'Poprawna forma: <span class="right-answer">' + C.highlightEnding(esc(forms[person]), esc(stem)) + '</span> (' + esc(C.TENSES[tense].de) + ', ' + personPl + ').',
          'Richtige Form: <span class="right-answer">' + C.highlightEnding(esc(forms[person]), esc(stem)) + '</span> (' + C.TENSES[tense].de + ', ' + personPl + ').'
        );
        html += '<br><span class="muted">' + plDe(C.TENSE_EXPLANATIONS[tense].why.pl, C.TENSE_EXPLANATIONS[tense].why.de) + '</span>';
      }
      if (attempts >= 2) {
        session.total++; updateStats(item, 'zdanie', false);
        $('#session-score').textContent = '✔ ' + session.correct + '/' + session.total;
        html += '<div style="margin-top:.6rem"><button type="button" class="primary" id="next-btn">Dalej ▶</button></div>';
        fb.innerHTML = html;
        $('#next-btn').addEventListener('click', nextRound);
      } else {
        fb.innerHTML = html;
      }
    });
  }

  // ---------- Übungstyp 4: Konjugieren ----------
  function renderConj(item, body) {
    $('#session-title').textContent = 'Koniugacja';
    const tkeys = ['present', 'past', 'future'];
    const tense = tkeys[Math.floor(Math.random() * tkeys.length)];
    const person = Math.floor(Math.random() * 6);
    const forms = C.formsFor(item, tense, state.settings.gender);
    const correct = forms[person];
    const stem = C.stemForDisplay(item.pl);
    body.innerHTML =
      '<p>' + plDe(
        'Podaj formę czasownika <strong>„' + esc(item.pl) + '“</strong>: <strong>' + C.TENSES[tense].pl + '</strong>, <strong>' + C.PERSONS[person] + '</strong>' +
        (C.isReflexive(item.pl) ? ' (pamiętaj: <em>się</em> zostaje takie samo!)' : '') + ':',
        'Gib die Form von <strong>„' + esc(item.pl) + '“</strong> an: <strong>' + C.TENSES[tense].de + '</strong>, <strong>' + C.PERSONS[person] + '</strong>' +
        (C.isReflexive(item.pl) ? ' (denk daran: <em>się</em> bleibt gleich!)' : '') + ':'
      ) + '</p>' +
      '<input type="text" id="conj-input" placeholder="np. ' + esc(tense === 'past' ? 'czytałam' : 'czytam') + '">' +
      '<div style="margin-top:.5rem"><button type="button" class="primary" id="check-conj">Sprawdź</button></div>' +
      '<div class="feedback hidden" id="fb"></div>';
    let attempts = 0;
    function showTable() {
      const rows = C.PERSONS.map((p, i) =>
        '<tr' + (i === person ? ' class="asked"' : '') + '><td>' + esc(p) + '</td><td>' + C.highlightEnding(esc(forms[i]), esc(stem)) + '</td></tr>'
      ).join('');
      return '<table class="conj"><tbody>' + rows + '</tbody></table>' +
        '<p class="muted">' + plDe(
          C.TENSE_EXPLANATIONS[tense].pl + '<br><em>Dlaczego?</em> ' + C.TENSE_EXPLANATIONS[tense].why.pl,
          C.TENSE_EXPLANATIONS[tense].de + '<br><em>Warum?</em> ' + C.TENSE_EXPLANATIONS[tense].why.de
        ) + '</p>';
    }
    $('#check-conj').addEventListener('click', () => {
      attempts++;
      const input = $('#conj-input').value;
      const right = C.answersMatch(input, correct, state.settings.diacriticsRequired);
      const fb = $('#fb');
      fb.classList.remove('hidden');
      if (right) {
        session.total++; session.correct++;
        updateStats(item, 'koniugacja', true);
        $('#session-score').textContent = '✔ ' + session.correct + '/' + session.total;
        fb.classList.add('ok'); fb.classList.remove('bad');
        fb.innerHTML = '<strong>Dobrze!</strong> <span class="right-answer">' + esc(correct) + '</span> ✔<br>' + showTable() +
          '<div style="margin-top:.6rem"><button type="button" class="primary" id="next-btn">Dalej ▶</button></div>';
        $('#next-btn').addEventListener('click', nextRound);
      } else {
        fb.classList.add('bad'); fb.classList.remove('ok');
        let html = plDe('Twoja odpowiedź: ', 'Deine Antwort: ') + '<span class="wrong-answer">' + esc(input || '—') + '</span><br>' +
          plDe('Poprawnie: ', 'Richtig: ') + '<span class="right-answer">' + C.highlightEnding(esc(correct), esc(stem)) + '</span>';
        if (attempts >= 2) {
          session.total++; updateStats(item, 'koniugacja', false);
          $('#session-score').textContent = '✔ ' + session.correct + '/' + session.total;
          html += '<br>' + showTable() + '<div style="margin-top:.6rem"><button type="button" class="primary" id="next-btn">Dalej ▶</button></div>';
          fb.innerHTML = html;
          $('#next-btn').addEventListener('click', nextRound);
        } else {
          fb.innerHTML = html + '<br><span class="muted">' + plDe(C.TENSE_EXPLANATIONS[tense].why.pl, C.TENSE_EXPLANATIONS[tense].why.de) + '</span>';
        }
      }
    });
    $('#conj-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#check-conj').click(); });
  }

  // ---------- Init ----------
  function renderAll() {
    refreshWeekSelects();
    renderVocabList();
    renderSettings();
    refreshSetup();
  }
  renderAll();
})();
