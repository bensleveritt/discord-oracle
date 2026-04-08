import { assertAlmostEquals, assertEquals, assertStrictEquals } from "jsr:@std/assert@^1";
import {
  askOracle,
  classify,
  isOddsKey,
  ODDS_THRESHOLDS,
  type OddsKey,
  rollD10,
} from "./oracle.ts";

Deno.test("classify: oracle roll below threshold is yes", () => {
  assertStrictEquals(classify(1, 10, 5).answer, "yes");
  assertStrictEquals(classify(5, 10, 5).answer, "yes");
});

Deno.test("classify: oracle roll above threshold is no", () => {
  assertStrictEquals(classify(6, 10, 5).answer, "no");
  assertStrictEquals(classify(10, 10, 5).answer, "no");
});

Deno.test("classify: chaos 1-2 adds 'and...' qualifier", () => {
  assertStrictEquals(classify(5, 1, 5).qualifier, " and...");
  assertStrictEquals(classify(5, 2, 5).qualifier, " and...");
});

Deno.test("classify: chaos 3-4 adds 'but...' qualifier", () => {
  assertStrictEquals(classify(5, 3, 5).qualifier, " but...");
  assertStrictEquals(classify(5, 4, 5).qualifier, " but...");
});

Deno.test("classify: chaos 5-10 has no qualifier", () => {
  for (let c = 5; c <= 10; c++) {
    assertStrictEquals(
      classify(1, c, 5).qualifier,
      "",
      `chaos ${c} should have no qualifier`,
    );
  }
});

Deno.test("classify: randomEvent when oracle roll equals chaos roll", () => {
  for (let r = 1; r <= 10; r++) {
    assertStrictEquals(classify(r, r, 5).randomEvent, true);
  }
});

Deno.test("classify: no randomEvent when dice differ", () => {
  assertStrictEquals(classify(5, 6, 5).randomEvent, false);
  assertStrictEquals(classify(1, 10, 5).randomEvent, false);
});

Deno.test("classify: impossible threshold always returns no", () => {
  for (let r = 1; r <= 10; r++) {
    assertStrictEquals(classify(r, 10, 0).answer, "no");
  }
});

Deno.test("classify: certain threshold always returns yes", () => {
  for (let r = 1; r <= 10; r++) {
    assertStrictEquals(classify(r, 1, 10).answer, "yes");
  }
});

Deno.test("classify: all six outcome combinations are reachable", () => {
  assertEquals(classify(1, 1, 5), { answer: "yes", qualifier: " and...", randomEvent: true });
  assertEquals(classify(1, 3, 5), { answer: "yes", qualifier: " but...", randomEvent: false });
  assertEquals(classify(1, 5, 5), { answer: "yes", qualifier: "", randomEvent: false });
  assertEquals(classify(10, 1, 5), { answer: "no", qualifier: " and...", randomEvent: false });
  assertEquals(classify(10, 3, 5), { answer: "no", qualifier: " but...", randomEvent: false });
  assertEquals(classify(10, 10, 5), { answer: "no", qualifier: "", randomEvent: true });
});

Deno.test("isOddsKey: valid keys", () => {
  assertStrictEquals(isOddsKey("even"), true);
  assertStrictEquals(isOddsKey("likely"), true);
  assertStrictEquals(isOddsKey("certain"), true);
});

Deno.test("isOddsKey: invalid keys", () => {
  assertStrictEquals(isOddsKey("maybe"), false);
  assertStrictEquals(isOddsKey(""), false);
  assertStrictEquals(isOddsKey(5), false);
  assertStrictEquals(isOddsKey(null), false);
});

Deno.test("rollD10: always in [1,10]", () => {
  for (let i = 0; i < 1000; i++) {
    const r = rollD10();
    if (r < 1 || r > 10) throw new Error(`rollD10 out of range: ${r}`);
  }
});

Deno.test("askOracle: result fields are consistent", () => {
  const r = askOracle("Does it rain?", "likely");
  assertStrictEquals(r.question, "Does it rain?");
  assertStrictEquals(r.odds, "likely");
  assertStrictEquals(r.threshold, 7);
  if (r.oracleRoll < 1 || r.oracleRoll > 10) {
    throw new Error("oracleRoll out of range");
  }
  if (r.chaosRoll < 1 || r.chaosRoll > 10) {
    throw new Error("chaosRoll out of range");
  }
  const expectedAnswer = r.oracleRoll <= 7 ? "yes" : "no";
  assertStrictEquals(r.answer, expectedAnswer);
});

Deno.test("askOracle: statistical distribution matches thresholds", () => {
  const iterations = 50_000;
  const tolerance = 0.02;

  for (const key of Object.keys(ODDS_THRESHOLDS) as OddsKey[]) {
    let yesCount = 0;
    for (let i = 0; i < iterations; i++) {
      if (askOracle("q", key).answer === "yes") yesCount++;
    }
    const actualRate = yesCount / iterations;
    const expectedRate = ODDS_THRESHOLDS[key] / 10;
    assertAlmostEquals(
      actualRate,
      expectedRate,
      tolerance,
      `${key} rate ${actualRate} not within ${tolerance} of ${expectedRate}`,
    );
  }
});
