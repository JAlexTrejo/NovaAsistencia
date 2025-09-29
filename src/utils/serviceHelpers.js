// src/utils/serviceHelpers.js
import { adaptSupabaseError } from './errors.ts';

/**
 * Standard service response format for Nova HR production hardening
 */
export const createServiceResponse = {
  success: (data) => ({ ok: true, data }),
  error: (error, code) => ({ ok: false, error, code })
};

/**
 * Wraps service functions with standard error handling and response format
 */
export function withServiceErrorHandling(serviceFn) {
  return async (...args) => {
    try {
      const result = await serviceFn(...args);
      return createServiceResponse?.success(result);
    } catch (e) {
      const adaptedError = adaptSupabaseError(e);
      return createServiceResponse?.error(adaptedError?.error, adaptedError?.code);
    }
  };
}

/**
 * Production-ready retry wrapper for idempotent operations
 */
export function withRetry(fn, options = {}) {
  const { retries = 2, factor = 2 } = options;
  
  return async (...args) => {
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) or validation errors
        if (error?.code === 'VALIDATION' || error?.code === 'FORBIDDEN') {
          break;
        }
        
        if (i < retries) {
          const delay = Math.min(1000 * Math.pow(factor, i), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  };
}

/**
 * Validates and sanitizes pagination parameters
 */
export function sanitizePagination(params = {}) {
  const page = Math.max(0, parseInt(params?.page, 10) || 0);
  const pageSize = Math.min(200, Math.max(10, parseInt(params?.pageSize, 10) || 50));
  
  return {
    page,
    pageSize,
    offset: page * pageSize,
    limit: pageSize
  };
}

/**
 * Validates sort parameters against allowed columns
 */
export function sanitizeSorting(params = {}, allowedColumns = []) {
  const { sortBy = 'created_at', sortDir = 'desc' } = params;
  
  const safeColumn = allowedColumns?.includes(sortBy) ? sortBy : 'created_at';
  const safeDirection = ['asc', 'desc']?.includes(sortDir?.toLowerCase()) ? sortDir?.toLowerCase() : 'desc';
  
  return {
    sortBy: safeColumn,
    sortDir: safeDirection,
    ascending: safeDirection === 'asc'
  };
}

/**
 * Sanitizes text input for database queries
 */
export function sanitizeText(input, maxLength = 255) {
  if (!input || typeof input !== 'string') return '';
  return input?.trim()?.slice(0, maxLength);
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex?.test(uuid);
}

/**
 * Production-ready logging for service operations
 */
export function logServiceOperation(operation, details = {}) {
  if (import.meta.env?.PROD) {
    // In production, use proper logging service (Sentry, etc.)
    console.info(`[SERVICE] ${operation}`, details);
  } else {
    // Development logging
    console.log(`[SERVICE] ${operation}`, details);
  }
}
function ok(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: ok is not implemented yet.', args);
  return null;
}

export { ok };
function fail(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: fail is not implemented yet.', args);
  return null;
}

export { fail };
function validateRequired(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: validateRequired is not implemented yet.', args);
  return null;
}

export { validateRequired };
function buildPaginatedQuery(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: buildPaginatedQuery is not implemented yet.', args);
  return null;
}

export { buildPaginatedQuery };
function formatPaginatedResponse(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: formatPaginatedResponse is not implemented yet.', args);
  return null;
}

export { formatPaginatedResponse };
function buildColumnString(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: buildColumnString is not implemented yet.', args);
  return null;
}

export { buildColumnString };