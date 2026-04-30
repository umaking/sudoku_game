import { useMemo } from 'react';
import { useStore } from '@state/store';
import s from './NumberPad.module.css';

export function NumberPad(): JSX.Element {
  const board = useStore((st) => st.board);
  const selectedIdx = useStore((st) => st.selectedIdx);
  const pencilMode = useStore((st) => st.pencilMode);
  const setDigit = useStore((st) => st.setDigit);
  const clearCell = useStore((st) => st.clearCell);
  const toggleCandidate = useStore((st) => st.toggleCandidate);
  const togglePencilMode = useStore((st) => st.togglePencilMode);
  const undo = useStore((st) => st.undo);
  const redo = useStore((st) => st.redo);
  const past = useStore((st) => st.past);
  const future = useStore((st) => st.future);

  const counts = useMemo(() => {
    const map: Record<number, number> = {};
    if (!board) return map;
    for (const cell of board.cells) {
      if (cell.value !== null) {
        map[cell.value] = (map[cell.value] ?? 0) + 1;
      }
    }
    return map;
  }, [board]);

  const onDigit = (d: number): void => {
    if (selectedIdx === null) return;
    if (pencilMode) {
      toggleCandidate(selectedIdx, d);
    } else {
      setDigit(selectedIdx, d);
    }
  };

  const onErase = (): void => {
    if (selectedIdx === null) return;
    clearCell(selectedIdx);
  };

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className={s.pad}>
      <div className={s.digits}>
        {digits.map((d) => {
          const exhausted = (counts[d] ?? 0) >= 9;
          const cls = exhausted ? `${s.btn} ${s.btnExhausted}` : s.btn;
          return (
            <button
              key={d}
              type="button"
              className={cls}
              onClick={() => onDigit(d)}
              aria-label={pencilMode ? `메모 ${d}` : `숫자 ${d}`}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className={s.actions}>
        <button
          type="button"
          className={s.btn}
          onClick={onErase}
          aria-label="지우기"
        >
          지우기
        </button>
        <button
          type="button"
          className={pencilMode ? `${s.btn} ${s.btnActive}` : s.btn}
          onClick={togglePencilMode}
          aria-pressed={pencilMode}
          aria-label="메모 모드"
        >
          메모 {pencilMode ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          className={s.btn}
          onClick={undo}
          disabled={past.length === 0}
          aria-label="실행 취소"
        >
          되돌리기
        </button>
        <button
          type="button"
          className={s.btn}
          onClick={redo}
          disabled={future.length === 0}
          aria-label="다시 실행"
        >
          다시
        </button>
      </div>
    </div>
  );
}

export default NumberPad;
