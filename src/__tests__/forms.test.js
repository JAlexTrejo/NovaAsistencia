// src/__tests__/forms.test.js
import { describe, it, expect } from 'vitest';

describe('Form Validation', () => {
  describe('Employee Registration Validation', () => {
    const validateEmployeeForm = (data) => {
      const errors = {};
      
      if (!data.fullName || data.fullName.trim().length < 3) {
        errors.fullName = 'El nombre debe tener al menos 3 caracteres';
      }
      
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Email inválido';
      }
      
      if (!data.phone || !/^\+?[0-9]{10,14}$/.test(data.phone.replace(/\s/g, ''))) {
        errors.phone = 'Teléfono inválido (10-14 dígitos)';
      }
      
      if (!data.dailySalary || data.dailySalary < 0) {
        errors.dailySalary = 'El salario debe ser mayor a 0';
      }
      
      return { isValid: Object.keys(errors).length === 0, errors };
    };

    it('should accept valid employee data', () => {
      const validData = {
        fullName: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+525551234567',
        dailySalary: 250,
      };
      
      const result = validateEmployeeForm(validData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject employee with short name', () => {
      const invalidData = {
        fullName: 'AB',
        email: 'test@example.com',
        phone: '+525551234567',
        dailySalary: 250,
      };
      
      const result = validateEmployeeForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.fullName).toBeDefined();
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        fullName: 'Juan Pérez',
        email: 'invalid-email',
        phone: '+525551234567',
        dailySalary: 250,
      };
      
      const result = validateEmployeeForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should reject invalid phone number', () => {
      const invalidData = {
        fullName: 'Juan Pérez',
        email: 'test@example.com',
        phone: '123',
        dailySalary: 250,
      };
      
      const result = validateEmployeeForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.phone).toBeDefined();
    });

    it('should reject negative salary', () => {
      const invalidData = {
        fullName: 'Juan Pérez',
        email: 'test@example.com',
        phone: '+525551234567',
        dailySalary: -100,
      };
      
      const result = validateEmployeeForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.dailySalary).toBeDefined();
    });
  });

  describe('Attendance Check-in Validation', () => {
    const validateCheckIn = (data) => {
      const errors = {};
      
      if (!data.employeeId) {
        errors.employeeId = 'ID de empleado requerido';
      }
      
      if (!data.siteId) {
        errors.siteId = 'ID de sitio requerido';
      }
      
      if (!data.timestamp || isNaN(new Date(data.timestamp).getTime())) {
        errors.timestamp = 'Timestamp inválido';
      }
      
      // GPS validation
      if (data.latitude && (data.latitude < -90 || data.latitude > 90)) {
        errors.latitude = 'Latitud inválida';
      }
      
      if (data.longitude && (data.longitude < -180 || data.longitude > 180)) {
        errors.longitude = 'Longitud inválida';
      }
      
      return { isValid: Object.keys(errors).length === 0, errors };
    };

    it('should accept valid check-in data', () => {
      const validData = {
        employeeId: 'EMP001',
        siteId: 'SITE001',
        timestamp: new Date().toISOString(),
        latitude: 25.6866,
        longitude: -100.3161,
      };
      
      const result = validateCheckIn(validData);
      expect(result.isValid).toBe(true);
    });

    it('should reject check-in without employee ID', () => {
      const invalidData = {
        siteId: 'SITE001',
        timestamp: new Date().toISOString(),
      };
      
      const result = validateCheckIn(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.employeeId).toBeDefined();
    });

    it('should reject invalid GPS coordinates', () => {
      const invalidData = {
        employeeId: 'EMP001',
        siteId: 'SITE001',
        timestamp: new Date().toISOString(),
        latitude: 91, // Invalid (> 90)
        longitude: -200, // Invalid (< -180)
      };
      
      const result = validateCheckIn(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.latitude).toBeDefined();
      expect(result.errors.longitude).toBeDefined();
    });
  });
});
