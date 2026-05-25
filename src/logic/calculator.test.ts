import {
  calculateGame,
  createEmptyColumns,
  detectMultiplierForRound,
  getMaxRound,
  makeBottomEntry,
  makeTopEntry,
  roundHasAnyData,
} from './calculator';
import { Column } from '../types/game';

const expect = (actual: unknown) => ({
  toEqual: (expected: unknown) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  },
});

const t = (v: number, r: number) => makeTopEntry(v, r);
const b = (v: number, r: number) => makeBottomEntry(v, r);

const tests: Array<[string, () => void]> = [
  [
    'klasik: empty column → 0',
    () => {
      const r = calculateGame([{ top: [], bottom: [] }]);
      expect(r.columns[0]).toEqual({ topSum: 0, bottomSum: 0, net: 0 });
    },
  ],
  [
    'klasik: top=[3], bottom=[] → -30',
    () => {
      const r = calculateGame([{ top: [t(3, 1)], bottom: [] }]);
      expect(r.columns[0].net).toEqual(-30);
    },
  ],
  [
    'klasik: top=[2,3], bottom=[40] → -10',
    () => {
      const r = calculateGame([{ top: [t(2, 1), t(3, 1)], bottom: [b(40, 1)] }]);
      expect(r.columns[0].net).toEqual(-10);
    },
  ],
  [
    'renkli single-round: round 1 mult=5, S1 alt=25 → 125, S4 top=5 → -50',
    () => {
      const columns: Column[] = [
        { top: [], bottom: [b(25, 1)] },
        { top: [], bottom: [] },
        { top: [], bottom: [] },
        { top: [t(5, 1)], bottom: [] },
      ];
      const r = calculateGame(columns, 'renkli-klasik', null, 1);
      expect(r.multiplier).toEqual(5);
      expect(r.columns[0].net).toEqual(125);
      expect(r.columns[3].net).toEqual(-50);
    },
  ],
  [
    'renkli multi-round: round 1 mult=6, round 2 mult=4 — past entries multiplied by their round mult',
    () => {
      const columns: Column[] = [
        { top: [t(6, 1)], bottom: [] },
        { top: [], bottom: [b(10, 1), b(10, 2)] },
        { top: [t(4, 2)], bottom: [] },
        { top: [], bottom: [] },
      ];
      const r = calculateGame(columns, 'renkli-klasik', null, 2);
      // S2: 10×6 + 10×4 = 100
      expect(r.columns[1].net).toEqual(100);
      // active multiplier should be round 2's = 4
      expect(r.multiplier).toEqual(4);
    },
  ],
  [
    'edit past round: viewing round 1 sees round 1 mult, but round 2 entries still multiplied with their own mult',
    () => {
      const columns: Column[] = [
        { top: [t(6, 1)], bottom: [] },
        { top: [], bottom: [b(10, 1), b(10, 2)] },
        { top: [t(4, 2)], bottom: [] },
        { top: [], bottom: [] },
      ];
      const r = calculateGame(columns, 'renkli-klasik', null, 1);
      // Viewing round 1: active multiplier display = round 1's = 6
      expect(r.multiplier).toEqual(6);
      // Math should still be correct: 10×6 + 10×4 = 100
      expect(r.columns[1].net).toEqual(100);
    },
  ],
  [
    'detectMultiplierForRound: ignores other rounds',
    () => {
      const cols: Column[] = [
        { top: [t(6, 1), t(4, 2)], bottom: [] },
      ];
      expect(detectMultiplierForRound(cols, 1)).toEqual(6);
      expect(detectMultiplierForRound(cols, 2)).toEqual(4);
    },
  ],
  [
    'getMaxRound: scans all rounds',
    () => {
      const cols: Column[] = [
        { top: [t(5, 1)], bottom: [b(10, 3)] },
        { top: [t(4, 2)], bottom: [] },
      ];
      expect(getMaxRound(cols)).toEqual(3);
    },
  ],
  [
    'roundHasAnyData: empty round',
    () => {
      const cols: Column[] = [
        { top: [t(5, 1)], bottom: [] },
      ];
      expect(roundHasAnyData(cols, 1)).toEqual(true);
      expect(roundHasAnyData(cols, 2)).toEqual(false);
    },
  ],
  [
    'createEmptyColumns(4)',
    () => {
      const cols = createEmptyColumns(4);
      expect(cols.length).toEqual(4);
      expect(cols[0]).toEqual({ top: [], bottom: [] });
    },
  ],
  [
    'ozel bitis: kazanan ust=5 → -500, kaybeden alt=10 → 10×10=100',
    () => {
      const columns: Column[] = [
        { top: [t(5, 1)], bottom: [] }, // winner with Siyah(5)
        { top: [], bottom: [b(10, 1)] }, // loser with 10
        { top: [], bottom: [] },
        { top: [], bottom: [] },
      ];
      const r = calculateGame(
        columns,
        'renkli-klasik',
        null,
        1,
        {}, // roundMultipliers
        { 1: true } // specialFinishes
      );
      // Winner: 5 × -100 = -500
      expect(r.columns[0].net).toEqual(-500);
      // Loser: 10 × (5 × 2) = 100
      expect(r.columns[1].net).toEqual(100);
    },
  ],
  [
    'ceza: sadece ceza varsa color × 100',
    () => {
      const columns: Column[] = [
        { top: [t(5, 1)], bottom: [] }, // winner Siyah(5)
        { top: [], bottom: [{ value: 0, round: 1, marker: 'penalty' }] }, // ceza
        { top: [], bottom: [] },
        { top: [], bottom: [] },
      ];
      const r = calculateGame(columns, 'renkli-klasik', null, 1, {}, {});
      // Ceza: 5 × 100 = 500
      expect(r.columns[1].net).toEqual(500);
    },
  ],
  [
    'ceza + alt değer: 500 + 10×5 = 550',
    () => {
      const columns: Column[] = [
        { top: [t(5, 1)], bottom: [] },
        {
          top: [],
          bottom: [
            { value: 0, round: 1, marker: 'penalty' },
            b(10, 1),
          ],
        },
        { top: [], bottom: [] },
        { top: [], bottom: [] },
      ];
      const r = calculateGame(columns, 'renkli-klasik', null, 1, {}, {});
      // Ceza: 500 + bottom: 10×5 = 50 → 550
      expect(r.columns[1].net).toEqual(550);
    },
  ],
  [
    'ozel bitis vs normal: kontrol',
    () => {
      const columns: Column[] = [
        { top: [t(5, 1)], bottom: [] },
        { top: [], bottom: [b(10, 1)] },
        { top: [], bottom: [] },
        { top: [], bottom: [] },
      ];
      const rNormal = calculateGame(columns, 'renkli-klasik', null, 1, {}, {});
      const rSpecial = calculateGame(
        columns,
        'renkli-klasik',
        null,
        1,
        {},
        { 1: true }
      );
      // Normal: winner -50, loser 50
      expect(rNormal.columns[0].net).toEqual(-50);
      expect(rNormal.columns[1].net).toEqual(50);
      // Special: winner -500, loser 100
      expect(rSpecial.columns[0].net).toEqual(-500);
      expect(rSpecial.columns[1].net).toEqual(100);
    },
  ],
];

let passed = 0;
let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(`  ${(e as Error).message}`);
    failed++;
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
