import { useCallback } from 'react';
import errorLogger from '../services/errorLogger';
import useToastStore from '../store/toastStore';

/**
 * Hook para facilitar o tratamento de erros em componentes
 * 
 * @returns {Object} Objeto com funções para tratamento de erros
 */
export const useErrorHandler = () => {
  const showError = useToastStore((state) => state.error);

  /**
   * Trata um erro e mostra mensagem ao usuário
   * @param {Error} error - Objeto de erro
   * @param {string} defaultMessage - Mensagem padrão se não houver mensagem no erro
   * @param {Object} context - Contexto adicional para logging
   */
  const handleError = useCallback(
    (error, defaultMessage = 'Ocorreu um erro. Tente novamente.', context = {}) => {
      // Log do erro
      errorLogger.logError(error, {
        ...context,
        component: context.component || 'Unknown',
      });

      // Mostrar mensagem ao usuário
      const message =
        error?.response?.data?.error ||
        error?.message ||
        defaultMessage;

      showError(message);
    },
    [showError]
  );

  /**
   * Wrapper para funções assíncronas que trata erros automaticamente
   * @param {Function} asyncFn - Função assíncrona
   * @param {Object} options - Opções de tratamento
   * @returns {Function} Função wrapper
   */
  const withErrorHandling = useCallback(
    (asyncFn, options = {}) => {
      return async (...args) => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          handleError(error, options.defaultMessage, {
            ...options.context,
            function: asyncFn.name || 'anonymous',
          });

          // Re-throw se especificado
          if (options.rethrow) {
            throw error;
          }
        }
      };
    },
    [handleError]
  );

  return {
    handleError,
    withErrorHandling,
    logError: errorLogger.logError.bind(errorLogger),
    logMessage: errorLogger.logMessage.bind(errorLogger),
    addBreadcrumb: errorLogger.addBreadcrumb.bind(errorLogger),
  };
};

export default useErrorHandler;







