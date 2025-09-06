import { describe, it, expect } from 'vitest';
import {
  computeWeeklyPay,
  computeAguinaldo,
  computeFiniquito,
  calculateDailySalary,
  calculateMonthlySalary,
  formatCurrency,
  PAYROLL_CONSTANTS
} from './payroll.js';

describe('Payroll Calculation Utilities', () => {
  describe('computeWeeklyPay', () => {
    it('should calculate basic weekly pay correctly', () => {
      const result = computeWeeklyPay({
        hourlyRate: 100,
        hours: 40,
        overtimeHours: 0,
        bonuses: [],
        deductions: []
      });

      expect(result?.regularPay)?.toBe(4000);
      expect(result?.overtimePay)?.toBe(0);
      expect(result?.grossPay)?.toBe(4000);
      expect(result?.netPay)?.toBe(4000);
    });

    it('should calculate weekly pay with overtime correctly', () => {
      const result = computeWeeklyPay({
        hourlyRate: 100,
        hours: 40,
        overtimeHours: 10,
        overtimeFactor: 1.5,
        bonuses: [],
        deductions: []
      });

      expect(result?.regularPay)?.toBe(4000);
      expect(result?.overtimePay)?.toBe(1500); // 10 * 100 * 1.5
      expect(result?.grossPay)?.toBe(5500);
      expect(result?.netPay)?.toBe(5500);
    });

    it('should handle bonuses and deductions', () => {
      const result = computeWeeklyPay({
        hourlyRate: 100,
        hours: 40,
        overtimeHours: 0,
        bonuses: [500, 200],
        deductions: [150, 50]
      });

      expect(result?.totalBonuses)?.toBe(700);
      expect(result?.totalDeductions)?.toBe(200);
      expect(result?.grossPay)?.toBe(4700); // 4000 + 700
      expect(result?.netPay)?.toBe(4500); // 4700 - 200
    });

    it('should throw error for invalid inputs', () => {
      expect(() => computeWeeklyPay({ hourlyRate: -100 }))?.toThrow('Hourly rate must be a non-negative number');
      
      expect(() => computeWeeklyPay({ hourlyRate: 100, hours: -10 }))?.toThrow('Hours must be a non-negative number');
    });

    it('should handle edge cases with zero values', () => {
      const result = computeWeeklyPay({
        hourlyRate: 0,
        hours: 0,
        overtimeHours: 0,
        bonuses: [],
        deductions: []
      });

      expect(result?.grossPay)?.toBe(0);
      expect(result?.netPay)?.toBe(0);
    });
  });

  describe('computeAguinaldo', () => {
    it('should calculate basic aguinaldo correctly', () => {
      const result = computeAguinaldo({
        dailySalary: 500,
        daysPerYear: 15,
        tenureYears: 1
      });

      expect(result?.baseDays)?.toBe(15);
      expect(result?.additionalDays)?.toBe(0.5); // 1 year * 0.5
      expect(result?.totalDays)?.toBe(15.5);
      expect(result?.aguinaldoAmount)?.toBe(7750); // 500 * 15.5
    });

    it('should calculate aguinaldo with multiple years of service', () => {
      const result = computeAguinaldo({
        dailySalary: 500,
        daysPerYear: 15,
        tenureYears: 5
      });

      expect(result?.additionalDays)?.toBe(2.5); // 5 years * 0.5
      expect(result?.totalDays)?.toBe(17.5);
      expect(result?.aguinaldoAmount)?.toBe(8750); // 500 * 17.5
    });

    it('should handle partial years correctly', () => {
      const result = computeAguinaldo({
        dailySalary: 500,
        daysPerYear: 15,
        tenureYears: 2.7 // Should use floor(2.7) = 2
      });

      expect(result?.additionalDays)?.toBe(1); // floor(2.7) = 2, 2 * 0.5 = 1
    });

    it('should throw error for invalid daily salary', () => {
      expect(() => computeAguinaldo({ dailySalary: -100 }))?.toThrow('Daily salary must be a non-negative number');
    });
  });

  describe('computeFiniquito', () => {
    it('should calculate finiquito correctly', () => {
      const result = computeFiniquito({
        dailySalary: 500,
        pendingDays: 10,
        vacations: 5,
        vacationBonusPct: 0.25,
        proportionalAguinaldo: 1000
      });

      expect(result?.pendingPay)?.toBe(5000); // 500 * 10
      expect(result?.vacationPay)?.toBe(2500); // 500 * 5
      expect(result?.vacationBonus)?.toBe(625); // 2500 * 0.25
      expect(result?.totalFiniquito)?.toBe(9125); // 5000 + 2500 + 625 + 1000
    });

    it('should handle zero vacation days', () => {
      const result = computeFiniquito({
        dailySalary: 500,
        pendingDays: 10,
        vacations: 0,
        vacationBonusPct: 0.25,
        proportionalAguinaldo: 1000
      });

      expect(result?.vacationPay)?.toBe(0);
      expect(result?.vacationBonus)?.toBe(0);
      expect(result?.totalFiniquito)?.toBe(6000); // 5000 + 0 + 0 + 1000
    });
  });

  describe('calculateDailySalary', () => {
    it('should calculate daily salary correctly', () => {
      const result = calculateDailySalary(100, 8);
      expect(result)?.toBe(800);
    });

    it('should use default hours per day', () => {
      const result = calculateDailySalary(100);
      expect(result)?.toBe(800); // 100 * 8 (default)
    });

    it('should throw error for negative hourly rate', () => {
      expect(() => calculateDailySalary(-100))?.toThrow('Hourly rate must be a non-negative number');
    });
  });

  describe('calculateMonthlySalary', () => {
    it('should calculate monthly salary correctly', () => {
      const result = calculateMonthlySalary(500, 30);
      expect(result)?.toBe(15000);
    });

    it('should use default days per month', () => {
      const result = calculateMonthlySalary(500);
      expect(result)?.toBe(15000); // 500 * 30 (default)
    });
  });

  describe('formatCurrency', () => {
    it('should format Mexican currency correctly', () => {
      const result = formatCurrency(1234.56);
      // Note: This test might be environment-dependent
      expect(result)?.toContain('1,234.56');
    });

    it('should handle zero amounts', () => {
      const result = formatCurrency(0);
      expect(result)?.toContain('0.00');
    });

    it('should handle invalid inputs with fallback', () => {
      const result = formatCurrency('invalid');
      expect(result)?.toBe('$0.00');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(999999.99);
      expect(result)?.toContain('999,999.99');
    });
  });

  describe('PAYROLL_CONSTANTS', () => {
    it('should have correct default values', () => {
      expect(PAYROLL_CONSTANTS?.OVERTIME_FACTOR)?.toBe(1.5);
      expect(PAYROLL_CONSTANTS?.DOUBLE_TIME_FACTOR)?.toBe(2.0);
      expect(PAYROLL_CONSTANTS?.AGUINALDO_DAYS_DEFAULT)?.toBe(15);
      expect(PAYROLL_CONSTANTS?.VACATION_BONUS_PERCENTAGE)?.toBe(0.25);
      expect(PAYROLL_CONSTANTS?.REGULAR_HOURS_WEEKLY)?.toBe(40);
      expect(PAYROLL_CONSTANTS?.REGULAR_HOURS_DAILY)?.toBe(8);
      expect(PAYROLL_CONSTANTS?.TIMEZONE)?.toBe('America/Monterrey');
    });
  });
});