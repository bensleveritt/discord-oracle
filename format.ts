import { ODDS_LABELS, type OracleResult } from "./oracle.ts";

const ESC = "\u001b";
const RESET = `${ESC}[0m`;
const GRAY = `${ESC}[30m`;
const RED = `${ESC}[31m`;
const GREEN = `${ESC}[32m`;
const YELLOW = `${ESC}[33m`;
const MAGENTA = `${ESC}[35m`;
const BOLD_RED = `${ESC}[1;31m`;
const BOLD_GREEN = `${ESC}[1;32m`;
const BOLD_MAGENTA = `${ESC}[1;35m`;

const HEADER = `${BOLD_MAGENTA}░▒▓ ORACLE.EXE ▓▒░${RESET}`;
const DIVIDER = `  ${GRAY}─────────────────────${RESET}`;

const LABEL_COLUMN_WIDTH = 11;

export type OutcomeTier =
  | "critMax"
  | "high"
  | "midYes"
  | "midNo"
  | "low"
  | "critMin";

export function outcomeTier(
  answer: "yes" | "no",
  qualifier: string,
): OutcomeTier {
  if (answer === "yes") {
    if (qualifier === " and...") return "critMax";
    if (qualifier === " but...") return "midYes";
    return "high";
  }
  if (qualifier === " and...") return "critMin";
  if (qualifier === " but...") return "midNo";
  return "low";
}

function tierColor(tier: OutcomeTier): string {
  switch (tier) {
    case "critMax":
      return BOLD_GREEN;
    case "high":
      return GREEN;
    case "midYes":
      return YELLOW;
    case "midNo":
      return YELLOW;
    case "low":
      return RED;
    case "critMin":
      return BOLD_RED;
  }
}

function wrapAnsi(lines: string[]): string {
  return "```ansi\n" + lines.join("\n") + "\n```";
}

function formatAnswerBox(
  answerText: string,
  tierC: string,
  randomEvent: boolean,
): string[] {
  const inner = ` ${answerText} `;
  const bar = "━".repeat(inner.length);
  const pad = " ".repeat(LABEL_COLUMN_WIDTH);
  const eventSuffix = randomEvent ? `  ${MAGENTA}⟐ RANDOM EVENT${RESET}` : "";
  return [
    `${pad}${tierC}┏${bar}┓${RESET}`,
    `  ${GRAY}ANSWER   ${RESET}${tierC}┃${inner}┃${RESET}${eventSuffix}`,
    `${pad}${tierC}┗${bar}┛${RESET}`,
  ];
}

export function formatOracleResult(userName: string, result: OracleResult): string {
  const tier = outcomeTier(result.answer, result.qualifier);
  const answerC = tierColor(tier);
  const answerText = result.answer + result.qualifier;

  const lines = [
    HEADER,
    `${GREEN}> ${userName} :: ${YELLOW}"${result.question}"${RESET}`,
    "",
    `  ${GRAY}odds     ${RESET}${YELLOW}${
      ODDS_LABELS[result.odds]
    }${RESET}  ${GRAY}(≤${result.threshold})${RESET}`,
    `  ${GRAY}oracle   ${RESET}${GRAY}d10 →  ${RESET}${YELLOW}${result.oracleRoll}${RESET}`,
    `  ${GRAY}chaos    ${RESET}${GRAY}d10 →  ${RESET}${YELLOW}${result.chaosRoll}${RESET}`,
    DIVIDER,
  ];

  lines.push(...formatAnswerBox(answerText, answerC, result.randomEvent));

  return wrapAnsi(lines);
}

export function formatError(userName: string, message: string): string {
  const lines = [
    HEADER,
    `${RED}> ${userName} :: ERROR${RESET}`,
    `  ${RED}${message}${RESET}`,
  ];
  return wrapAnsi(lines);
}
