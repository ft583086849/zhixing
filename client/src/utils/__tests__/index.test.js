
import { formatDate, formatCurrency, validateEmail, validatePhone, storage } from '../utils';

describe('Utils Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-15T10:30:00');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2025-01-15');
      expect(formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2025-01-15 10:30');
    });

    it('should handle invalid date', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid')).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('¥1,234.56');
      expect(formatCurrency(0)).toBe('¥0.00');
    });

    it('should handle invalid amount', () => {
      expect(formatCurrency(null)).toBe('¥0.00');
      expect(formatCurrency('invalid')).toBe('¥0.00');
    });
  });

  describe('validateEmail', () => {
    it('should validate email correctly', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate phone correctly', () => {
      expect(validatePhone('13800138000')).toBe(true);
      expect(validatePhone('1234567890')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });
  });

  describe('storage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should set and get data correctly', () => {
      const testData = { name: 'test', value: 123 };
      storage.set('test', testData);
      expect(storage.get('test')).toEqual(testData);
    });

    it('should return default value when key not found', () => {
      expect(storage.get('nonexistent', 'default')).toBe('default');
    });

    it('should remove data correctly', () => {
      storage.set('test', 'value');
      storage.remove('test');
      expect(storage.get('test')).toBe(null);
    });
  });
});
