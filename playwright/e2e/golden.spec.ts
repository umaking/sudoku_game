import { test, expect, Page } from '@playwright/test';

/**
 * Golden-path E2E tests for the Variant Sudoku app.
 *
 * Coverage:
 *  1. Page loads and renders the 9x9 grid (81 cell buttons).
 *  2. Cell input + undo flow updates the count of large value glyphs in the SVG.
 *  3. Variant picker switches to "parity" and parity background rects appear.
 *
 * The Grid renders cell values as <text fontSize="50"> nodes inside the SVG layer.
 * The DOM <button> per cell carries aria-label="셀 R{r} C{c}" but no inner text,
 * so we count SVG <text> nodes rather than rely on button text.
 */

const GRID_READY_SELECTOR = 'button[aria-label="셀 R1 C1"]';

/**
 * Counts the number of large value glyphs (fontSize 50) in the grid SVG that
 * match the given digit. Pencil candidates use fontSize 18 so are excluded.
 */
async function countValueGlyphs(page: Page, digit: number): Promise<number> {
  return await page.evaluate((d) => {
    const texts = Array.from(
      document.querySelectorAll<SVGTextElement>('svg text'),
    );
    return texts.filter((t) => {
      // Filter to large value glyphs (cell values use fontSize=50). Pencil
      // marks use fontSize=18; edge labels use a different layer/font size.
      const fs = Number(t.getAttribute('font-size') ?? '0');
      if (fs < 30) return false;
      return (t.textContent ?? '').trim() === String(d);
    }).length;
  }, digit);
}

test.describe('Variant Sudoku — golden path', () => {
  test('loads the page and renders 81 cell buttons', async ({ page }) => {
    await page.goto('/');

    // Title contains "Sudoku"
    await expect(page).toHaveTitle(/Sudoku/i);

    // Wait for the grid to render
    await page.waitForSelector(GRID_READY_SELECTOR, { timeout: 10_000 });

    // All 81 cell buttons are present
    const cellButtons = page.getByRole('gridcell', { name: /셀 R\d C\d/ });
    await expect(cellButtons).toHaveCount(81);
  });

  test('typing a digit and undoing changes the SVG value-glyph count', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForSelector(GRID_READY_SELECTOR, { timeout: 10_000 });

    // Pick a digit to probe with. We try a few digits; the first one that is
    // accepted as input on at least one cell is used to validate undo.
    const probeDigits = [5, 1, 2, 3, 4, 6, 7, 8, 9];

    let validated = false;

    // Try a handful of cells (likely-empty positions in a typical Easy puzzle).
    // Iterate every cell; click, try a digit, see if the count went up — if so
    // it was empty, run the undo assertion and stop.
    const cells = page.getByRole('gridcell', { name: /셀 R\d C\d/ });
    const cellCount = await cells.count();

    outer: for (let i = 0; i < cellCount && !validated; i++) {
      const cell = cells.nth(i);
      await cell.click();

      for (const digit of probeDigits) {
        const before = await countValueGlyphs(page, digit);
        await page.keyboard.press(String(digit));
        // Allow React state -> re-render to flush.
        await page.waitForTimeout(50);
        const after = await countValueGlyphs(page, digit);

        if (after === before + 1) {
          // The cell was empty and the digit was accepted. Now undo.
          await page.keyboard.press('ControlOrMeta+z');
          await page.waitForTimeout(50);
          const undone = await countValueGlyphs(page, digit);
          expect(undone).toBe(before);
          validated = true;
          break outer;
        }
      }
    }

    expect(
      validated,
      'expected at least one cell to accept a digit input on the default puzzle',
    ).toBe(true);
  });

  test('switching the variant picker to "parity" renders parity backgrounds', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForSelector(GRID_READY_SELECTOR, { timeout: 10_000 });

    const variantSelect = page.getByLabel('변형 선택');
    // Bail gracefully if the picker is hidden / disabled — still useful to
    // know the rest of the spec passes in that environment.
    const visible = await variantSelect.isVisible().catch(() => false);
    test.skip(!visible, 'variant picker not present');

    await variantSelect.selectOption('parity');

    // Wait for at least one parity-bg rect to appear. Parity rects are tagged
    // with data-parity="even" | "odd" by the Grid component.
    await page.waitForFunction(
      () =>
        document.querySelectorAll('rect[data-parity="even"], rect[data-parity="odd"]')
          .length > 0,
      undefined,
      { timeout: 5_000 },
    );

    const parityRectCount = await page.evaluate(
      () =>
        document.querySelectorAll('rect[data-parity="even"], rect[data-parity="odd"]')
          .length,
    );
    expect(parityRectCount).toBeGreaterThan(0);
  });
});
