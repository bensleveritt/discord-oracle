export type OddsKey =
  | "impossible"
  | "very_unlikely"
  | "unlikely"
  | "even"
  | "likely"
  | "very_likely"
  | "certain";

export const ODDS_KEYS: readonly OddsKey[] = [
  "impossible",
  "very_unlikely",
  "unlikely",
  "even",
  "likely",
  "very_likely",
  "certain",
] as const;

export const ODDS_THRESHOLDS: Record<OddsKey, number> = {
  impossible: 0,
  very_unlikely: 2,
  unlikely: 3,
  even: 5,
  likely: 7,
  very_likely: 8,
  certain: 10,
};

export const ODDS_LABELS: Record<OddsKey, string> = {
  impossible: "impossible",
  very_unlikely: "very unlikely",
  unlikely: "unlikely",
  even: "even",
  likely: "likely",
  very_likely: "very likely",
  certain: "certain",
};

export type Answer = "yes" | "no";
export type Qualifier = "" | " and..." | " but...";

export interface OracleResult {
  question: string;
  odds: OddsKey;
  threshold: number;
  oracleRoll: number;
  chaosRoll: number;
  answer: Answer;
  qualifier: Qualifier;
  randomEvent: boolean;
}

export interface OracleClassification {
  answer: Answer;
  qualifier: Qualifier;
  randomEvent: boolean;
}

const UINT32_MAX_PLUS_ONE = 0x100000000;

function secureRandomInt(sides: number): number {
  const buffer = new ArrayBuffer(4);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const limit = Math.floor(UINT32_MAX_PLUS_ONE / sides) * sides;
  for (;;) {
    crypto.getRandomValues(bytes);
    const value = view.getUint32(0, false);
    if (value < limit) {
      return (value % sides) + 1;
    }
  }
}

export function rollD10(): number {
  return secureRandomInt(10);
}

export function classify(
  oracleRoll: number,
  chaosRoll: number,
  threshold: number,
): OracleClassification {
  const answer: Answer = oracleRoll <= threshold ? "yes" : "no";

  let qualifier: Qualifier = "";
  if (chaosRoll >= 1 && chaosRoll <= 2) {
    qualifier = " and...";
  } else if (chaosRoll >= 3 && chaosRoll <= 4) {
    qualifier = " but...";
  }

  const randomEvent = oracleRoll === chaosRoll;

  return { answer, qualifier, randomEvent };
}

export function askOracle(question: string, odds: OddsKey): OracleResult {
  const threshold = ODDS_THRESHOLDS[odds];
  const oracleRoll = rollD10();
  const chaosRoll = rollD10();
  const { answer, qualifier, randomEvent } = classify(oracleRoll, chaosRoll, threshold);

  return {
    question,
    odds,
    threshold,
    oracleRoll,
    chaosRoll,
    answer,
    qualifier,
    randomEvent,
  };
}

export function isOddsKey(value: unknown): value is OddsKey {
  return typeof value === "string" && (ODDS_KEYS as readonly string[]).includes(value);
}
