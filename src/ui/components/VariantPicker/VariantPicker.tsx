import { useStore } from '@state/store';
import { listVariants } from '@variants/registry';
import { useNewGame } from '@ui/hooks/useNewGame';
import s from './VariantPicker.module.css';

const DEFAULT_VARIANT_ID = 'classic';

export function VariantPicker(): JSX.Element {
  const variantId = useStore((st) => st.variantId);
  const difficulty = useStore((st) => st.difficulty);
  const newGame = useNewGame();
  const variants = listVariants();

  const currentValue = variantId ?? DEFAULT_VARIANT_ID;
  const disabled = variants.length <= 1;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const nextId = e.target.value;
    if (nextId === variantId) return;
    newGame(nextId, difficulty ?? 'easy');
  };

  return (
    <div className={s.wrapper}>
      <label className="visually-hidden" htmlFor="variant-picker">
        변형 선택
      </label>
      <select
        id="variant-picker"
        className={s.select}
        value={currentValue}
        onChange={handleChange}
        disabled={disabled}
        aria-label="변형 선택"
        data-testid="variant-picker"
      >
        {variants.length === 0 ? (
          <option value={DEFAULT_VARIANT_ID}>Sudoku</option>
        ) : null}
        {variants.map((v) => (
          <option key={v.id} value={v.id}>
            {v.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default VariantPicker;
