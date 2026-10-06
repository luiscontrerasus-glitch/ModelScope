// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Workspace } from '../src/components/workspace';
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('starts graph-first, reveals data on demand and keeps linked selection across collapse', () => {
  render(<Workspace initialExperiment="spring-hooke" />);
  expect(screen.queryByRole('table')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Explain evidence' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /Open data/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Select measurement M01' }));
  fireEvent.click(screen.getByRole('button', { name: /Close data/ }));
  fireEvent.click(screen.getByRole('button', { name: /Open data/ }));
  expect(screen.getByRole('button', { name: 'Select measurement M01' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.change(screen.getByLabelText(/M01 force/), { target: { value: '.4' } });
  expect((screen.getByRole('button', { name: 'Export' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Evidence needs a refresh.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Run analysis/ }));
  expect((screen.getByRole('button', { name: 'Export' }) as HTMLButtonElement).disabled).toBe(false);
});
it('shows exactly one secondary view, supports keyboard tabs, and preserves full findings in the dialog', () => {
  render(<Workspace initialExperiment="spring-hooke" />);
  expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('tab-residuals');
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Residuals' }), { key: 'ArrowRight' });
  expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('tab-comparison');
  expect(screen.getByText('Complete-data baseline')).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: 'Evidence' }));
  fireEvent.click(within(screen.getByRole('complementary')).getByRole('button', { name: /View full evidence/ }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText('DETECTED BY MODELSCOPE')).toBeTruthy();
  expect(within(dialog).getByRole('button', { name: 'Explain evidence' })).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Close evidence' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});
