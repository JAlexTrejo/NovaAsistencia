// src/hooks/useQuery.js
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useServiceQuery(serviceFn, options)
 * - serviceFn: función async del service. Debe retornar:
 *      a) { ok, data, error, code }  ó
 *      b) data cruda (se trata como ok = true)
 *
 * options:
 *  - params: valor o array de valores a pasar a serviceFn
 *  - enabled: boolean (default: true)
 *  - deps: array de dependencias extra para re-ejecutar
 *  - select: (data) => any  (mapeo opcional del resultado)
 *  - keepPreviousData: boolean (mantener datos previos durante fetch)
 *  - retry: number (reintentos ante error de red/idempotentes) default 0
 *  - onSuccess, onError: callbacks
 */

function normalizeError(err) {
  if (!err) return { error: 'Unknown error', code: 'UNKNOWN' };
  if (typeof err === 'string') return { error: err };
  if (err?.error || err?.code) return { error: err?.error || 'Error', code: err?.code };
  return { error: err?.message || 'Unexpected error', code: err?.code };
}

export function useServiceQuery(serviceFn, options = {}) {
  const {
    params,
    enabled = true,
    deps = [],
    select,
    keepPreviousData = false,
    retry = 0,
    onSuccess,
    onError,
  } = options;

  const mountedRef = useRef(true);
  const abortRef = useRef(null);

  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle'); // idle | loading | success | error
  const [isFetching, setIsFetching] = useState(false);

  const callService = useCallback(async () => {
    if (!serviceFn || !enabled) return;

    // Evita superposiciones
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    if (status === 'idle') setStatus('loading');
    else setIsFetching(true);

    let attempts = 0;
    while (attempts <= retry) {
      try {
        const args = Array.isArray(params) ? params : (params !== undefined ? [params] : []);
        const res = await serviceFn(...args);

        if (ac.signal.aborted) return;

        // Soporta contrato { ok, data, error } o data cruda
        let nextData, ok = true, errObj = null;
        if (res && typeof res === 'object' && 'ok' in res) {
          ok = !!res.ok;
          if (ok) nextData = res.data;
          else errObj = normalizeError(res);
        } else {
          nextData = res;
        }

        if (!ok) throw errObj || { error: 'Request failed' };

        const finalData = typeof select === 'function' ? select(nextData) : nextData;

        if (!mountedRef.current) return;
        setError(null);
        // Si keepPreviousData es true, NO limpiamos data al iniciar el fetch;
        // simplemente actualizamos cuando llega la nueva respuesta:
        setData(finalData);
        setStatus('success');
        setIsFetching(false);
        onSuccess && onSuccess(finalData);
        return;
      } catch (e) {
        if (ac.signal.aborted) return;
        const norm = normalizeError(e);
        if (attempts < retry) {
          attempts += 1;
          continue; // reintento
        }
        if (!mountedRef.current) return;
        setError(norm);
        setStatus('error');
        setIsFetching(false);
        onError && onError(norm);
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceFn, enabled, select, keepPreviousData, retry, JSON.stringify(params)]);

  // Efecto principal
  useEffect(() => {
    mountedRef.current = true;
    if (enabled) callService();
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, callService, ...deps]);

  const refetch = useCallback(() => {
    if (!enabled) return;
    return callService();
  }, [enabled, callService]);

  return {
    data,
    error,
    status,
    isLoading: status === 'loading',
    isError: status === 'error',
    isSuccess: status === 'success',
    isFetching,
    refetch,
  };
}

/**
 * Compatibilidad: muchas pantallas importan `{ useQuery }` desde este archivo.
 * Exportamos un alias para no romper esos imports.
 */
export const useQuery = useServiceQuery;

export default useServiceQuery;
