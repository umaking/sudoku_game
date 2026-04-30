import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import s from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  ariaLabel?: string;
}

export function Modal(props: ModalProps): JSX.Element | null {
  const { open, onClose, title, children, ariaLabel } = props;
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = surfaceRef.current;
    if (!node) return;
    const focusable = node.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable) {
      focusable.focus();
    } else {
      node.focus();
    }
  }, [open]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const labelProp = title
    ? { 'aria-labelledby': 'modal-title' }
    : ariaLabel
      ? { 'aria-label': ariaLabel }
      : {};

  const node = (
    <div
      className={s.backdrop}
      data-testid="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={surfaceRef}
        className={s.surface}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        {...labelProp}
      >
        {title ? (
          <div className={s.header}>
            <h2 id="modal-title" className={s.title}>
              {title}
            </h2>
            <button
              type="button"
              className={s.closeButton}
              onClick={onClose}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={s.closeButtonFloating}
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        )}
        <div className={s.body}>{children}</div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

export default Modal;
