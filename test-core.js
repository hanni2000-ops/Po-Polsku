'use strict';
const C = require('./core.js');

let passed = 0, failed = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { passed++; }
  else { failed++; console.error('FAIL:', label, '\n  erwartet:', e, '\n  ist:     ', a); }
}
function ok(cond, label) { eq(!!cond, true, label); }

// --- Präsens ---
eq(C.conjugate('czytać').present, ['czytam', 'czytasz', 'czyta', 'czytamy', 'czytacie', 'czytają'], 'czytać Präsens');
eq(C.conjugate('robić').present, ['robię', 'robisz', 'robi', 'robimy', 'robicie', 'robią'], 'robić Präsens');
eq(C.conjugate('lubić').present, ['lubię', 'lubisz', 'lubi', 'lubimy', 'lubicie', 'lubią'], 'lubić Präsens');
eq(C.conjugate('mieszkać').present, ['mieszkam', 'mieszkasz', 'mieszka', 'mieszkamy', 'mieszkacie', 'mieszkają'], 'mieszkać Präsens');
eq(C.conjugate('pisać').present, ['piszę', 'piszesz', 'pisze', 'piszemy', 'piszecie', 'piszą'], 'pisać Präsens (II)');
eq(C.conjugate('pracować').present, ['pracuję', 'pracujesz', 'pracuje', 'pracujemy', 'pracujecie', 'pracują'], 'pracować Präsens');
eq(C.conjugate('umieć').present, ['umiem', 'umiesz', 'umie', 'umiemy', 'umiecie', 'umieją'], 'umieć Präsens');
eq(C.conjugate('myć').present, ['myję', 'myjesz', 'myje', 'myjemy', 'myjecie', 'myją'], 'myć Präsens');
eq(C.conjugate('kochać').present, ['kocham', 'kochasz', 'kocha', 'kochamy', 'kochacie', 'kochają'], 'kochać Präsens (I)');
eq(C.conjugate('pytać').present, ['pytam', 'pytasz', 'pyta', 'pytamy', 'pytacie', 'pytają'], 'pytać Präsens (I)');
eq(C.conjugate('być').present, ['jestem', 'jesteś', 'jest', 'jesteśmy', 'jesteście', 'są'], 'być Präsens');
eq(C.conjugate('mieć').present, ['mam', 'masz', 'ma', 'mamy', 'macie', 'mają'], 'mieć Präsens');
eq(C.conjugate('wstawać').present, ['wstaję', 'wstajesz', 'wstaje', 'wstajemy', 'wstajecie', 'wstają'], 'wstawać Präsens');

// --- Präteritum, beide Geschlechter ---
eq(C.conjugate('czytać', 'm').past, ['czytałem', 'czytałeś', 'czytał', 'czytaliśmy', 'czytaliście', 'czytali'], 'czytać Präteritum m');
eq(C.conjugate('czytać', 'f').past, ['czytałam', 'czytałaś', 'czytała', 'czytałyśmy', 'czytałyście', 'czytały'], 'czytać Präteritum f');
eq(C.conjugate('zrobić', 'f').past, ['zrobiłam', 'zrobiłaś', 'zrobiła', 'zrobiłyśmy', 'zrobiłyście', 'zrobiły'], 'zrobić Präteritum f');
eq(C.conjugate('robić', 'f').past, ['robiłam', 'robiłaś', 'robiła', 'robiłyśmy', 'robiłyście', 'robiły'], 'robić Präteritum f');
eq(C.conjugate('iść', 'f').past, ['szłam', 'szłaś', 'szła', 'szłyśmy', 'szłyście', 'szły'], 'iść Präteritum f');

// --- Futur ---
eq(C.conjugate('czytać').future, ['będę czytać', 'będziesz czytać', 'będzie czytać', 'będziemy czytać', 'będziecie czytać', 'będą czytać'], 'czytać Futur (aux)');
eq(C.conjugate('zrobić').future, ['zrobię', 'zrobisz', 'zrobi', 'zrobimy', 'zrobicie', 'zrobią'], 'zrobić Futur (synthetisch)');
eq(C.conjugate('przyjść').future, ['przyjdę', 'przyjdziesz', 'przyjdzie', 'przyjdziemy', 'przyjdziecie', 'przyjdą'], 'przyjść Futur');

// --- Reflexive Verben: „się“ bleibt gleich ---
eq(C.conjugate('myć się').present, ['myję się', 'myjesz się', 'myje się', 'myjemy się', 'myjecie się', 'myją się'], 'myć się Präsens');
eq(C.conjugate('myć się', 'f').past, ['myłam się', 'myłaś się', 'myła się', 'myłyśmy się', 'myłyście się', 'myły się'], 'myć się Präteritum f');
eq(C.conjugate('myć się').future, ['będę się myć', 'będziesz się myć', 'będzie się myć', 'będziemy się myć', 'będziecie się myć', 'będą się myć'], 'myć się Futur');
eq(C.conjugate('nazywać się').present, ['nazywam się', 'nazywasz się', 'nazywa się', 'nazywamy się', 'nazywacie się', 'nazywają się'], 'nazywać się Präsens');
ok(C.isReflexive('uczyć się') && !C.isReflexive('czytać'), 'isReflexive');

// --- Vergleich: Groß-/Kleinschreibung egal ---
ok(C.answersMatch('Czytam', 'czytam'), 'Grossschreibung egal');
ok(C.answersMatch('  ZROBIŁAM ', 'zrobiłam'), 'Whitespace + Gross egal');
ok(C.answersMatch('zrobilam', 'zrobiłam', false), 'ohne Diakritika akzeptiert (optional)');
ok(!C.answersMatch('zrobilam', 'zrobiłam', true), 'mit Diakritika-Pflicht abgelehnt');
ok(!C.answersMatch('zrobiłem', 'zrobiłam'), 'falsche Endung nicht akzeptiert');
ok(C.containsWord('Wieczorem myję się.', 'myję się', false), 'containsWord mit się');

// --- Wochen ---
const w = C.isoWeek(new Date(2025, 10, 9)); // 9.11.2025 = Sonntag KW45
eq([w.year, w.weekNo], [2025, 45], 'ISO KW 9.11.2025');
const w2 = C.isoWeek(new Date(2025, 0, 1)); // 1.1.2025 = Mittwoch KW1
eq([w2.year, w2.weekNo], [2025, 1], 'ISO KW 1.1.2025');
ok(C.currentWeek().key.includes('KW'), 'currentWeek key');

// --- Sortierung nach Übungshistorie ---
const list = [
  { pl: 'a', stats: { attempts: 4, correct: 4, lastPracticed: 5 } },
  { pl: 'b', stats: { attempts: 0, correct: 0, lastPracticed: 0 } },
  { pl: 'c', stats: { attempts: 4, correct: 1, lastPracticed: 9 } },
  { pl: 'd', stats: { attempts: 2, correct: 2, lastPracticed: 1 } }
];
eq(C.sortByHistory(list).map(x => x.pl), ['b', 'c', 'd', 'a'], 'sortByHistory: niećwiczone zuerst, dann schlechteste Quote, dann älteste Übung');

// --- Eigene Formen haben Vorrang ---
const entry = { pl: 'testować', custom: { present: ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'] } };
eq(C.formsFor(entry, 'present', 'f'), ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'], 'custom present override');
eq(C.formsFor(entry, 'past', 'f')[0], 'testowałam', 'custom fallback auf Regeln (f)');

// --- Endung hervorheben ---
eq(C.highlightEnding('czytałam', 'czyt'), 'czyt<mark class="ending">ałam</mark>', 'highlightEnding');

console.log(`\n${passed} bestanden, ${failed} fehlgeschlagen`);
process.exit(failed ? 1 : 0);
