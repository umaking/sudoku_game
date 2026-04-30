import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStore } from '@state/store';
import { SettingsModal } from './SettingsModal';

function resetSettings(): void {
  act(() => {
    useStore.setState({
      theme: 'system',
      colorBlind: false,
      fontScale: 1,
      highlightSameDigit: true,
      autoCheck: true,
      soundEnabled: true,
    });
  });
}

describe('SettingsModal', () => {
  beforeEach(() => {
    resetSettings();
  });

  it('renders all settings sections when open', () => {
    render(<SettingsModal open={true} onClose={() => {}} />);
    expect(screen.getByText('테마')).toBeTruthy();
    expect(screen.getByText('색맹 모드')).toBeTruthy();
    expect(screen.getByText('글꼴 크기')).toBeTruthy();
    expect(screen.getByText('같은 숫자 강조')).toBeTruthy();
    expect(screen.getByText('즉시 검증 모드')).toBeTruthy();
    expect(screen.getByText('효과음')).toBeTruthy();
  });

  it('does not render when open is false', () => {
    render(<SettingsModal open={false} onClose={() => {}} />);
    expect(screen.queryByText('테마')).toBeNull();
  });

  it('clicking a theme segment updates store.theme', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open={true} onClose={() => {}} />);
    const darkBtn = screen.getByRole('button', { name: '다크' });
    await user.click(darkBtn);
    expect(useStore.getState().theme).toBe('dark');

    const lightBtn = screen.getByRole('button', { name: '라이트' });
    await user.click(lightBtn);
    expect(useStore.getState().theme).toBe('light');
  });

  it('marks the active theme button with aria-pressed=true', () => {
    act(() => {
      useStore.getState().setTheme('dark');
    });
    render(<SettingsModal open={true} onClose={() => {}} />);
    expect(
      screen.getByRole('button', { name: '다크' }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      screen.getByRole('button', { name: '라이트' }).getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('toggling color blind checkbox updates store.colorBlind', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open={true} onClose={() => {}} />);
    const cb = screen.getByLabelText('색맹 모드 사용');
    await user.click(cb);
    expect(useStore.getState().colorBlind).toBe(true);
    await user.click(cb);
    expect(useStore.getState().colorBlind).toBe(false);
  });

  it('clicking a font-scale segment updates store.fontScale', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open={true} onClose={() => {}} />);
    const lg = screen.getByRole('button', { name: 'Lg' });
    await user.click(lg);
    expect(useStore.getState().fontScale).toBeCloseTo(1.3, 5);
    const md = screen.getByRole('button', { name: 'Md' });
    await user.click(md);
    expect(useStore.getState().fontScale).toBeCloseTo(1.15, 5);
  });

  it('toggling highlightSameDigit and autoCheck updates the store', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open={true} onClose={() => {}} />);
    const hl = screen.getByLabelText('같은 숫자 강조 사용');
    expect(useStore.getState().highlightSameDigit).toBe(true);
    await user.click(hl);
    expect(useStore.getState().highlightSameDigit).toBe(false);

    const ac = screen.getByLabelText('즉시 검증 모드 사용');
    expect(useStore.getState().autoCheck).toBe(true);
    await user.click(ac);
    expect(useStore.getState().autoCheck).toBe(false);
  });

  it('sound toggle reflects current store.soundEnabled', () => {
    render(<SettingsModal open={true} onClose={() => {}} />);
    const cb = screen.getByLabelText('효과음 사용') as HTMLInputElement;
    expect(cb.checked).toBe(true);
  });

  it('clicking the sound toggle updates store.soundEnabled', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open={true} onClose={() => {}} />);
    const cb = screen.getByLabelText('효과음 사용');
    await user.click(cb);
    expect(useStore.getState().soundEnabled).toBe(false);
    await user.click(cb);
    expect(useStore.getState().soundEnabled).toBe(true);
  });
});
