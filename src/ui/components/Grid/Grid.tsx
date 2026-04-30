import { useMemo } from 'react';
import { useStore } from '@state/store';
import { idxToRC, boxIndexOf } from '@core/coords';
import { maskToDigits } from '@core/board';
import type { Board, CellIdx, EdgeDecoration } from '@core/types';
import { useLongPress } from '@ui/hooks/useLongPress';
import { useSudokuFx } from '@ui/hooks/useSudokuFx';
import s from './Grid.module.css';

const UNIT = 100;
const SIZE = 9;
const VIEW = UNIT * SIZE;

interface ConflictMap {
  [idx: number]: boolean;
}

function isEdgeViolated(edge: EdgeDecoration, board: Board): boolean {
  const va = board.cells[edge.a]?.value;
  const vb = board.cells[edge.b]?.value;
  if (va == null || vb == null) return false;
  if (edge.kind === 'sum') return va + vb !== edge.value;
  return Math.abs(va - vb) !== edge.value;
}

function edgeLabelPos(
  a: CellIdx,
  b: CellIdx,
  size: number,
): { cx: number; cy: number } {
  const ra = Math.floor(a / size);
  const ca = a % size;
  const rb = Math.floor(b / size);
  const cb = b % size;
  const cx = ((ca + cb + 1) * UNIT) / 2;
  const cy = ((ra + rb + 1) * UNIT) / 2;
  return { cx, cy };
}

function computeConflicts(board: Board): ConflictMap {
  const map: ConflictMap = {};
  const size = board.size;
  for (const region of board.regions) {
    const seen = new Map<number, CellIdx[]>();
    for (const idx of region.cells) {
      const cell = board.cells[idx];
      if (!cell || cell.value === null) continue;
      const list = seen.get(cell.value);
      if (list) list.push(idx);
      else seen.set(cell.value, [idx]);
    }
    for (const list of seen.values()) {
      if (list.length > 1) {
        for (const i of list) map[i] = true;
      }
    }
  }
  // Parity decoration conflict: filled value disagrees with required parity.
  for (let i = 0; i < board.cells.length; i++) {
    const cell = board.cells[i];
    if (!cell || cell.value === null) continue;
    const parityDeco = cell.decorations.find((d) => d.kind === 'parity');
    if (!parityDeco) continue;
    const isEven = cell.value % 2 === 0;
    const requiredEven = parityDeco.parity === 'even';
    if (isEven !== requiredEven) map[i] = true;
  }
  // Edge-decoration (sum/diff) conflicts: when both endpoints are filled,
  // mark BOTH cells as conflicting if the sum/diff constraint is violated.
  for (const edge of board.edgeDecorations) {
    if (isEdgeViolated(edge, board)) {
      map[edge.a] = true;
      map[edge.b] = true;
    }
  }
  void size;
  return map;
}

export function Grid(): JSX.Element | null {
  const board = useStore((st) => st.board);
  const selectedIdx = useStore((st) => st.selectedIdx);
  const selectCell = useStore((st) => st.selectCell);
  const highlightSameDigit = useStore((st) => st.highlightSameDigit);
  const togglePencilMode = useStore((st) => st.togglePencilMode);

  // Long-press on a cell toggles pencil-mode globally. The cell is also
  // selected via the regular onClick path; on long-press we both select
  // and toggle. consumeLongPress() returns true once after a long press
  // fired so we can suppress the click's "regular" effect if needed —
  // here we still want to select the cell, so we use it to gate state.
  const { pointerHandlers, consumeLongPress } = useLongPress({
    onLongPress: (idx) => {
      // Select the long-pressed cell first so memo entry feels natural.
      selectCell(idx);
      togglePencilMode();
    },
  });

  const conflicts = useMemo(() => (board ? computeConflicts(board) : {}), [board]);

  const { animatingRegionIds } = useSudokuFx();

  // Build set of cell indices belonging to any region currently in the
  // completion-flash animation window. Empty set when nothing animating.
  const cellAnimating = useMemo(() => {
    const out = new Set<number>();
    if (!board || animatingRegionIds.size === 0) return out;
    for (const region of board.regions) {
      if (animatingRegionIds.has(region.id)) {
        for (const idx of region.cells) out.add(idx);
      }
    }
    return out;
  }, [board, animatingRegionIds]);

  const peerSet = useMemo(() => {
    if (!board || selectedIdx === null) return new Set<number>();
    const set = new Set<number>();
    const { row: sr, col: sc } = idxToRC(selectedIdx, board.size);
    const sb = boxIndexOf(selectedIdx, board.size);
    for (let i = 0; i < board.cells.length; i++) {
      if (i === selectedIdx) continue;
      const { row, col } = idxToRC(i, board.size);
      if (row === sr || col === sc || boxIndexOf(i, board.size) === sb) {
        set.add(i);
      }
    }
    return set;
  }, [board, selectedIdx]);

  const selectedValue = useMemo(() => {
    if (!board || selectedIdx === null) return null;
    return board.cells[selectedIdx]?.value ?? null;
  }, [board, selectedIdx]);

  if (!board) return null;

  return (
    <div className={s.gridWrap} data-testid="grid-wrap">
      <svg
        className={s.svgLayer}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* parity-bg (under cells-bg so selected/peer highlights win) */}
        <g data-layer="parity-bg">
          {board.cells.map((cell, idx) => {
            const parityDeco = cell.decorations.find((d) => d.kind === 'parity');
            if (!parityDeco) return null;
            const { row, col } = idxToRC(idx, board.size);
            const fill =
              parityDeco.parity === 'even'
                ? 'var(--cell-parity-even)'
                : 'var(--cell-parity-odd)';
            const cls =
              parityDeco.parity === 'even' ? s.parityEven : s.parityOdd;
            return (
              <rect
                key={`parity-${idx}`}
                className={cls}
                data-parity={parityDeco.parity}
                x={col * UNIT}
                y={row * UNIT}
                width={UNIT}
                height={UNIT}
                fill={fill}
              />
            );
          })}
        </g>

        {/* cells-bg */}
        <g>
          {board.cells.map((cell, idx) => {
            const { row, col } = idxToRC(idx, board.size);
            const hasParity = cell.decorations.some((d) => d.kind === 'parity');
            let fill: string | null = 'var(--cell-default)';
            if (idx === selectedIdx) fill = 'var(--cell-selected)';
            else if (
              highlightSameDigit &&
              selectedValue !== null &&
              cell.value === selectedValue
            ) {
              fill = 'var(--cell-same-digit)';
            } else if (peerSet.has(idx)) {
              fill = 'var(--cell-peer)';
            } else if (hasParity) {
              // let parity-bg show through unobstructed
              fill = null;
            }
            const isOverlay =
              idx === selectedIdx ||
              peerSet.has(idx) ||
              (highlightSameDigit &&
                selectedValue !== null &&
                cell.value === selectedValue);
            const opacity = hasParity && isOverlay ? 0.6 : 1;
            if (fill === null) return null;
            return (
              <rect
                key={`bg-${idx}`}
                x={col * UNIT}
                y={row * UNIT}
                width={UNIT}
                height={UNIT}
                fill={fill}
                opacity={opacity}
              />
            );
          })}
        </g>

        {/* region-flash overlay (drawn above cells-bg, below text/lines).
            Each cell that belongs to a freshly-completed region gets a
            short keyframe animation — see Grid.module.css `regionFlash`. */}
        <g data-layer="region-flash" pointerEvents="none">
          {cellAnimating.size > 0
            ? board.cells.map((_, idx) => {
                if (!cellAnimating.has(idx)) return null;
                const { row, col } = idxToRC(idx, board.size);
                return (
                  <rect
                    key={`flash-${idx}`}
                    className={s.regionCompleting}
                    data-region-complete="1"
                    x={col * UNIT}
                    y={row * UNIT}
                    width={UNIT}
                    height={UNIT}
                  />
                );
              })
            : null}
        </g>

        {/* decorations layer (future: edge decorations) */}
        <g data-layer="decorations" />

        {/* cells-text */}
        <g>
          {board.cells.map((cell, idx) => {
            const { row, col } = idxToRC(idx, board.size);
            const cx = col * UNIT + UNIT / 2;
            const cy = row * UNIT + UNIT / 2;
            if (cell.value !== null) {
              const isConflict = conflicts[idx] === true;
              const color = isConflict
                ? 'var(--num-error)'
                : cell.given
                  ? 'var(--num-given)'
                  : 'var(--num-user)';
              return (
                <text
                  key={`val-${idx}`}
                  x={cx}
                  y={cy}
                  fontSize={50}
                  fontWeight={cell.given ? 600 : 500}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color}
                  fontFamily="system-ui, sans-serif"
                >
                  {cell.value}
                </text>
              );
            }
            // pencil candidates
            if (cell.candidates !== 0) {
              const digits = maskToDigits(cell.candidates, board.domain);
              return (
                <g key={`cand-${idx}`}>
                  {digits.map((d) => {
                    const mr = Math.floor((d - 1) / 3);
                    const mc = (d - 1) % 3;
                    const px = col * UNIT + mc * (UNIT / 3) + UNIT / 6;
                    const py = row * UNIT + mr * (UNIT / 3) + UNIT / 6;
                    return (
                      <text
                        key={`cand-${idx}-${d}`}
                        x={px}
                        y={py}
                        fontSize={18}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="var(--num-pencil)"
                        fontFamily="system-ui, sans-serif"
                      >
                        {d}
                      </text>
                    );
                  })}
                </g>
              );
            }
            return null;
          })}
        </g>

        {/* grid-lines */}
        <g>
          {/* thin cell lines */}
          {Array.from({ length: SIZE + 1 }, (_, i) => {
            const isBox = i % 3 === 0;
            const stroke = isBox ? 'var(--grid-box-line)' : 'var(--grid-cell-line)';
            const sw = isBox ? 3 : 1;
            return (
              <g key={`lines-${i}`}>
                <line
                  x1={i * UNIT}
                  y1={0}
                  x2={i * UNIT}
                  y2={VIEW}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeLinecap="square"
                />
                <line
                  x1={0}
                  y1={i * UNIT}
                  x2={VIEW}
                  y2={i * UNIT}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeLinecap="square"
                />
              </g>
            );
          })}
        </g>

        {/* edge-labels (top-most: sum/diff labels at cell boundaries) */}
        <g className={s.edgeLabels} data-layer="edge-labels">
          {board.edgeDecorations.map((edge, i) => {
            const { cx, cy } = edgeLabelPos(edge.a, edge.b, board.size);
            const violated = isEdgeViolated(edge, board);
            const kindClass = edge.kind === 'sum' ? s.edgeSum : s.edgeDiff;
            const violationClass = violated ? s.edgeViolated : '';
            const sign = edge.kind === 'sum' ? '+' : '−';
            const text = `${sign}${edge.value}`;
            const groupClass = violationClass
              ? `${kindClass} ${violationClass}`
              : kindClass;
            return (
              <g
                key={`edge-${i}-${edge.a}-${edge.b}`}
                className={groupClass}
                data-edge-kind={edge.kind}
                data-edge-violated={violated ? 'true' : 'false'}
              >
                <rect
                  x={cx - 16}
                  y={cy - 9}
                  width={32}
                  height={18}
                  rx={3}
                  ry={3}
                />
                <text
                  x={cx}
                  y={cy}
                  fontSize={14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="system-ui, sans-serif"
                >
                  {text}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className={s.domLayer} role="grid" aria-label="Sudoku board">
        {board.cells.map((_, idx) => {
          const { row, col } = idxToRC(idx, board.size);
          const handlers = pointerHandlers(idx);
          return (
            <button
              key={`btn-${idx}`}
              type="button"
              className={s.cellButton}
              role="gridcell"
              aria-label={`셀 R${row + 1} C${col + 1}`}
              aria-selected={idx === selectedIdx}
              onClick={() => {
                // If a long press just fired, it has already handled
                // selection + pencilMode toggle. Suppress regular click.
                if (consumeLongPress()) return;
                selectCell(idx);
              }}
              {...handlers}
              data-idx={idx}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Grid;
