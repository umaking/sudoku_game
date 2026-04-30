import { describe, it, expect } from 'vitest';
import { classicManifest } from './classic';
import { parityManifest } from './parity';
import { sumDiffManifest } from './sumDiff';
import type { TutorialStep, VariantManifest } from './types';

const manifests: VariantManifest[] = [
  classicManifest,
  parityManifest,
  sumDiffManifest,
];

function checkStep(step: TutorialStep) {
  expect(typeof step.title).toBe('string');
  expect(step.title.length).toBeGreaterThan(0);
  expect(typeof step.body).toBe('string');
  expect(step.body.length).toBeGreaterThan(0);

  if (step.miniBoard) {
    const expectedLen = step.miniBoard.size * step.miniBoard.size;
    expect(step.miniBoard.cells.length).toBe(expectedLen);
    if (step.miniBoard.givens) {
      for (const g of step.miniBoard.givens) {
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThan(expectedLen);
      }
    }
    if (step.miniBoard.parityDecorations) {
      for (const p of step.miniBoard.parityDecorations) {
        expect(p.idx).toBeGreaterThanOrEqual(0);
        expect(p.idx).toBeLessThan(expectedLen);
      }
    }
    if (step.miniBoard.edgeDecorations) {
      for (const e of step.miniBoard.edgeDecorations) {
        expect(e.a).toBeGreaterThanOrEqual(0);
        expect(e.a).toBeLessThan(expectedLen);
        expect(e.b).toBeGreaterThanOrEqual(0);
        expect(e.b).toBeLessThan(expectedLen);
      }
    }
  }

  if (step.challenge) {
    expect(step.challenge.correctDigit).toBeGreaterThan(0);
    if (step.miniBoard) {
      const expectedLen = step.miniBoard.size * step.miniBoard.size;
      expect(step.challenge.targetIdx).toBeGreaterThanOrEqual(0);
      expect(step.challenge.targetIdx).toBeLessThan(expectedLen);
    }
  }
}

describe('variants tutorialSteps', () => {
  for (const m of manifests) {
    describe(m.id, () => {
      it('has tutorialSteps with at least one step', () => {
        expect(m.tutorialSteps).toBeDefined();
        expect(Array.isArray(m.tutorialSteps)).toBe(true);
        expect((m.tutorialSteps ?? []).length).toBeGreaterThanOrEqual(1);
      });

      it('every step is well-formed', () => {
        for (const step of m.tutorialSteps ?? []) {
          checkStep(step);
        }
      });
    });
  }

  it('classic has 3+ steps', () => {
    expect((classicManifest.tutorialSteps ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('parity has 3+ steps', () => {
    expect((parityManifest.tutorialSteps ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('sum-diff has 3+ steps', () => {
    expect((sumDiffManifest.tutorialSteps ?? []).length).toBeGreaterThanOrEqual(3);
  });
});
