import { useEffect, useRef } from 'react';
import useEventStore from '../store/eventStore';

/**
 * Hook para escutar eventos customizados
 * Facilita a escuta de eventos e reação a mudanças em outros componentes
 * 
 * @param {string|string[]} eventNames - Nome(s) do(s) evento(s) a escutar
 * @param {Function} callback - Função a ser chamada quando o evento for emitido
 * @param {Array} deps - Dependências do useEffect (opcional)
 * 
 * @example
 * // Escutar um único evento
 * useEventListener('studySession:created', () => {
 *   loadData();
 * });
 * 
 * // Escutar múltiplos eventos
 * useEventListener(['studySession:created', 'revision:completed'], () => {
 *   loadData();
 * });
 * 
 * // Com dependências
 * useEventListener('studySession:created', () => {
 *   loadData();
 * }, [loadData]);
 */
export const useEventListener = (eventNames, callback, deps = []) => {
  const on = useEventStore((state) => state.on);
  const off = useEventStore((state) => state.off);
  const callbackRef = useRef(callback);

  // Atualizar a referência do callback quando ele mudar
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Normalizar para array
    const events = Array.isArray(eventNames) ? eventNames : [eventNames];
    
    // Registrar listeners para cada evento
    const unsubscribers = events.map((eventName) => {
      const wrappedCallback = (data) => {
        callbackRef.current(data);
      };
      return on(eventName, wrappedCallback);
    });

    // Cleanup: remover listeners quando o componente desmontar ou dependências mudarem
    return () => {
      unsubscribers.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [eventNames, on, off, ...deps]);
};

export default useEventListener;





