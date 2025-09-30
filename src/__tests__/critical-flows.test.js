// src/__tests__/critical-flows.test.js
import { describe, it, expect } from 'vitest';
import { 
  computeWeeklyPay, 
  computeAguinaldo, 
  computeFiniquito 
} from '../utils/payroll';

describe('Critical Business Logic', () => {
  describe('Payroll Calculations', () => {
    it('should calculate weekly payroll correctly', () => {
      const result = computeWeeklyPay({
        hourlyRate: 31.25, // 250/8 hours per day
        hours: 48, // 6 days * 8 hours
        overtimeHours: 0,
        bonuses: [],
        deductions: []
      });
      
      // 48 hours * 31.25 = 1500
      expect(result.grossPay).toBe(1500);
      expect(result.netPay).toBe(1500);
    });

    it('should calculate overtime at 1.5x rate', () => {
      const result = computeWeeklyPay({
        hourlyRate: 30,
        hours: 40,
        overtimeHours: 5,
        bonuses: [],
        deductions: []
      });
      
      // Base: 40 * 30 = 1200, OT: 5 * 30 * 1.5 = 225
      expect(result.regularPay).toBe(1200);
      expect(result.overtimePay).toBe(225);
      expect(result.grossPay).toBe(1425);
    });

    it('should apply deductions correctly', () => {
      const result = computeWeeklyPay({
        hourlyRate: 30,
        hours: 40,
        overtimeHours: 0,
        bonuses: [],
        deductions: [500]
      });
      
      expect(result.grossPay).toBe(1200);
      expect(result.totalDeductions).toBe(500);
      expect(result.netPay).toBe(700);
    });

    it('should add bonuses to gross pay', () => {
      const result = computeWeeklyPay({
        hourlyRate: 30,
        hours: 40,
        overtimeHours: 0,
        bonuses: [500, 300],
        deductions: []
      });
      
      expect(result.regularPay).toBe(1200);
      expect(result.totalBonuses).toBe(800);
      expect(result.grossPay).toBe(2000);
    });
  });

  describe('Aguinaldo Calculation', () => {
    it('should calculate aguinaldo for 1 year of service', () => {
      const result = computeAguinaldo({
        dailySalary: 300,
        daysPerYear: 15,
        tenureYears: 1
      });
      
      // 15 días base + 0.5 adicionales = 15.5 días * 300 = 4650
      expect(result.baseDays).toBe(15);
      expect(result.aguinaldoAmount).toBe(4650);
    });

    it('should calculate aguinaldo with additional days for tenure', () => {
      const result = computeAguinaldo({
        dailySalary: 300,
        daysPerYear: 15,
        tenureYears: 5
      });
      
      // 15 días base + (5 * 0.5) adicionales = 17.5 días * 300 = 5250
      expect(result.baseDays).toBe(15);
      expect(result.additionalDays).toBe(2.5);
      expect(result.totalDays).toBe(17.5);
      expect(result.aguinaldoAmount).toBe(5250);
    });
  });

  describe('Finiquito Calculation', () => {
    it('should calculate finiquito with all components', () => {
      const result = computeFiniquito({
        dailySalary: 300,
        pendingDays: 5,
        vacations: 6,
        vacationBonusPct: 0.25,
        proportionalAguinaldo: 1500
      });
      
      // Pending: 5 * 300 = 1500
      // Vacations: 6 * 300 = 1800
      // Vacation bonus: 1800 * 0.25 = 450
      // Aguinaldo: 1500
      // Total: 1500 + 1800 + 450 + 1500 = 5250
      expect(result.pendingPay).toBe(1500);
      expect(result.vacationPay).toBe(1800);
      expect(result.vacationBonus).toBe(450);
      expect(result.proportionalAguinaldo).toBe(1500);
      expect(result.totalFiniquito).toBe(5250);
    });

    it('should handle no pending days', () => {
      const result = computeFiniquito({
        dailySalary: 300,
        pendingDays: 0,
        vacations: 6,
        vacationBonusPct: 0.25,
        proportionalAguinaldo: 1500
      });
      
      expect(result.pendingPay).toBe(0);
      // Vacations + bonus + aguinaldo = 1800 + 450 + 1500 = 3750
      expect(result.totalFiniquito).toBe(3750);
    });
  });
});
