/*
 * core.js – reine Logik für den Polnisch-Vokabeltrainer.
 * Funktioniert im Browser (window.PLCore) und in Node (module.exports) zum Testen.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PLCore = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  const PERSONS = [
    '1. os. lp (ja)',
    '2. os. lp (ty)',
    '3. os. lp (on/ona/ono)',
    '1. os. lm (my)',
    '2. os. lm (wy)',
    '3. os. lm (oni/one)'
  ];

  const TENSES = {
    present: { pl: 'czas teraźniejszy', de: 'Präsens' },
    past: { pl: 'czas przeszły', de: 'Präteritum' },
    future: { pl: 'czas przyszły', de: 'Futur' }
  };

  // Nieregularne / häufige Zeitverben (ohne „się“). pastM = męski, pastF = żeński.
  const IRREGULAR = {
    'być': {
      present: ['jestem', 'jesteś', 'jest', 'jesteśmy', 'jesteście', 'są'],
      pastM: ['byłem', 'byłeś', 'był', 'byliśmy', 'byliście', 'byli'],
      pastF: ['byłam', 'byłaś', 'była', 'byłyśmy', 'byłyście', 'były'],
      future: null //AUX
    },
    'mieć': {
      present: ['mam', 'masz', 'ma', 'mamy', 'macie', 'mają'],
      pastM: ['miałem', 'miałeś', 'miał', 'mieliśmy', 'mieliście', 'mieli'],
      pastF: ['miałam', 'miałaś', 'miała', 'miałyśmy', 'miałyście', 'miały'],
      future: null
    },
    'chcieć': {
      present: ['chcę', 'chcesz', 'chce', 'chcemy', 'chcecie', 'chcą'],
      pastM: ['chciałem', 'chciałeś', 'chciał', 'chcieliśmy', 'chcieliście', 'chcieli'],
      pastF: ['chciałam', 'chciałaś', 'chciała', 'chciałyśmy', 'chciałyście', 'chciały'],
      future: null
    },
    'móc': {
      present: ['mogę', 'możesz', 'może', 'możemy', 'możecie', 'mogą'],
      pastM: ['mogłem', 'mogłeś', 'mógł', 'mogliśmy', 'mogliście', 'mogli'],
      pastF: ['mogłam', 'mogłaś', 'mogła', 'mogłyśmy', 'mogłyście', 'mogły'],
      future: null
    },
    'musieć': {
      present: ['muszę', 'musisz', 'musi', 'musimy', 'musicie', 'muszą'],
      pastM: ['musiałem', 'musiałeś', 'musiał', 'musieliśmy', 'musieliście', 'musieli'],
      pastF: ['musiałam', 'musiałaś', 'musiała', 'musiałyśmy', 'musiałyście', 'musiały'],
      future: null
    },
    'umieć': {
      present: ['umiem', 'umiesz', 'umie', 'umiemy', 'umiecie', 'umieją'],
      pastM: ['umiałem', 'umiałeś', 'umiał', 'umieliśmy', 'umieliście', 'umieli'],
      pastF: ['umiałam', 'umiałaś', 'umiała', 'umiałyśmy', 'umiałyście', 'umiały'],
      future: null
    },
    'wiedzieć': {
      present: ['wiem', 'wiesz', 'wie', 'wiemy', 'wiecie', 'wiedzą'],
      pastM: ['wiedziałem', 'wiedziałeś', 'wiedział', 'wiedzieliśmy', 'wiedzieliście', 'wiedzieli'],
      pastF: ['wiedziałam', 'wiedziałaś', 'wiedziała', 'wiedziałyśmy', 'wiedziałyście', 'wiedziały'],
      future: null
    },
    'jeść': {
      present: ['jem', 'jesz', 'je', 'jemy', 'jecie', 'jedzą'],
      pastM: ['jadłem', 'jadłeś', 'jadł', 'jedliśmy', 'jedliście', 'jedli'],
      pastF: ['jadłam', 'jadłaś', 'jadła', 'jadłyśmy', 'jadłyście', 'jadły'],
      future: null
    },
    'zjeść': {
      present: ['zjem', 'zjesz', 'zje', 'zjemy', 'zjecie', 'zjedzą'],
      pastM: ['zjadłem', 'zjadłeś', 'zjadł', 'zjedliśmy', 'zjedliście', 'zjedli'],
      pastF: ['zjadłam', 'zjadłaś', 'zjadła', 'zjedłyśmy', 'zjedłyście', 'zjedły'],
      future: ['zjem', 'zjesz', 'zje', 'zjemy', 'zjecie', 'zjedzą']
    },
    'pić': {
      present: ['piję', 'pijesz', 'pije', 'pijemy', 'pijecie', 'piją'],
      pastM: ['piłem', 'piłeś', 'pił', 'piliśmy', 'piliście', 'pili'],
      pastF: ['piłam', 'piłaś', 'piła', 'piłyśmy', 'piłyście', 'piły'],
      future: null
    },
    'wypić': {
      present: ['wypiję', 'wypijesz', 'wypije', 'wypijemy', 'wypijecie', 'wypiją'],
      pastM: ['wypiłem', 'wypiłeś', 'wypił', 'wypiliśmy', 'wypiliście', 'wypili'],
      pastF: ['wypiłam', 'wypiłaś', 'wypiła', 'wypiłyśmy', 'wypiłyście', 'wypiły'],
      future: ['wypiję', 'wypijesz', 'wypije', 'wypijemy', 'wypijecie', 'wypiją']
    },
    'iść': {
      present: ['idę', 'idziesz', 'idzie', 'idziemy', 'idziecie', 'idą'],
      pastM: ['szedłem', 'szedłeś', 'szedł', 'szliśmy', 'szliście', 'szli'],
      pastF: ['szłam', 'szłaś', 'szła', 'szłyśmy', 'szłyście', 'szły'],
      future: null
    },
    'pójść': {
      present: ['pójdę', 'pójdziesz', 'pójdzie', 'pójdziemy', 'pójdziecie', 'pójdą'],
      pastM: ['poszedłem', 'poszedłeś', 'poszedł', 'poszliśmy', 'poszliście', 'poszli'],
      pastF: ['poszłam', 'poszłaś', 'poszła', 'poszłyśmy', 'poszłyście', 'poszły'],
      future: ['pójdę', 'pójdziesz', 'pójdzie', 'pójdziemy', 'pójdziecie', 'pójdą']
    },
    'przyjść': {
      present: ['przyjdę', 'przyjdziesz', 'przyjdzie', 'przyjdziemy', 'przyjdziecie', 'przyjdą'],
      pastM: ['przyszedłem', 'przyszedłeś', 'przyszedł', 'przyszliśmy', 'pryszliście', 'przyszli'],
      pastF: ['przyszłam', 'przyszłaś', 'przyszła', 'przyszłyśmy', 'przyszłyście', 'przyszły'],
      future: ['przyjdę', 'przyjdziesz', 'przyjdzie', 'przyjdziemy', 'przyjdziecie', 'przyjdą']
    },
    'zrobić': {
      present: ['zrobię', 'zrobisz', 'zrobi', 'zrobimy', 'zrobicie', 'zrobią'],
      pastM: ['zrobiłem', 'zrobiłeś', 'zrobił', 'zrobiliśmy', 'zrobiliście', 'zrobili'],
      pastF: ['zrobiłam', 'zrobiłaś', 'zrobiła', 'zrobiłyśmy', 'zrobiłyście', 'zrobiły'],
      future: ['zrobię', 'zrobisz', 'zrobi', 'zrobimy', 'zrobicie', 'zrobią']
    },
    'przeczytać': {
      present: ['przeczytam', 'przeczytasz', 'przeczyta', 'przeczytamy', 'przeczytacie', 'przeczytają'],
      pastM: ['przeczytałem', 'przeczytałeś', 'przeczytał', 'przeczytaliśmy', 'przeczytaliście', 'przeczytali'],
      pastF: ['przeczytałam', 'przeczytałaś', 'przeczytała', 'przeczytałyśmy', 'przeczytałyście', 'przeczytały'],
      future: ['przeczytam', 'przeczytasz', 'przeczyta', 'przeczytamy', 'przeczytacie', 'przeczytają']
    },
    'powiedzieć': {
      present: ['powiem', 'powiesz', 'powie', 'powiemy', 'powiecie', 'powiedzą'],
      pastM: ['powiedziałem', 'powiedziałeś', 'powiedział', 'powiedzieliśmy', 'powiedzieliście', 'powiedzieli'],
      pastF: ['powiedziałam', 'powiedziałaś', 'powiedziała', 'powiedziałyśmy', 'powiedziałyście', 'powiedziały'],
      future: ['powiem', 'powiesz', 'powie', 'powiemy', 'powiecie', 'powiedzą']
    },
    'wziąć': {
      present: ['wezmę', 'weźmiesz', 'weźmie', 'weźmiemy', 'weźmiecie', 'wezmą'],
      pastM: ['wziąłem', 'wziąłeś', 'wziął', 'wzięliśmy', 'wzięliście', 'wzięli'],
      pastF: ['wziąłam', 'wzięłaś', 'wzięła', 'wzięłyśmy', 'wzięłyście', 'wzięły'],
      future: ['wezmę', 'weźmiesz', 'weźmie', 'weźmiemy', 'weźmiecie', 'wezmą']
    },
    'dać': {
      present: ['dam', 'dasz', 'da', 'damy', 'dacie', 'dadzą'],
      pastM: ['dałem', 'dałeś', 'dał', 'daliśmy', 'daliście', 'dali'],
      pastF: ['dałam', 'dałaś', 'dała', 'dałyśmy', 'dałyście', 'dały'],
      future: ['dam', 'dasz', 'da', 'damy', 'dacie', 'dadzą']
    },
    'zostać': {
      present: ['zostanę', 'zostaniesz', 'zostanie', 'zostaniemy', 'zostaniecie', 'zostaną'],
      pastM: ['zostałem', 'zostałeś', 'został', 'zostaliśmy', 'zostaliście', 'zostali'],
      pastF: ['zostałam', 'zostałaś', 'została', 'zostałyśmy', 'zostałyście', 'zostały'],
      future: ['zostanę', 'zostaniesz', 'zostanie', 'zostaniemy', 'zostaniecie', 'zostaną']
    },
    'kupić': {
      present: ['kupię', 'kupisz', 'kupi', 'kupimy', 'kupicie', 'kupią'],
      pastM: ['kupiłem', 'kupiłeś', 'kupił', 'kupiliśmy', 'kupiliście', 'kupili'],
      pastF: ['kupiłam', 'kupiłaś', 'kupiła', 'kupiłyśmy', 'kupiłyście', 'kupiły'],
      future: ['kupię', 'kupisz', 'kupi', 'kupimy', 'kupicie', 'kupią']
    },
    'zacząć': {
      present: ['zacznę', 'zaczniesz', 'zacznie', 'zaczniemy', 'zaczniecie', 'zaczną'],
      pastM: ['zacząłem', 'zacząłeś', 'zaczął', 'zaczęliśmy', 'zaczęliście', 'zaczęli'],
      pastF: ['zaczęłam', 'zaczęłaś', 'zaczęła', 'zaczęłyśmy', 'zaczęłyście', 'zaczęły'],
      future: ['zacznę', 'zaczniesz', 'zacznie', 'zaczniemy', 'zaczniecie', 'zaczną']
    },
    'spać': {
      present: ['śpię', 'śpisz', 'śpi', 'śpimy', 'śpicie', 'śpią'],
      pastM: ['spałem', 'spałeś', 'spał', 'spaliśmy', 'spaliście', 'spali'],
      pastF: ['spałam', 'spałaś', 'spała', 'spałyśmy', 'spałyście', 'spały'],
      future: null
    },
    'jechać': {
      present: ['jadę', 'jedziesz', 'jedzie', 'jedziemy', 'jedziecie', 'jadą'],
      pastM: ['jechałem', 'jechałeś', 'jechał', 'jechaliśmy', 'jechaliście', 'jechali'],
      pastF: ['jechałam', 'jechałaś', 'jechała', 'jechałyśmy', 'jechałyście', 'jechały'],
      future: null
    },
    'biegać': {
      present: ['biegnę', 'biegniesz', 'biegnie', 'biegniemy', 'biegniecie', 'biegną'],
      pastM: ['biegałem', 'biegałeś', 'biegał', 'biegaliśmy', 'biegaliście', 'biegali'],
      pastF: ['biegałam', 'biegałaś', 'biegała', 'biegałyśmy', 'biegałyście', 'biegały'],
      future: null
    },
    'wstawać': {
      present: ['wstaję', 'wstajesz', 'wstaje', 'wstajemy', 'wstajecie', 'wstają'],
      pastM: ['wstawałem', 'wstawałeś', 'wstawał', 'wstawaliśmy', 'wstawaliście', 'wstawali'],
      pastF: ['wstawałam', 'wstawałaś', 'wstawała', 'wstawałyśmy', 'wstawałyście', 'wstawały'],
      future: null
    },
    'dawać': {
      present: ['daję', 'dajesz', 'daje', 'dajemy', 'dajecie', 'dają'],
      pastM: ['dawałem', 'dawałeś', 'dawał', 'dawaliśmy', 'dawaliście', 'dawali'],
      pastF: ['dawałam', 'dawałaś', 'dawała', 'dawałyśmy', 'dawałyście', 'dawały'],
      future: null
    },
    'kłamać': {
      present: ['kłamię', 'kłamiesz', 'kłamie', 'kłamiemy', 'kłamiecie', 'kłamią'],
      pastM: ['kłamałem', 'kłamałeś', 'kłamał', 'kłamaliśmy', 'kłamaliście', 'kłamali'],
      pastF: ['kłamałam', 'kłamałaś', 'kłamała', 'kłamałyśmy', 'kłamałyście', 'kłamały'],
      future: null
    },
    'pisać': {
      present: ['piszę', 'piszesz', 'pisze', 'piszemy', 'piszecie', 'piszą'],
      pastM: ['pisałem', 'pisałeś', 'pisał', 'pisaliśmy', 'pisaliście', 'pisali'],
      pastF: ['pisałam', 'pisałaś', 'pisała', 'pisałyśmy', 'pisałyście', 'pisały'],
      future: null
    },
    'nosić': {
      present: ['noszę', 'nosisz', 'nosi', 'nosimy', 'nosicie', 'noszą'],
      pastM: ['nosiłem', 'nosiłeś', 'nosił', 'nosiliśmy', 'nosiliście', 'nosili'],
      pastF: ['nosiłam', 'nosiłaś', 'nosiła', 'nosiłyśmy', 'nosiłyście', 'nosiły'],
      future: null
    },
    'wozić': {
      present: ['wożę', 'wozisz', 'wozi', 'wozimy', 'wozicie', 'wożą'],
      pastM: ['woziłem', 'woziłeś', 'woził', 'woziliśmy', 'woziliście', 'wozili'],
      pastF: ['woziłam', 'woziłaś', 'woziła', 'woziłyśmy', 'woziłyście', 'woziły'],
      future: null
    }
  };

  const FUTURE_AUX = ['będę', 'będziesz', 'będzie', 'będziemy', 'będziecie', 'będą'];

  function splitReflexive(inf) {
    const m = String(inf || '').trim().match(/^(.*?)\s+się$/i);
    return m ? { core: m[1].trim(), refl: true } : { core: String(inf || '').trim(), refl: false };
  }

  function addSie(form, refl, tense) {
    if (!refl) return form;
    if (tense === 'future' && form.indexOf(' ') > -1) {
      const i = form.indexOf(' ');
      return form.slice(0, i) + ' się' + form.slice(i);
    }
    return form + ' się';
  }

  function isReflexive(inf) { return splitReflexive(inf).refl; }

  function stemOf(core) { return core.replace(/(ść|ć)$/, ''); }

  // II koniugacja (-ę/-isz…) je nach Stammende
  // (Palatalisierungen wie wozić → wożę laufen über IRREGULAR)
  function iiForms(s) {
    if (/y$/.test(s)) return [s + 'ję', s + 'jesz', s + 'je', s + 'jemy', s + 'jecie', s + 'ją'];
    if (/[aąeęiouó]$/.test(s)) return [s + 'ę', s + 'sz', s, s + 'my', s + 'cie', s + 'ą'];
    if (/(cz|sz|ż|rz|ś|ź|dź)$/.test(s)) return [s + 'ę', s + 'ysz', s + 'y', s + 'ymy', s + 'ycie', s + 'ą'];
    return [s + 'ę', s + 'esz', s + 'e', s + 'emy', s + 'ecie', s + 'ą'];
  }

  function conjPresent(core) {
    if (IRREGULAR[core]) return IRREGULAR[core].present.slice();
    if (/ować$/.test(core)) return iiForms(core.replace(/ować$/, 'uj'));
    if (/(ać|ąć)$/.test(core)) {
      const s = core.replace(/(ać|ąć)$/, '');
      const last2 = s.slice(-2), last1 = s.slice(-1);
      const second = ['rz', 'dz', 'sz', 'ś', 'ź', 'ż'].includes(last2) || ['c', 's', 'z', 'g'].includes(last1);
      if (second) return iiForms(s);
      return [s + 'am', s + 'asz', s + 'a', s + 'amy', s + 'acie', s + 'ają'];
    }
    if (/eć$/.test(core)) {
      const s = core.replace(/eć$/, '');
      return [s + 'm', s + 'sz', s, s + 'my', s + 'cie', s + 'ją'];
    }
    // -ić / -yć / -ć (II koniugacja)
    return iiForms(core.replace(/ć$/, ''));
  }

  function conjPast(core, gender) {
    if (IRREGULAR[core]) return (gender === 'f' ? IRREGULAR[core].pastF : IRREGULAR[core].pastM).slice();
    const s = stemOf(core);
    const end = gender === 'f'
      ? ['łam', 'łaś', 'ła', 'łyśmy', 'łyście', 'ły']
      : ['łem', 'łeś', 'ł', 'liśmy', 'liście', 'li'];
    return end.map(e => s + e);
  }

  function conjFuture(core) {
    if (IRREGULAR[core] && IRREGULAR[core].future) return IRREGULAR[core].future.slice();
    return FUTURE_AUX.map(a => a + ' ' + core);
  }

  // Vollständige Konjugation eines Infinitivs (ggf. mit „się“).
  function conjugate(inf, gender) {
    const g = gender === 'f' ? 'f' : 'm';
    const { core, refl } = splitReflexive(inf);
    return {
      core,
      refl,
      present: conjPresent(core).map(f => addSie(f, refl, 'present')),
      past: conjPast(core, g).map(f => addSie(f, refl, 'past')),
      future: conjFuture(core).map(f => addSie(f, refl, 'future'))
    };
  }

  // Formen für einen Vokabel-Eintrag (eigene Formen haben Vorrang).
  function formsFor(entry, tense, gender) {
    if (entry.custom && Array.isArray(entry.custom[tense]) && entry.custom[tense].length === 6) {
      return entry.custom[tense].slice();
    }
    return conjugate(entry.pl, gender)[tense];
  }

  function stemForDisplay(inf) {
    const { core } = splitReflexive(inf);
    return stemOf(core);
  }

  // ---- Vergleich (Groß-/Kleinschreibung egal, Diakritika optional) ----
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().trim().replace(/\s+/g, ' ');
  }
  const DIACRITICS = { 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z' };
  function stripDiacritics(s) {
    return s.replace(/[ąćęłńóśźż]/g, c => DIACRITICS[c] || c);
  }
  function answersMatch(input, correct, diacriticsRequired) {
    const a = norm(input), b = norm(correct);
    if (a === b) return true;
    if (!diacriticsRequired && stripDiacritics(a) === stripDiacritics(b)) return true;
    return false;
  }
  function containsWord(text, word, diacriticsRequired) {
    const t = norm(text), w = norm(word);
    if (t.includes(w)) return true;
    if (!diacriticsRequired) return stripDiacritics(t).includes(stripDiacritics(w));
    return false;
  }

  // ---- Kalenderwoche (ISO, Montag als Wochenanfang) ----
  function isoWeek(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    const y = date.getUTCFullYear();
    return { key: y + '-KW' + String(weekNo).padStart(2, '0'), label: 'KW ' + weekNo + '/' + y, weekNo, year: y };
  }
  function currentWeek() { return isoWeek(new Date()); }

  // ---- Sortierung nach Übungshistorie ----
  function practiceRatio(v) {
    const s = v.stats || { attempts: 0, correct: 0 };
    if (!s.attempts) return -1; // noch nie geübt → ganz vorne
    return s.correct / s.attempts;
  }
  function sortByHistory(list) {
    return list.slice().sort((a, b) => {
      const ra = practiceRatio(a), rb = practiceRatio(b);
      if (ra !== rb) return ra - rb;
      const la = (a.stats && a.stats.lastPracticed) || 0;
      const lb = (b.stats && b.stats.lastPracticed) || 0;
      return la - lb;
    });
  }

  // ---- Endungs-Erklärungen (polnisch + deutsch auf Abruf) ----
  const TENSE_EXPLANATIONS = {
    present: {
      pl: 'Czas teraźniejszy: końcówki 1. os. lp -ę/-am (ja), 2. os. lp -isz/-esz/-asz (ty), 3. os. lp -i/-a (on/ona/ono), 1. os. lm -my (my), 2. os. lm -cie (wy), 3. os. lm -ą/-ają (oni/one). Czasowniki na -ać (I koniugacja) mają -am, -asz, -a…, a na -ić/-yć (II koniugacja) -ę, -isz, -i….',
      de: 'Präsens: Endungen 1. Sg -ę/-am (ich), 2. Sg -isz/-esz/-asz (du), 3. Sg -i/-a (er/sie/es), 1. Pl -my (wir), 2. Pl -cie (ihr), 3. Pl -ą/-ają (sie). Verben auf -ać (I. Konjugation) bilden -am, -asz, -a…, Verben auf -ić/-yć (II. Konjugation) -ę, -isz, -i….',
      why: {
        pl: 'Końcówka zależy od koniugacji: -ać → temat + -am (czytać → czytam), -ić/-yć → temat + -ę (robić → robię).',
        de: 'Die Endung hängt von der Konjugation ab: -ać → Stamm + -am (czytać → czytam), -ić/-yć → Stamm + -ę (robić → robię).'
      }
    },
    past: {
      pl: 'Czas przeszły: temat czasownika + końcówki osobowe. Dla rodzaju żeńskiego (ja jako kobieta): -łam, -łaś, -ła, -łyśmy, -łyście, -ły. Dla rodzaju męskiego: -łem, -łeś, -ł, -liśmy, -liście, -li.',
      de: 'Präteritum: Verbstamm + Personalendungen. Feminin (ich als Frau): -łam, -łaś, -ła, -łyśmy, -łyście, -ły. Maskulin: -łem, -łeś, -ł, -liśmy, -liście, -li.',
      why: {
        pl: 'W czasie przeszłym końcówka zależy od rodzaju gramatycznego podmiotu: kobieta → -łam (zrobiłam), mężczyzna → -łem (zrobiłem).',
        de: 'Im Präteritum richtet sich die Endung nach dem grammatischen Geschlecht des Subjekts: Frau → -łam (zrobiłam), Mann → -łem (zrobiłem).'
      }
    },
    future: {
      pl: 'Czas przyszły: czasownik posiłkowy „być“ w czasie teraźniejszym (będę, będziesz, będzie, będziemy, będziecie, będą) + bezokolicznik – dla czasowników niedokonanych (czytać → będę czytać). Czasowniki dokonane mają często formę syntetyczną (zrobić → zrobię).',
      de: 'Futur: Hilfsverb „być“ im Präsens (będę, będziesz, będzie, będziemy, będziecie, będą) + Infinitiv – bei imperfektiven Verben (czytać → będę czytać). Perfektive Verben haben oft eine synthetische Form (zrobić → zrobię).',
      why: {
        pl: '„Będę + bezokolicznik“ tworzy czas przyszły dla czasowników niedokonanych (robienie trwa). Czasowniki dokonane (zrobienie = jednorazowa czynność) mają własne formy przyszłe.',
        de: '„będę + Infinitiv“ bildet das Futur bei imperfektiven Verben (Tätigkeit dauert an). Perfektive Verben (einmalige Handlung) haben eigene Futurformen.'
      }
    }
  };

  // Hebt die Endung farbig hervor: form = stem + <mark>rest</mark>
  function highlightEnding(form, stem) {
    if (stem && form.indexOf(stem) === 0 && form.length > stem.length) {
      return escapeHtmlLocal(stem) + '<mark class="ending">' + escapeHtmlLocal(form.slice(stem.length)) + '</mark>';
    }
    return '<mark class="ending">' + escapeHtmlLocal(form) + '</mark>';
  }
  function escapeHtmlLocal(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    PERSONS,
    TENSES,
    IRREGULAR,
    splitReflexive,
    isReflexive,
    conjugate,
    formsFor,
    stemOf,
    stemForDisplay,
    norm,
    stripDiacritics,
    answersMatch,
    containsWord,
    isoWeek,
    currentWeek,
    practiceRatio,
    sortByHistory,
    TENSE_EXPLANATIONS,
    highlightEnding
  };
});
