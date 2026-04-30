import { useEffect, useMemo, useState } from 'react';
import type { CellIdx, Digit } from '@core/types';
import { useStore } from '@state/store';
import { isVariantRegistered, getVariant } from '@variants/registry';
import type { TutorialStep } from '@variants/types';
import { Modal } from '@ui/components/Modal/Modal';
import { MiniBoard } from './MiniBoard';
import s from './Tutorial.module.css';

export interface TutorialProps {
  open: boolean;
  onClose: () => void;
}

type FeedbackKind = 'idle' | 'correct' | 'wrong';

export function Tutorial({ open, onClose }: TutorialProps): JSX.Element | null {
  const variantId = useStore((st) => st.variantId);
  const v =
    variantId !== null && isVariantRegistered(variantId)
      ? getVariant(variantId)
      : null;
  const steps: TutorialStep[] = useMemo(() => v?.tutorialSteps ?? [], [v]);

  const [stepIdx, setStepIdx] = useState(0);
  const [userInput, setUserInput] = useState<Record<number, Digit>>({});
  const [feedback, setFeedback] = useState<FeedbackKind>('idle');

  // Reset transient state when the modal opens or variant changes.
  useEffect(() => {
    if (open) {
      setStepIdx(0);
      setUserInput({});
      setFeedback('idle');
    }
  }, [open, variantId]);

  if (!open) return null;

  if (!v) {
    return (
      <Modal open={open} onClose={onClose} title="튜토리얼">
        <p>변형이 선택되지 않았습니다.</p>
      </Modal>
    );
  }

  if (steps.length === 0) {
    return (
      <Modal open={open} onClose={onClose} title={`튜토리얼 — ${v.displayName}`}>
        <p>이 변형은 튜토리얼이 없습니다.</p>
        <div className={s.actions}>
          <button type="button" className={s.btn} onClick={onClose}>
            닫기
          </button>
        </div>
      </Modal>
    );
  }

  const safeIdx = Math.min(Math.max(stepIdx, 0), steps.length - 1);
  const step: TutorialStep | undefined = steps[safeIdx];
  if (!step) return null;
  const isLast = safeIdx === steps.length - 1;
  const challenge = step.challenge;
  const challengeSolved =
    challenge !== undefined &&
    userInput[challenge.targetIdx] === challenge.correctDigit;

  const canAdvance = challenge === undefined || challengeSolved;

  const handleDigit = (d: Digit): void => {
    if (!challenge) return;
    setUserInput((prev) => ({ ...prev, [challenge.targetIdx]: d }));
    if (d === challenge.correctDigit) {
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
  };

  const goNext = (): void => {
    if (isLast) {
      onClose();
      return;
    }
    setStepIdx(safeIdx + 1);
    setUserInput({});
    setFeedback('idle');
  };

  const goPrev = (): void => {
    if (safeIdx === 0) return;
    setStepIdx(safeIdx - 1);
    setUserInput({});
    setFeedback('idle');
  };

  const targetIdxForBoard: CellIdx | undefined = challenge?.targetIdx;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`튜토리얼 — ${v.displayName}`}
    >
      <div className={s.progress} data-testid="tutorial-progress">
        {safeIdx + 1} / {steps.length}
      </div>
      <h3 className={s.stepTitle}>{step.title}</h3>
      <p className={s.body}>{step.body}</p>

      {step.miniBoard ? (
        <div className={s.boardWrap}>
          <MiniBoard
            data={step.miniBoard}
            userInput={userInput}
            {...(targetIdxForBoard !== undefined
              ? { challengeTargetIdx: targetIdxForBoard }
              : {})}
          />
        </div>
      ) : null}

      {challenge ? (
        <div className={s.challenge}>
          <div className={s.digitPad} aria-label="튜토리얼 숫자 입력">
            {Array.from({ length: step.miniBoard?.size ?? 9 }, (_, i) => i + 1).map(
              (d) => (
                <button
                  key={d}
                  type="button"
                  className={s.digitBtn}
                  onClick={() => handleDigit(d)}
                  data-testid={`tutorial-digit-${d}`}
                >
                  {d}
                </button>
              ),
            )}
          </div>
          {feedback === 'correct' ? (
            <p
              className={`${s.feedback} ${s.feedbackOk}`}
              data-testid="tutorial-feedback-correct"
            >
              정답입니다! 다음 단계로 진행하세요.
            </p>
          ) : null}
          {feedback === 'wrong' ? (
            <p
              className={`${s.feedback} ${s.feedbackBad}`}
              data-testid="tutorial-feedback-wrong"
            >
              아직이에요. {challenge.hint ?? '다시 시도해 보세요.'}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={s.actions}>
        <button
          type="button"
          className={s.btn}
          onClick={goPrev}
          disabled={safeIdx === 0}
        >
          이전
        </button>
        <button
          type="button"
          className={`${s.btn} ${s.primary}`}
          onClick={goNext}
          disabled={!canAdvance}
          data-testid="tutorial-next"
        >
          {isLast ? '완료' : '다음'}
        </button>
      </div>
    </Modal>
  );
}

export default Tutorial;
