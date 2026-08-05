import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getInitials,
  getStatusLabel,
  getCategoryLabel,
  formatCep,
} from '@/utils/helpers';

describe('formatCurrency', () => {
  it('formats positive number as BRL', () => {
    expect(formatCurrency(1234.56)).toMatch(/R\$/);
    expect(formatCurrency(1234.56)).toContain('1.234,56');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toMatch(/R\$/);
  });

  it('formats negative number', () => {
    const result = formatCurrency(-50);
    expect(result).toMatch(/R\$/);
  });
});

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2026-07-25T12:00:00');
    expect(result).toContain('25');
    expect(result).toContain('07');
    expect(result).toContain('2026');
  });

  it('formats Date object', () => {
    const result = formatDate(new Date(2026, 6, 25, 12, 0, 0));
    expect(result).toContain('25');
  });
});

describe('formatDateTime', () => {
  it('formats ISO datetime string', () => {
    const result = formatDateTime('2026-07-25T14:30:00');
    expect(result).toContain('25');
    expect(result).toContain('14');
    expect(result).toContain('30');
  });
});

describe('getInitials', () => {
  it('returns initials for full name', () => {
    expect(getInitials('João Silva')).toBe('JS');
  });

  it('returns first two initials for long name', () => {
    expect(getInitials('Maria José Santos')).toBe('MJ');
  });

  it('returns single initial for single name', () => {
    expect(getInitials('Pedro')).toBe('P');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });
});

describe('getStatusLabel', () => {
  it('returns Portuguese label for known status', () => {
    expect(getStatusLabel('pending')).toBe('Pendente');
    expect(getStatusLabel('confirmed')).toBe('Confirmado');
    expect(getStatusLabel('completed')).toBe('Concluído');
    expect(getStatusLabel('cancelled')).toBe('Cancelado');
    expect(getStatusLabel('paid')).toBe('Pago');
    expect(getStatusLabel('active')).toBe('Ativo');
  });

  it('returns original string for unknown status', () => {
    expect(getStatusLabel('unknown')).toBe('unknown');
  });
});

describe('getCategoryLabel', () => {
  it('returns Portuguese label for known category', () => {
    expect(getCategoryLabel('beauty')).toBe('Beleza');
    expect(getCategoryLabel('health')).toBe('Saúde');
    expect(getCategoryLabel('fitness')).toBe('Fitness');
    expect(getCategoryLabel('consulting')).toBe('Consultoria');
    expect(getCategoryLabel('education')).toBe('Educação');
    expect(getCategoryLabel('repair')).toBe('Reparo');
    expect(getCategoryLabel('other')).toBe('Outro');
  });

  it('returns original string for unknown category', () => {
    expect(getCategoryLabel('unknown')).toBe('unknown');
  });
});

describe('formatCep', () => {
  it('formats 8-digit CEP with hyphen', () => {
    expect(formatCep('12345678')).toBe('12345-678');
  });

  it('formats CEP with non-digit characters', () => {
    expect(formatCep('123.45-678')).toBe('12345-678');
  });

  it('returns partial CEP for less than 5 digits', () => {
    expect(formatCep('123')).toBe('123');
  });

  it('formats 5-digit CEP without hyphen', () => {
    expect(formatCep('12345')).toBe('12345');
  });

  it('formats 6-digit CEP with hyphen', () => {
    expect(formatCep('123456')).toBe('12345-6');
  });
});
