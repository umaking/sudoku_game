import { useEffect, useState } from 'react';
import { useStore } from '@state/store';
import { isVariantRegistered } from '@variants/registry';
import { Grid } from '@ui/components/Grid/Grid';
import { NumberPad } from '@ui/components/NumberPad/NumberPad';
import { TopBar } from '@ui/components/TopBar/TopBar';
import { HowToPlay } from '@ui/components/HowToPlay/HowToPlay';
import { Tutorial } from '@ui/components/Tutorial/Tutorial';
import { ResultScreen } from '@ui/components/ResultScreen/ResultScreen';
import { SettingsModal } from '@ui/components/SettingsModal/SettingsModal';
import { StatsModal } from '@ui/components/StatsModal/StatsModal';
import { useTimer } from '@ui/hooks/useTimer';
import { useKeyboardNav } from '@ui/hooks/useKeyboardNav';
import { useNewGame } from '@ui/hooks/useNewGame';
import { useFinishDetector } from '@ui/hooks/useFinishDetector';
import { useDocumentAttributes } from '@ui/hooks/useDocumentAttributes';
import s from './GamePage.module.css';

const INITIAL_VARIANT_ID = 'classic';

export function GamePage(): JSX.Element {
  const board = useStore((st) => st.board);
  const finished = useStore((st) => st.finished);
  const newGame = useNewGame();

  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  // Sync settings (theme, colorBlind, fontScale) to <html> attributes/CSS vars.
  useDocumentAttributes();

  // Boot: generate puzzle on first mount if no board.
  useEffect(() => {
    if (board) return;
    if (!isVariantRegistered(INITIAL_VARIANT_ID)) return;
    newGame(INITIAL_VARIANT_ID, 'easy');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-show ResultScreen when the session transitions to finished.
  useEffect(() => {
    if (finished) setResultOpen(true);
  }, [finished]);

  useTimer();
  useFinishDetector();

  const anyModalOpen =
    howToPlayOpen || tutorialOpen || resultOpen || settingsOpen || statsOpen;
  useKeyboardNav({ enabled: !anyModalOpen });

  return (
    <div className={s.page}>
      <TopBar
        onOpenHowToPlay={() => setHowToPlayOpen(true)}
        onOpenTutorial={() => setTutorialOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
      />
      <Grid />
      <NumberPad />
      <HowToPlay
        open={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
      />
      <Tutorial
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
      <ResultScreen open={resultOpen} onClose={() => setResultOpen(false)} />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  );
}

export default GamePage;
