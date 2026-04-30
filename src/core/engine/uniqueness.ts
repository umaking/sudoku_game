import type { Board, Constraint } from '../types';
import { solve } from './solver';

export function hasUniqueSolution(
  board: Board,
  options?: { timeoutMs?: number; constraints?: Constraint[] },
): boolean {
  const result = solve(board, {
    maxSolutions: 2,
    ...(options?.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
    ...(options?.constraints !== undefined ? { constraints: options.constraints } : {}),
  });
  if (result.timedOut) return false;
  return result.solutions.length === 1;
}

export function countSolutions(
  board: Board,
  options?: { max?: number; timeoutMs?: number; constraints?: Constraint[] },
): number {
  const max = options?.max ?? 2;
  const result = solve(board, {
    maxSolutions: max,
    ...(options?.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
    ...(options?.constraints !== undefined ? { constraints: options.constraints } : {}),
  });
  return result.solutions.length;
}
