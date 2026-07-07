import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import {
  CallGuardContext,
  CALL_LEAVE_MESSAGE,
  useCallGuard,
} from '../../components/callGuard';

/**
 * Tests for components/callGuard.js — the shared "is a video call active" signal
 * used to warn before in-app navigation drops an ongoing call (FR-11 video
 * call, NFR-04 graceful handling). Verifies the safe no-op fallback when used
 * outside a provider and correct passthrough when a provider value is present.
 */
describe('useCallGuard', () => {
  test('returns a safe no-op guard when used outside a provider', () => {
    const { result } = renderHook(() => useCallGuard());
    expect(result.current.callActiveRef.current).toBe(false);
    // setCallActive is a no-op that must not throw.
    expect(() => result.current.setCallActive(true)).not.toThrow();
  });

  test('returns the provided context value when inside a provider', () => {
    const value = { callActiveRef: { current: true }, setCallActive: () => {} };
    const wrapper = ({ children }) =>
      createElement(CallGuardContext.Provider, { value }, children);
    const { result } = renderHook(() => useCallGuard(), { wrapper });
    expect(result.current.callActiveRef.current).toBe(true);
  });

  test('exposes a human-readable leave-warning message', () => {
    expect(CALL_LEAVE_MESSAGE).toMatch(/video call/i);
    expect(CALL_LEAVE_MESSAGE.length).toBeGreaterThan(0);
  });
});
