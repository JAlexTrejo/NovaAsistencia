// src/hooks/useQuery.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Pequeño stringify estable para deps sin romper por orden de claves.
 * Útil cuando pasas objetos como params.
 */
function stableStringify(obj) {
  try {
    if (obj == null) return 'null';
    if (typeof obj !== 'object') return String(obj);
    const keys = Object.keys(obj).sort();
    return `{${keys.map(k => `"${k}":${stableStringify(obj[k])}`).join(',')}}`;
  } catch {
    // fallback
    return JSON.stringify(obj);
  }
}

/**
 * useQuery
 * Estándar para consumir servicios con contrato { ok, data } | { ok: false, error, code? }
 *
 * @param {Function} serviceFn   - función async del servicio (p.ej. employeeService.listEmployees)
 * @param {Object}   options
 *   - params         (any)      - parámetros a pasar al servicio
 *   - deps           (array)    - dependencias adicionales que deben disparar el fetch
 *   - enabled        (boolean)  - si false, no ejecuta automáticamente
 *   - immediate      (boolean)  - si true (default), ejecuta al montar (si enabled)
 *   - keepPreviousData (boolean)- si true, no limpia data durante refetch
 *   - select         (fn)       - mapea/transforma la data antes de setear
 *   - onSuccess      (fn)       - callback(data)
 *   - onError        (fn)       - callback(errorObj)
 *   - retry          (number)   - reintentos en errores transitorios (default 0)
 *   - retryDelay     (number)   - base ms para backoff exponencial (default 800)
 *
 * Retorna:
 * { data, error, isLoading, isFetching, isSuccess, isError, status, refetch }
 */
export function useQuery(serviceFn, options = {}) {
  const {
    params,
    deps = [],
    enabled = true,
    immediate = true,
    keepPreviousData = false,
    select,
    onSuccess,
    onError,
    retry = 0,
    retryDelay = 800,
  } = options;

  const paramsKey = useMemo(() => stableStringify(params), [params]);
  const extraDepsKey = useMemo(() => stableStringify(deps), [deps]);

  const mountedRef = useRef(true);
  const runIdRef = useRef(0);

  const [data, setData]       = useState(null);
  const [error, setError]     = useState(null);
  const [status, setStatus]   = useState('idle');     // 'idle' | 'loading' | 'success' | 'error'
  const [isFetching, setFetching] = useState(false);  // true durante refetch (con datos previos)

  const isLoading  = status === 'loading';
  const isSuccess  = status === 'success';
  const isError    = status === 'error';

  const exec = useCallback(async () => {
    if (!enabled || typeof serviceFn !== 'function') return;

    const runId = ++runIdRef.current;

    // Primera carga vs refetch con datos previos
    if (!keepPreviousData || data == null) {
      setStatus('loading');
    } else {
      setFetching(true);
    }
    setError(null);

    const attempt = async (n = 0) => {
      let res;
      try {
        // Soporta servicios con firma (params) o sin params
        res = params !== undefined ? await serviceFn(params) : await serviceFn();

        // Contrato esperado
        if (!res || typeof res !== 'object') {
          throw { message: 'Invalid service response', code: 'CLIENT' };
        }
        if (res.ok !== true) {
          const err = { message: res.error || 'Unknown error', code: res.code || 'UNKNOWN' };
          throw err;
        }

        // select opcional
        const nextData = typeof select === 'function' ? select(res.data) : res.data;

        // Evitar race conditions si hubo un refetch más reciente
        if (!mountedRef.current || runIdRef.current !== runId) return;

        setData(nextData);
        setStatus('success');
        setFetching(false);
        if (typeof onSuccess === 'function') onSuccess(nextData);
      } catch (e) {
        if (!mountedRef.current || runIdRef.current !== runId) return;

        // ¿Reintentar?
        if (n < retry) {
          const delay = retryDelay * Math.pow(2, n); // backoff exponencial
          await new Promise(r => setTimeout(r, delay));
          return attempt(n + 1);
        }

        const errObj = {
          message: e?.message || 'Ocurrió un error. Intenta de nuevo.',
          code: e?.code || 'UNKNOWN',
          raw: e,
        };
        setError(errObj);
        setStatus('error');
        setFetching(false);
        if (typeof onError === 'function') onError(errObj);
      }
    };

    await attempt(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceFn, paramsKey, extraDepsKey, enabled, keepPreviousData, select, onSuccess, onError, retry, retryDelay]);

  // Montaje / desmontaje
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Auto-ejecución
  useEffect(() => {
    if (enabled && immediate) exec();
  }, [enabled, immediate, exec]);

  const refetch = useCallback(() => {
    if (!enabled) return;
    return exec();
  }, [enabled, exec]);

  return {
    data,
    error,
    isLoading,
    isFetching,
    isSuccess,
    isError,
    status,
    refetch,
  };
}
