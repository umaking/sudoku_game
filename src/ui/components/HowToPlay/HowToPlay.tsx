import { useStore } from '@state/store';
import { isVariantRegistered, getVariant } from '@variants/registry';
import { Modal } from '@ui/components/Modal/Modal';
import s from './HowToPlay.module.css';

export interface HowToPlayProps {
  open: boolean;
  onClose: () => void;
}

interface Block {
  kind: 'h1' | 'h2' | 'h3' | 'p' | 'li';
  text: string;
}

/**
 * SimpleMarkdown — minimal renderer that supports headings (#, ##, ###),
 * list items (- ...), bold inline (**...**), and paragraph blocks. No
 * library dependency. Returns React nodes inline.
 */
function parseMarkdown(text: string): Block[] {
  const lines = text.split(/\r?\n/);
  const blocks: Block[] = [];
  let para: string[] = [];

  function flushPara(): void {
    if (para.length > 0) {
      blocks.push({ kind: 'p', text: para.join(' ') });
      para = [];
    }
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      flushPara();
      continue;
    }
    if (line.startsWith('### ')) {
      flushPara();
      blocks.push({ kind: 'h3', text: line.slice(4) });
      continue;
    }
    if (line.startsWith('## ')) {
      flushPara();
      blocks.push({ kind: 'h2', text: line.slice(3) });
      continue;
    }
    if (line.startsWith('# ')) {
      flushPara();
      blocks.push({ kind: 'h1', text: line.slice(2) });
      continue;
    }
    if (line.startsWith('- ')) {
      flushPara();
      blocks.push({ kind: 'li', text: line.slice(2) });
      continue;
    }
    para.push(line);
  }
  flushPara();
  return blocks;
}

function renderInline(text: string): JSX.Element[] {
  // Bold split on **...**
  const out: JSX.Element[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) {
      out.push(<span key={key++}>{text.slice(lastIdx, match.index)}</span>);
    }
    out.push(<strong key={key++}>{match[1]}</strong>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    out.push(<span key={key++}>{text.slice(lastIdx)}</span>);
  }
  if (out.length === 0) {
    out.push(<span key={key++}>{text}</span>);
  }
  return out;
}

function SimpleMarkdown({ text }: { text: string }): JSX.Element {
  const blocks = parseMarkdown(text);
  return (
    <div className={s.markdown}>
      {blocks.map((b, i) => {
        const inline = renderInline(b.text);
        if (b.kind === 'h1') return <h2 key={i}>{inline}</h2>;
        if (b.kind === 'h2') return <h3 key={i}>{inline}</h3>;
        if (b.kind === 'h3') return <h4 key={i}>{inline}</h4>;
        if (b.kind === 'li') {
          return (
            <ul key={i}>
              <li>{inline}</li>
            </ul>
          );
        }
        return <p key={i}>{inline}</p>;
      })}
    </div>
  );
}

export function HowToPlay({ open, onClose }: HowToPlayProps): JSX.Element | null {
  const variantId = useStore((st) => st.variantId);
  const v =
    variantId !== null && isVariantRegistered(variantId)
      ? getVariant(variantId)
      : null;

  if (!open) return null;
  if (!v) {
    return (
      <Modal open={open} onClose={onClose} title="규칙">
        <p>변형이 선택되지 않았습니다.</p>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={v.displayName}>
      <SimpleMarkdown text={v.rulePanelMD} />
      <p className={s.oneLiner}>
        <strong>{v.tutorialOneLiner}</strong>
      </p>
    </Modal>
  );
}

export default HowToPlay;
