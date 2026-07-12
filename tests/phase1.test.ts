import { describe, it, expect } from 'vitest';
import { isCounterCard, canUseCounterCard } from '@doronuma/shared';

describe('Phase 1: Counter Card Validations', () => {
  describe('isCounterCard', () => {
    it('should return true for counter cards', () => {
      expect(isCounterCard('Nullify')).toBe(true);
      expect(isCounterCard('Deflect')).toBe(true);
      expect(isCounterCard('DoubleBack')).toBe(true);
      expect(isCounterCard('Repel')).toBe(true);
    });

    it('should return false for other action cards', () => {
      expect(isCounterCard('GainOne')).toBe(false);
      expect(isCounterCard('Harassment')).toBe(false);
      expect(isCounterCard('Plunder')).toBe(false);
      expect(isCounterCard('SuddenDeath')).toBe(false);
    });
  });

  describe('canUseCounterCard', () => {
    it('should allow counter cards to target sabotage cards', () => {
      expect(canUseCounterCard('Nullify', 'Harassment')).toBe(true);
      expect(canUseCounterCard('Deflect', 'Barrage')).toBe(true);
      expect(canUseCounterCard('DoubleBack', 'Accomplice')).toBe(true);
      expect(canUseCounterCard('Repel', 'QuagmireDrag')).toBe(true);
    });

    it('should not allow counter cards to target non-sabotage cards', () => {
      expect(canUseCounterCard('Nullify', 'GainOne')).toBe(false);
      expect(canUseCounterCard('Nullify', 'Plunder')).toBe(false);
      expect(canUseCounterCard('Deflect', 'SuddenDeath')).toBe(false);
    });

    it('should not allow non-counter cards to act as counter', () => {
      expect(canUseCounterCard('GainOne', 'Harassment')).toBe(false);
      expect(canUseCounterCard('Harassment', 'Harassment')).toBe(false);
    });
  });
});
