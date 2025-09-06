/**
 * Nova HR Payroll Calculation Utilities
 * Pure functions for accurate payroll calculations following Mexican labor standards
 */

// Constants for Mexican payroll calculations
export const PAYROLL_CONSTANTS = {
  OVERTIME_FACTOR: 1.5,
  DOUBLE_TIME_FACTOR: 2.0,
  AGUINALDO_DAYS_DEFAULT: 15,
  VACATION_BONUS_PERCENTAGE: 0.25, // 25% vacation bonus
  REGULAR_HOURS_WEEKLY: 40,
  REGULAR_HOURS_DAILY: 8,
  TIMEZONE: 'America/Monterrey'
};

/**
 * Calculate weekly pay with overtime and bonuses
 * @param {Object} params - Calculation parameters
 * @param {number} params.hourlyRate - Employee's hourly rate
 * @param {number} params.hours - Regular hours worked
 * @param {number} params.overtimeHours - Overtime hours worked
 * @param {number} params.overtimeFactor - Overtime multiplier (default: 1.5)
 * @param {Array} params.bonuses - Array of bonus amounts
 * @param {Array} params.deductions - Array of deduction amounts
 * @returns {Object} Detailed pay calculation
 */
export const computeWeeklyPay = ({
  hourlyRate = 0,
  hours = 0,
  overtimeHours = 0,
  overtimeFactor = PAYROLL_CONSTANTS?.OVERTIME_FACTOR,
  bonuses = [],
  deductions = []
}) => {
  // Input validation
  if (typeof hourlyRate !== 'number' || hourlyRate < 0) {
    throw new Error('Hourly rate must be a non-negative number');
  }
  
  if (typeof hours !== 'number' || hours < 0) {
    throw new Error('Hours must be a non-negative number');
  }

  if (typeof overtimeHours !== 'number' || overtimeHours < 0) {
    throw new Error('Overtime hours must be a non-negative number');
  }

  // Calculate base components
  const regularPay = hours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * overtimeFactor;
  
  // Calculate bonuses and deductions
  const totalBonuses = bonuses?.reduce((sum, bonus) => sum + (typeof bonus === 'number' ? bonus : 0), 0) || 0;
  const totalDeductions = deductions?.reduce((sum, deduction) => sum + (typeof deduction === 'number' ? deduction : 0), 0) || 0;
  
  // Calculate totals
  const grossPay = regularPay + overtimePay + totalBonuses;
  const netPay = grossPay - totalDeductions;

  return {
    hourlyRate,
    hours,
    overtimeHours,
    regularPay: Math.round(regularPay * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    totalBonuses: Math.round(totalBonuses * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    grossPay: Math.round(grossPay * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
    calculatedAt: new Date()?.toISOString()
  };
};

/**
 * Calculate Aguinaldo (Christmas bonus) according to Mexican labor law
 * @param {Object} params - Calculation parameters
 * @param {number} params.dailySalary - Employee's daily salary
 * @param {number} params.daysPerYear - Aguinaldo days per year (default: 15)
 * @param {number} params.tenureYears - Years of service
 * @returns {Object} Aguinaldo calculation details
 */
export const computeAguinaldo = ({
  dailySalary = 0,
  daysPerYear = PAYROLL_CONSTANTS?.AGUINALDO_DAYS_DEFAULT,
  tenureYears = 1
}) => {
  // Input validation
  if (typeof dailySalary !== 'number' || dailySalary < 0) {
    throw new Error('Daily salary must be a non-negative number');
  }

  if (typeof daysPerYear !== 'number' || daysPerYear < 0) {
    throw new Error('Days per year must be a non-negative number');
  }

  if (typeof tenureYears !== 'number' || tenureYears < 0) {
    throw new Error('Tenure years must be a non-negative number');
  }

  // Calculate aguinaldo
  const baseDays = daysPerYear;
  const additionalDays = Math.floor(tenureYears) * 0.5; // 0.5 additional days per year of service
  const totalDays = baseDays + additionalDays;
  const aguinaldoAmount = dailySalary * totalDays;

  return {
    dailySalary,
    tenureYears,
    baseDays,
    additionalDays: Math.round(additionalDays * 100) / 100,
    totalDays: Math.round(totalDays * 100) / 100,
    aguinaldoAmount: Math.round(aguinaldoAmount * 100) / 100,
    calculatedAt: new Date()?.toISOString()
  };
};

/**
 * Calculate Finiquito (Severance payment) according to Mexican labor law
 * @param {Object} params - Calculation parameters
 * @param {number} params.dailySalary - Employee's daily salary
 * @param {number} params.pendingDays - Pending days to be paid
 * @param {number} params.vacations - Unused vacation days
 * @param {number} params.vacationBonusPct - Vacation bonus percentage (default: 25%)
 * @param {number} params.proportionalAguinaldo - Proportional aguinaldo amount
 * @returns {Object} Finiquito calculation details
 */
export const computeFiniquito = ({
  dailySalary = 0,
  pendingDays = 0,
  vacations = 0,
  vacationBonusPct = PAYROLL_CONSTANTS?.VACATION_BONUS_PERCENTAGE,
  proportionalAguinaldo = 0
}) => {
  // Input validation
  if (typeof dailySalary !== 'number' || dailySalary < 0) {
    throw new Error('Daily salary must be a non-negative number');
  }

  // Calculate components
  const pendingPay = pendingDays * dailySalary;
  const vacationPay = vacations * dailySalary;
  const vacationBonus = vacationPay * vacationBonusPct;
  
  // Calculate total finiquito
  const totalFiniquito = pendingPay + vacationPay + vacationBonus + proportionalAguinaldo;

  return {
    dailySalary,
    pendingDays,
    vacations,
    vacationBonusPct,
    proportionalAguinaldo,
    pendingPay: Math.round(pendingPay * 100) / 100,
    vacationPay: Math.round(vacationPay * 100) / 100,
    vacationBonus: Math.round(vacationBonus * 100) / 100,
    totalFiniquito: Math.round(totalFiniquito * 100) / 100,
    calculatedAt: new Date()?.toISOString()
  };
};

/**
 * Calculate daily salary from hourly rate
 * @param {number} hourlyRate - Hourly rate
 * @param {number} hoursPerDay - Hours per day (default: 8)
 * @returns {number} Daily salary
 */
export const calculateDailySalary = (hourlyRate, hoursPerDay = PAYROLL_CONSTANTS?.REGULAR_HOURS_DAILY) => {
  if (typeof hourlyRate !== 'number' || hourlyRate < 0) {
    throw new Error('Hourly rate must be a non-negative number');
  }
  
  return Math.round(hourlyRate * hoursPerDay * 100) / 100;
};

/**
 * Calculate monthly salary from daily salary
 * @param {number} dailySalary - Daily salary
 * @param {number} daysPerMonth - Days per month (default: 30)
 * @returns {number} Monthly salary
 */
export const calculateMonthlySalary = (dailySalary, daysPerMonth = 30) => {
  if (typeof dailySalary !== 'number' || dailySalary < 0) {
    throw new Error('Daily salary must be a non-negative number');
  }
  
  return Math.round(dailySalary * daysPerMonth * 100) / 100;
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'MXN')
 * @param {string} locale - Locale (default: 'es-MX')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'MXN', locale = 'es-MX') => {
  if (typeof amount !== 'number') {
    return '$0.00';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    })?.format(amount);
  } catch (error) {
    // Fallback formatting
    return `$${amount?.toFixed(2)}`;
  }
};

/**
 * Currency configuration for the application
 */
export const currencyConfig = {
  code: 'MXN',
  symbol: '$',
  locale: 'es-MX',
  timezone: PAYROLL_CONSTANTS?.TIMEZONE
};

// Default export with all utilities
export default {
  computeWeeklyPay,
  computeAguinaldo,
  computeFiniquito,
  calculateDailySalary,
  calculateMonthlySalary,
  formatCurrency,
  currencyConfig,
  PAYROLL_CONSTANTS
};