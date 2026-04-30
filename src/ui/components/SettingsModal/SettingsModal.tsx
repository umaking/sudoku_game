import { useStore } from '@state/store';
import { Modal } from '@ui/components/Modal/Modal';
import type { Theme } from '@state/slices/settingsSlice';
import s from './SettingsModal.module.css';

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
];

const FONT_SCALE_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: 'Sm' },
  { value: 1.15, label: 'Md' },
  { value: 1.3, label: 'Lg' },
];

function approxEq(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-3;
}

export function SettingsModal({ open, onClose }: SettingsModalProps): JSX.Element {
  const theme = useStore((st) => st.theme);
  const setTheme = useStore((st) => st.setTheme);
  const colorBlind = useStore((st) => st.colorBlind);
  const setColorBlind = useStore((st) => st.setColorBlind);
  const fontScale = useStore((st) => st.fontScale);
  const setFontScale = useStore((st) => st.setFontScale);
  const highlightSameDigit = useStore((st) => st.highlightSameDigit);
  const setHighlightSameDigit = useStore((st) => st.setHighlightSameDigit);
  const autoCheck = useStore((st) => st.autoCheck);
  const setAutoCheck = useStore((st) => st.setAutoCheck);
  const soundEnabled = useStore((st) => st.soundEnabled);
  const setSoundEnabled = useStore((st) => st.setSoundEnabled);

  return (
    <Modal open={open} onClose={onClose} title="설정">
      <section className={s.section} data-testid="settings-theme">
        <h3 className={s.heading}>테마</h3>
        <div className={s.segmented} role="group" aria-label="테마 선택">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={s.segment}
              aria-pressed={theme === opt.value}
              onClick={() => setTheme(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className={s.section} data-testid="settings-colorblind">
        <h3 className={s.heading}>색맹 모드</h3>
        <label className={s.toggleRow}>
          <input
            type="checkbox"
            checked={colorBlind}
            onChange={(e) => setColorBlind(e.target.checked)}
            aria-label="색맹 모드 사용"
          />
          <span className={s.toggleText}>
            색 외 패턴/모양으로도 구분되도록 표시합니다.
          </span>
        </label>
      </section>

      <section className={s.section} data-testid="settings-fontscale">
        <h3 className={s.heading}>글꼴 크기</h3>
        <div className={s.segmented} role="group" aria-label="글꼴 크기 선택">
          {FONT_SCALE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={s.segment}
              aria-pressed={approxEq(fontScale, opt.value)}
              onClick={() => setFontScale(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className={s.section} data-testid="settings-highlight">
        <h3 className={s.heading}>같은 숫자 강조</h3>
        <label className={s.toggleRow}>
          <input
            type="checkbox"
            checked={highlightSameDigit}
            onChange={(e) => setHighlightSameDigit(e.target.checked)}
            aria-label="같은 숫자 강조 사용"
          />
          <span className={s.toggleText}>
            선택한 셀과 같은 숫자가 들어간 셀을 강조합니다.
          </span>
        </label>
      </section>

      <section className={s.section} data-testid="settings-autocheck">
        <h3 className={s.heading}>즉시 검증 모드</h3>
        <label className={s.toggleRow}>
          <input
            type="checkbox"
            checked={autoCheck}
            onChange={(e) => setAutoCheck(e.target.checked)}
            aria-label="즉시 검증 모드 사용"
          />
          <span className={s.toggleText}>
            오답을 입력하는 즉시 표시합니다.
          </span>
        </label>
      </section>

      <section className={s.section} data-testid="settings-sound">
        <h3 className={s.heading}>효과음</h3>
        <label className={s.toggleRow}>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            aria-label="효과음 사용"
          />
          <span className={s.toggleText}>
            숫자 입력과 한 줄 완성 시 짧은 효과음을 재생합니다.
          </span>
        </label>
      </section>

      <div className={s.actions}>
        <button type="button" className={s.closeBtn} onClick={onClose}>
          닫기
        </button>
      </div>
    </Modal>
  );
}

export default SettingsModal;
