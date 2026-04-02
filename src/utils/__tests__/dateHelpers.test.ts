import { describe, it, expect } from 'vitest';
import { safeDateFormat, safeDateFormatSimple, isValidDateRange } from '@/utils/dateHelpers';

describe('safeDateFormat', () => {
  it('returns "Fecha no disponible" for null/undefined/empty', () => {
    expect(safeDateFormat(null)).toBe('Fecha no disponible');
    expect(safeDateFormat(undefined)).toBe('Fecha no disponible');
    expect(safeDateFormat('')).toBe('Fecha no disponible');
  });

  it('returns "Fecha inválida" for invalid date strings', () => {
    expect(safeDateFormat('not-a-date')).toBe('Fecha inválida');
    expect(safeDateFormat('abc123')).toBe('Fecha inválida');
  });

  it('formats valid ISO date strings', () => {
    const result = safeDateFormat('2025-01-15');
    expect(result).toBeDefined();
    expect(result).not.toBe('Fecha no disponible');
    expect(result).not.toBe('Fecha inválida');
  });

  it('formats Date objects', () => {
    const date = new Date(2025, 0, 15);
    const result = safeDateFormat(date);
    expect(result).not.toBe('Fecha no disponible');
    expect(result).not.toBe('Fecha inválida');
  });

  it('handles numeric timestamps', () => {
    const timestamp = new Date(2025, 5, 1).getTime();
    const result = safeDateFormat(timestamp);
    expect(result).not.toBe('Fecha no disponible');
  });
});

describe('safeDateFormatSimple', () => {
  it('returns "No disponible" for null/undefined/empty', () => {
    expect(safeDateFormatSimple(null)).toBe('No disponible');
    expect(safeDateFormatSimple(undefined)).toBe('No disponible');
    expect(safeDateFormatSimple('')).toBe('No disponible');
  });

  it('returns "Fecha inválida" for invalid dates', () => {
    expect(safeDateFormatSimple('garbage')).toBe('Fecha inválida');
  });

  it('formats valid dates in dd/mm/yyyy format', () => {
    const result = safeDateFormatSimple('2025-03-15');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('isValidDateRange', () => {
  it('returns false for null/undefined inputs', () => {
    expect(isValidDateRange(null, null)).toBe(false);
    expect(isValidDateRange(undefined, '2025-01-01')).toBe(false);
    expect(isValidDateRange('2025-01-01', null)).toBe(false);
  });

  it('returns false for invalid date strings', () => {
    expect(isValidDateRange('invalid', '2025-01-01')).toBe(false);
    expect(isValidDateRange('2025-01-01', 'invalid')).toBe(false);
  });

  it('returns true when start <= end', () => {
    expect(isValidDateRange('2025-01-01', '2025-01-31')).toBe(true);
    expect(isValidDateRange('2025-01-01', '2025-01-01')).toBe(true);
  });

  it('returns false when start > end', () => {
    expect(isValidDateRange('2025-02-01', '2025-01-01')).toBe(false);
  });
});
