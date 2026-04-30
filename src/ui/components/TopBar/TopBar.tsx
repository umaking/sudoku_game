import { useStore } from '@state/store';
import { VariantPicker } from '@ui/components/VariantPicker/VariantPicker';
import s from './TopBar.module.css';

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function nextTheme(t: 'light' | 'dark' | 'system'): 'light' | 'dark' | 'system' {
  if (t === 'light') return 'dark';
  if (t === 'dark') return 'system';
  return 'light';
}

export interface TopBarProps {
  onOpenHowToPlay?: () => void;
  onOpenTutorial?: () => void;
  onOpenSettings?: () => void;
  onOpenStats?: () => void;
}

export function TopBar(props: TopBarProps = {}): JSX.Element {
  const { onOpenHowToPlay, onOpenTutorial, onOpenSettings, onOpenStats } = props;
  const difficulty = useStore((st) => st.difficulty);
  const elapsedMs = useStore((st) => st.elapsedMs);
  const mistakes = useStore((st) => st.mistakes);
  const theme = useStore((st) => st.theme);
  const setTheme = useStore((st) => st.setTheme);

  const diff = difficulty
    ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
    : '';

  return (
    <div className={s.bar}>
      <div className={s.left}>
        <VariantPicker />
        {diff ? <span className={s.difficulty}>· {diff}</span> : null}
      </div>
      <div className={s.right}>
        <span className={s.timer} aria-label="elapsed time">
          {formatTime(elapsedMs)}
        </span>
        <span className={s.mistakes} aria-label="mistakes">
          ✕ {mistakes}
        </span>
        <button
          type="button"
          className={s.iconButton}
          onClick={() => setTheme(nextTheme(theme))}
          aria-label={`테마 전환 (현재 ${theme})`}
          title={`Theme: ${theme}`}
        >
          ◐
        </button>
        {onOpenSettings ? (
          <button
            type="button"
            className={s.iconButton}
            onClick={onOpenSettings}
            aria-label="설정 열기"
            title="설정"
          >
            ⚙
          </button>
        ) : null}
        {onOpenStats ? (
          <button
            type="button"
            className={s.iconButton}
            onClick={onOpenStats}
            aria-label="통계 열기"
            title="통계"
          >
            📊
          </button>
        ) : null}
        {onOpenHowToPlay ? (
          <button
            type="button"
            className={s.iconButton}
            onClick={onOpenHowToPlay}
            aria-label="규칙 보기"
            title="규칙 보기"
          >
            ?
          </button>
        ) : null}
        {onOpenTutorial ? (
          <button
            type="button"
            className={s.iconButton}
            onClick={onOpenTutorial}
            aria-label="튜토리얼 열기"
            title="튜토리얼"
          >
            🎓
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default TopBar;
