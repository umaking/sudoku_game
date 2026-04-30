import { useStore } from '@state/store';
import { listVariants } from '@variants/registry';
import { Modal } from '@ui/components/Modal/Modal';
import s from './StatsModal.module.css';

export interface StatsModalProps {
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

export function StatsModal({ open, onClose }: StatsModalProps): JSX.Element {
  const variants = listVariants();
  // Subscribe to byVariant so the table re-renders when stats change.
  const byVariant = useStore((st) => st.byVariant);
  const getStats = useStore((st) => st.getStats);
  const clearStats = useStore((st) => st.clearStats);

  const rows = variants.flatMap((v) =>
    v.difficulties.map((d) => {
      // Reading getStats keeps a single source of truth; byVariant is referenced
      // above so React re-renders when entries change.
      void byVariant;
      const stat = getStats(v.id, d);
      return {
        key: `${v.id}-${d}`,
        variantName: v.displayName,
        difficulty: d,
        bestTimeMs: stat.bestTimeMs,
        completedCount: stat.completedCount,
        totalMistakes: stat.totalMistakes,
      };
    }),
  );

  const handleClear = (): void => {
    if (typeof window !== 'undefined') {
      if (!window.confirm('정말 통계를 초기화할까요?')) return;
    }
    clearStats();
  };

  return (
    <Modal open={open} onClose={onClose} title="통계">
      {rows.length === 0 ? (
        <p className={s.empty}>등록된 변형이 없습니다.</p>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table} data-testid="stats-table">
            <thead>
              <tr>
                <th scope="col">변형</th>
                <th scope="col">난이도</th>
                <th scope="col">PB</th>
                <th scope="col">완료</th>
                <th scope="col">실수</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} data-testid={`stats-row-${r.key}`}>
                  <td>{r.variantName}</td>
                  <td>{r.difficulty}</td>
                  <td className={s.numeric} data-testid={`stats-pb-${r.key}`}>
                    {r.bestTimeMs !== null ? formatTime(r.bestTimeMs) : '–'}
                  </td>
                  <td className={s.numeric}>{r.completedCount}</td>
                  <td className={s.numeric}>{r.totalMistakes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className={s.actions}>
        <button
          type="button"
          className={s.dangerBtn}
          onClick={handleClear}
          data-testid="stats-clear"
        >
          통계 초기화
        </button>
        <button type="button" className={s.closeBtn} onClick={onClose}>
          닫기
        </button>
      </div>
    </Modal>
  );
}

export default StatsModal;
