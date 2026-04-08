import { assertEquals, assertStrictEquals } from "jsr:@std/assert@^1";
import { formatError, formatOracleResult, outcomeTier } from "./format.ts";
import type { OracleResult } from "./oracle.ts";

function fakeResult(overrides: Partial<OracleResult> = {}): OracleResult {
  return {
    question: "Does Mara show?",
    odds: "likely",
    threshold: 7,
    oracleRoll: 8,
    chaosRoll: 3,
    answer: "no",
    qualifier: " but...",
    randomEvent: false,
    ...overrides,
  };
}

Deno.test("outcomeTier: yes + and... is critMax", () => {
  assertStrictEquals(outcomeTier("yes", " and..."), "critMax");
});

Deno.test("outcomeTier: yes (clean) is high", () => {
  assertStrictEquals(outcomeTier("yes", ""), "high");
});

Deno.test("outcomeTier: yes + but... is midYes", () => {
  assertStrictEquals(outcomeTier("yes", " but..."), "midYes");
});

Deno.test("outcomeTier: no + but... is midNo", () => {
  assertStrictEquals(outcomeTier("no", " but..."), "midNo");
});

Deno.test("outcomeTier: no (clean) is low", () => {
  assertStrictEquals(outcomeTier("no", ""), "low");
});

Deno.test("outcomeTier: no + and... is critMin", () => {
  assertStrictEquals(outcomeTier("no", " and..."), "critMin");
});

Deno.test("formatOracleResult: wraps in ansi code block", () => {
  const out = formatOracleResult("Koroviev", fakeResult());
  assertEquals(out.startsWith("```ansi\n"), true);
  assertEquals(out.endsWith("\n```"), true);
});

Deno.test("formatOracleResult: includes user name and question", () => {
  const out = formatOracleResult("Koroviev", fakeResult());
  assertEquals(out.includes("Koroviev"), true);
  assertEquals(out.includes("Does Mara show?"), true);
});

Deno.test("formatOracleResult: includes odds label with threshold", () => {
  const out = formatOracleResult("Koroviev", fakeResult());
  assertEquals(out.includes("likely"), true);
  assertEquals(out.includes("≤7"), true);
});

Deno.test("formatOracleResult: includes both dice rolls", () => {
  const out = formatOracleResult("Koroviev", fakeResult({ oracleRoll: 8, chaosRoll: 3 }));
  assertEquals(out.includes("8"), true);
  assertEquals(out.includes("3"), true);
});

Deno.test("formatOracleResult: includes answer with qualifier concatenated", () => {
  const out = formatOracleResult("Koroviev", fakeResult());
  assertEquals(out.includes("no but..."), true);
});

Deno.test("formatOracleResult: clean yes answer has no qualifier text", () => {
  const out = formatOracleResult(
    "Koroviev",
    fakeResult({ answer: "yes", qualifier: "" }),
  );
  assertEquals(out.includes("yes"), true);
  assertEquals(out.includes("but..."), false);
  assertEquals(out.includes("and..."), false);
});

Deno.test("formatOracleResult: yes + and... renders enhancement", () => {
  const out = formatOracleResult(
    "Koroviev",
    fakeResult({ answer: "yes", qualifier: " and..." }),
  );
  assertEquals(out.includes("yes and..."), true);
});

Deno.test("formatOracleResult: omits RANDOM EVENT when not triggered", () => {
  const out = formatOracleResult("Koroviev", fakeResult({ randomEvent: false }));
  assertEquals(out.includes("RANDOM EVENT"), false);
});

Deno.test("formatOracleResult: includes RANDOM EVENT marker when triggered", () => {
  const out = formatOracleResult("Koroviev", fakeResult({ randomEvent: true }));
  assertEquals(out.includes("RANDOM EVENT"), true);
  assertEquals(out.includes("⟐"), true);
});

Deno.test("formatOracleResult: renders every odds level", () => {
  const odds = [
    "impossible",
    "very_unlikely",
    "unlikely",
    "even",
    "likely",
    "very_likely",
    "certain",
  ] as const;
  for (const o of odds) {
    const out = formatOracleResult("Koroviev", fakeResult({ odds: o }));
    assertEquals(out.startsWith("```ansi\n"), true);
  }
});

Deno.test("formatError: wraps in ansi code block", () => {
  const out = formatError("Koroviev", "Something broke");
  assertEquals(out.startsWith("```ansi\n"), true);
  assertEquals(out.endsWith("\n```"), true);
});

Deno.test("formatError: includes user and message", () => {
  const out = formatError("Koroviev", "Something broke");
  assertEquals(out.includes("Koroviev"), true);
  assertEquals(out.includes("ERROR"), true);
  assertEquals(out.includes("Something broke"), true);
});
