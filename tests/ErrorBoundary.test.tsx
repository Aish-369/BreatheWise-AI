// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('renders children while no rendering error has occurred', () => {
    render(
      <ErrorBoundary>
        <p>Healthy workspace</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('Healthy workspace')).toBeTruthy();
    expect(screen.queryByText('Workspace Interrupted')).toBeNull();
  });

  it('shows a safe recovery screen when a child throws during rendering', () => {
    function BrokenChild() {
      throw new Error('Component failed to render');
    }

    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Workspace Interrupted')).toBeTruthy();
    expect(screen.getByText('Component failed to render')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Restore Workspace' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reload Page' })).toBeTruthy();
  });

  it('clears the error state and restores children when recovery succeeds', () => {
    let shouldThrow = true;
    function RecoverableChild() {
      if (shouldThrow) throw new Error('Temporary rendering failure');
      return <p>Workspace recovered</p>;
    }

    render(
      <ErrorBoundary>
        <RecoverableChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Workspace Interrupted')).toBeTruthy();
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Restore Workspace' }));

    expect(screen.getByText('Workspace recovered')).toBeTruthy();
  });

  it('uses a default message when the thrown error has no message', () => {
    expect(ErrorBoundary.getDerivedStateFromError(new Error(''))).toEqual({
      hasError: true,
      errorMessage: 'An unexpected rendering issue occurred.',
    });
  });
});
