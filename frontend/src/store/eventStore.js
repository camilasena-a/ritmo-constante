import { create } from 'zustand';

/**
 * Store de eventos customizados para sincronização entre componentes
 * Permite que componentes emitam eventos e outros componentes escutem e reajam
 */
const useEventStore = create((set, get) => {
  // Map de eventos: { eventName: Set<listeners> }
  const listeners = new Map();

  return {
    /**
     * Registra um listener para um evento
     * @param {string} eventName - Nome do evento
     * @param {Function} callback - Função a ser chamada quando o evento for emitido
     * @returns {Function} Função para remover o listener
     */
    on: (eventName, callback) => {
      if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set());
      }
      listeners.get(eventName).add(callback);

      // Retorna função para remover o listener
      return () => {
        const eventListeners = listeners.get(eventName);
        if (eventListeners) {
          eventListeners.delete(callback);
          if (eventListeners.size === 0) {
            listeners.delete(eventName);
          }
        }
      };
    },

    /**
     * Remove um listener específico
     * @param {string} eventName - Nome do evento
     * @param {Function} callback - Função do listener a ser removida
     */
    off: (eventName, callback) => {
      const eventListeners = listeners.get(eventName);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          listeners.delete(eventName);
        }
      }
    },

    /**
     * Emite um evento para todos os listeners registrados
     * @param {string} eventName - Nome do evento
     * @param {*} data - Dados a serem passados para os listeners
     */
    emit: (eventName, data = null) => {
      const eventListeners = listeners.get(eventName);
      if (eventListeners) {
        // Criar uma cópia do Set para evitar problemas se listeners forem removidos durante a iteração
        const listenersCopy = Array.from(eventListeners);
        listenersCopy.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Erro ao executar listener do evento "${eventName}":`, error);
          }
        });
      }
    },

    /**
     * Remove todos os listeners de um evento específico
     * @param {string} eventName - Nome do evento
     */
    removeAllListeners: (eventName) => {
      listeners.delete(eventName);
    },

    /**
     * Remove todos os listeners de todos os eventos
     */
    clear: () => {
      listeners.clear();
    },
  };
});

export default useEventStore;





