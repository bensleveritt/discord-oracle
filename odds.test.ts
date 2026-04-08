import { assertAlmostEquals } from "jsr:@std/assert@^1";

const oddsThresholds: Record<string, number> = {
  impossible: 0,
  very_unlikely: 2,
  unlikely: 3,
  even: 5,
  likely: 7,
  very_likely: 8,
  certain: 10,
};

const ITERATIONS = 1_000_000;
const TOLERANCE = 0.03; // 3% tolerance

for (const [oddsName, threshold] of Object.entries(oddsThresholds)) {
  Deno.test(`${oddsName} odds should produce ~${threshold * 10}% yes`, () => {
    let yesCount = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const oracleRoll = Math.floor(Math.random() * 10) + 1;
      if (oracleRoll <= threshold) {
        yesCount++;
      }
    }

    const actualRate = yesCount / ITERATIONS;
    const expectedRate = threshold / 10;

    assertAlmostEquals(actualRate, expectedRate, TOLERANCE);
  });
}
