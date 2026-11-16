/** How long the mailbox flag takes to swing up, in seconds. */
export const FLAG_SECONDS = 0.4;

const BACK = 1.70158;

/**
 * How far up the flag is, `seconds` after a note was sent: 0 lying down, 1 upright.
 * It swings a touch past upright and settles, like a real one flicked up.
 */
export function flagTurn(seconds: number): number {
  if (seconds <= 0) return 0;
  if (seconds >= FLAG_SECONDS) return 1;
  const x = seconds / FLAG_SECONDS - 1;
  return 1 + (BACK + 1) * x * x * x + BACK * x * x;
}
