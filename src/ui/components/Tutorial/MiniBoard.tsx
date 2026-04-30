import type { CellIdx, Digit } from '@core/types';
import type { TutorialMiniBoard } from '@variants/types';
import s from './MiniBoard.module.css';

const UNIT = 60;

export interface MiniBoardProps {
  data: TutorialMiniBoard;
  selectedIdx?: CellIdx | null;
  onSelectCell?: (idx: CellIdx) => void;
  userInput?: Record<number, Digit>;
  challengeTargetIdx?: CellIdx;
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

export function MiniBoard(props: MiniBoardProps): JSX.Element {
  const { data, selectedIdx, onSelectCell, userInput, challengeTargetIdx } =
    props;
  const size = data.size;
  const view = UNIT * size;
  const givens = new Set(data.givens ?? []);
  const highlights = new Set(data.highlightCells ?? []);
  const parityMap = new Map<CellIdx, 'even' | 'odd'>();
  for (const p of data.parityDecorations ?? []) parityMap.set(p.idx, p.parity);

  return (
    <div className={s.wrap} style={{ width: view, height: view }}>
      <svg
        className={s.svg}
        viewBox={`0 0 ${view} ${view}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* parity background */}
        <g>
          {Array.from({ length: size * size }, (_, idx) => {
            const parity = parityMap.get(idx);
            if (!parity) return null;
            const r = Math.floor(idx / size);
            const c = idx % size;
            const fill =
              parity === 'even'
                ? 'var(--cell-parity-even)'
                : 'var(--cell-parity-odd)';
            return (
              <rect
                key={`p-${idx}`}
                x={c * UNIT}
                y={r * UNIT}
                width={UNIT}
                height={UNIT}
                fill={fill}
              />
            );
          })}
        </g>

        {/* highlight + selection + target outline */}
        <g>
          {Array.from({ length: size * size }, (_, idx) => {
            const r = Math.floor(idx / size);
            const c = idx % size;
            let fill: string | null = null;
            if (idx === selectedIdx) fill = 'var(--cell-selected)';
            else if (highlights.has(idx)) fill = 'var(--cell-peer)';
            if (fill === null) return null;
            return (
              <rect
                key={`h-${idx}`}
                x={c * UNIT}
                y={r * UNIT}
                width={UNIT}
                height={UNIT}
                fill={fill}
                opacity={0.8}
              />
            );
          })}
        </g>

        {/* values */}
        <g>
          {data.cells.map((v, idx) => {
            const r = Math.floor(idx / size);
            const c = idx % size;
            const cx = c * UNIT + UNIT / 2;
            const cy = r * UNIT + UNIT / 2;
            const userDigit = userInput?.[idx];
            const display: Digit | null =
              v !== null ? v : userDigit !== undefined ? userDigit : null;
            if (display === null) return null;
            const isGiven = givens.has(idx) || v !== null;
            const color = isGiven ? 'var(--num-given)' : 'var(--num-user)';
            return (
              <text
                key={`v-${idx}`}
                x={cx}
                y={cy}
                fontSize={UNIT * 0.55}
                fontWeight={isGiven ? 600 : 500}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontFamily="system-ui, sans-serif"
              >
                {display}
              </text>
            );
          })}
        </g>

        {/* grid lines */}
        <g>
          {Array.from({ length: size + 1 }, (_, i) => (
            <g key={`gl-${i}`}>
              <line
                x1={i * UNIT}
                y1={0}
                x2={i * UNIT}
                y2={view}
                stroke="var(--grid-cell-line)"
                strokeWidth={i === 0 || i === size ? 2 : 1}
              />
              <line
                x1={0}
                y1={i * UNIT}
                x2={view}
                y2={i * UNIT}
                stroke="var(--grid-cell-line)"
                strokeWidth={i === 0 || i === size ? 2 : 1}
              />
            </g>
          ))}
        </g>

        {/* outer border */}
        <rect
          x={0.5}
          y={0.5}
          width={view - 1}
          height={view - 1}
          fill="none"
          stroke="var(--grid-box-line)"
          strokeWidth={2}
        />

        {/* edge labels */}
        <g>
          {(data.edgeDecorations ?? []).map((edge, i) => {
            const { cx, cy } = edgeLabelPos(edge.a, edge.b, size);
            const cls = edge.kind === 'sum' ? s.edgeSum : s.edgeDiff;
            const sign = edge.kind === 'sum' ? '+' : '−';
            return (
              <g key={`edge-${i}`} className={cls} data-edge-kind={edge.kind}>
                <rect x={cx - 14} y={cy - 8} width={28} height={16} rx={3} />
                <text
                  x={cx}
                  y={cy}
                  fontSize={12}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="system-ui, sans-serif"
                >
                  {sign}
                  {edge.value}
                </text>
              </g>
            );
          })}
        </g>

        {/* challenge target outline */}
        {challengeTargetIdx !== undefined ? (
          <rect
            x={(challengeTargetIdx % size) * UNIT + 2}
            y={Math.floor(challengeTargetIdx / size) * UNIT + 2}
            width={UNIT - 4}
            height={UNIT - 4}
            fill="none"
            stroke="var(--focus)"
            strokeWidth={3}
            strokeDasharray="4 3"
          />
        ) : null}
      </svg>

      {/* DOM layer: clickable cells */}
      <div
        className={s.domLayer}
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {Array.from({ length: size * size }, (_, idx) => (
          <button
            key={`btn-${idx}`}
            type="button"
            className={s.cellButton}
            onClick={() => onSelectCell?.(idx)}
            aria-label={`mini cell ${idx}`}
            data-idx={idx}
          />
        ))}
      </div>
    </div>
  );
}

export default MiniBoard;
