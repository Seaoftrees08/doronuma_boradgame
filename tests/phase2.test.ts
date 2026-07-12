import { describe, it, expect } from 'vitest';
import { getActionName } from '../app/lib/i18n';

describe('Phase 2: Action Name Text Updates', () => {
  it('should return correct Japanese action names', () => {
    expect(getActionName('drawTwo')).toBe('2枚引いて終了');
    expect(getActionName('drawOnePlayOne')).toBe('1枚引いて1枚使う');
    expect(getActionName('discardPlayTwo')).toBe('行動カードを1枚捨てて2枚まで使う');
    expect(getActionName('pass')).toBe('パス（何もしない）');
    expect(getActionName('synthesize' as any)).toBe('');
  });
});
