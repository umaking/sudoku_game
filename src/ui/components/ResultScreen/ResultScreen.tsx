import { useStore } from '@state/store';
import { useNewGame } from '@ui/hooks/useNewGame';
import { Modal } from '@ui/components/Modal/Modal';
import s from './ResultScreen.module.css';

export interface ResultScreenProps {
  open: boolean;
  onClose: () => void;
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export function ResultScreen({ open, onClose }: ResultScreenProps): JSX.Element {
  const elapsedMs = useStore((st) => st.elapsedMs);
  const mistakes = useStore((st) => st.mistakes);
  const variantId = useStore((st) => st.variantId);
  const difficulty = useStore((st) => st.difficulty);
  const getStats = useStore((st) => st.getStats);
  const newGame = useNewGame();

  const stats =
    variantId !== null && difficulty !== null
      ? getStats(variantId, difficulty)
      : null;
  const isPb = stats !== null && stats.bestTimeMs === elapsedMs;

  const handleAgain = (): void => {
    if (variantId === null || difficulty === null) return;
    newGame(variantId, difficulty);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="🎉 풀었습니다!">
      <div className={s.metrics} data-testid="result-screen">
        <div className={s.row}>
          <span className={s.label}>시간</span>
          <span className={s.value} data-testid="result-time">
            {formatTime(elapsedMs)}
          </span>
        </div>
        <div className={s.row}>
          <span className={s.label}>실수</span>
          <span className={s.value} data-testid="result-mistakes">
            {mistakes}
          </span>
        </div>
        {stats !== null ? (
          <div className={s.row}>
            <span className={s.label}>최고 기록</span>
            <span className={s.value} data-testid="result-best">
              {stats.bestTimeMs !== null
                ? formatTime(stats.bestTimeMs)
                : '—'}
            </span>
          </div>
        ) : null}
        {isPb ? (
          <div className={s.pbBadge} data-testid="result-pb">
            🏆 개인 최고 기록 갱신!
          </div>
        ) : null}
      </div>
      <div className={s.actions}>
        <button
          type="button"
          className={`${s.btn} ${s.primary}`}
          onClick={handleAgain}
          disabled={variantId === null || difficulty === null}
        >
          다시 도전
        </button>
        <button type="button" className={s.btn} onClick={onClose}>
          닫기
        </button>
      </div>
    </Modal>
  );
}

export default ResultScreen;
