import { useCallback } from 'react';
import useEventStore from '../store/eventStore';

/**
 * Hook para emitir eventos customizados
 * Facilita a emissão de eventos para sincronização entre componentes
 * 
 * @returns {Object} Objeto com função emit para disparar eventos
 * 
 * @example
 * const { emit } = useEventEmitter();
 * 
 * // Emitir evento quando uma sessão de estudo é criada
 * emit('studySession:created', { sessionId: 123 });
 * 
 * // Emitir evento quando uma revisão é completada
 * emit('revision:completed', { revisionId: 456 });
 */
export const useEventEmitter = () => {
  const emit = useEventStore((state) => state.emit);

  /**
   * Emite um evento
   * @param {string} eventName - Nome do evento
   * @param {*} data - Dados opcionais a serem passados
   */
  const emitEvent = useCallback(
    (eventName, data = null) => {
      emit(eventName, data);
    },
    [emit]
  );

  return {
    emit: emitEvent,
  };
};

export default useEventEmitter;



