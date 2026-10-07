import { describe, expect, it } from 'vitest';
import { shouldSubmit } from '../src/ui/input-policy';

describe('Korean IME and Enter handling', () => {
  it.each([
    [{ key: 'Enter', shiftKey: false, isComposing: false, keyCode: 13 }, false, true],
    [{ key: 'Enter', shiftKey: true, isComposing: false, keyCode: 13 }, false, false],
    [{ key: 'Enter', shiftKey: false, isComposing: true, keyCode: 13 }, false, false],
    [{ key: 'Enter', shiftKey: false, isComposing: false, keyCode: 229 }, false, false],
    [{ key: 'Enter', shiftKey: false, isComposing: false, keyCode: 13 }, true, false],
    [{ key: 'a', shiftKey: false, isComposing: false, keyCode: 65 }, false, false],
  ])('handles event %j with composition=%s', (event, composing, expected) => {
    expect(shouldSubmit(event, composing)).toBe(expected);
  });
});
