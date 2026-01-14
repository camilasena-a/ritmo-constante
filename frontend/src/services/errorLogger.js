/**
 * Serviço centralizado de logging de erros
 * Suporta Sentry e fallback para console
 */

class ErrorLogger {
  constructor() {
    this.sentry = null;
    this.isSentryInitialized = false;
    this.initSentry();
  }

  /**
   * Inicializa o Sentry se a DSN estiver configurada
   */
  initSentry() {
    try {
      // Verifica se o Sentry está disponível e se há uma DSN configurada
      const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
      
      if (sentryDsn && typeof window !== 'undefined') {
        // Importação dinâmica do Sentry
        import('@sentry/react').then((SentryModule) => {
          // @sentry/react usa named exports
          const { init, browserTracingIntegration, replayIntegration, captureException, captureMessage, setUser, addBreadcrumb } = SentryModule;
          
          init({
            dsn: sentryDsn,
            integrations: [
              browserTracingIntegration(),
              replayIntegration({
                maskAllText: true,
                blockAllMedia: true,
              }),
            ],
            // Performance Monitoring
            tracesSampleRate: 1.0, // 100% em desenvolvimento, ajustar para produção (ex: 0.1 = 10%)
            // Session Replay
            replaysSessionSampleRate: 0.1, // 10% das sessões
            replaysOnErrorSampleRate: 1.0, // 100% das sessões com erros
            environment: import.meta.env.MODE || 'development',
            beforeSend(event, hint) {
              // Filtrar informações sensíveis antes de enviar
              if (event.request) {
                delete event.request.cookies;
                delete event.request.headers?.Authorization;
              }
              return event;
            },
          });

          // Armazenar métodos do Sentry
          this.sentry = {
            captureException,
            captureMessage,
            setUser,
            addBreadcrumb,
          };
          this.isSentryInitialized = true;
          console.log('Sentry inicializado com sucesso');
        }).catch((error) => {
          console.warn('Erro ao inicializar Sentry:', error);
        });
      } else {
        console.log('Sentry não configurado. Usando logging local.');
      }
    } catch (error) {
      console.warn('Erro ao inicializar Sentry:', error);
    }
  }

  /**
   * Registra um erro
   * @param {Error} error - Objeto de erro
   * @param {Object} context - Contexto adicional do erro
   */
  logError(error, context = {}) {
    const errorInfo = {
      message: error?.message || 'Erro desconhecido',
      stack: error?.stack,
      name: error?.name,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    };

    // Log no console em desenvolvimento
    if (import.meta.env.MODE === 'development') {
      console.error('Erro capturado:', errorInfo);
    }

    // Enviar para Sentry se disponível
    if (this.isSentryInitialized && this.sentry?.captureException) {
      try {
        this.sentry.captureException(error, {
          contexts: {
            custom: context,
          },
          tags: {
            errorType: error?.name || 'Unknown',
            ...(context.tags || {}),
          },
          extra: {
            ...context,
          },
        });
      } catch (sentryError) {
        console.error('Erro ao enviar para Sentry:', sentryError);
      }
    }

    // Em produção sem Sentry, você pode enviar para um endpoint próprio
    if (import.meta.env.MODE === 'production' && !this.isSentryInitialized) {
      this.sendToCustomEndpoint(errorInfo).catch((err) => {
        console.error('Erro ao enviar log para endpoint customizado:', err);
      });
    }
  }

  /**
   * Registra uma mensagem de erro
   * @param {string} message - Mensagem de erro
   * @param {Object} context - Contexto adicional
   */
  logMessage(message, level = 'error', context = {}) {
    const logInfo = {
      message,
      level,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    };

    // Log no console
    console[level]('Log:', logInfo);

    // Enviar para Sentry se disponível
    if (this.isSentryInitialized && this.sentry?.captureMessage) {
      try {
        this.sentry.captureMessage(message, {
          level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
          contexts: {
            custom: context,
          },
          extra: context,
        });
      } catch (sentryError) {
        console.error('Erro ao enviar mensagem para Sentry:', sentryError);
      }
    }
  }

  /**
   * Adiciona contexto do usuário ao Sentry
   * @param {Object} user - Informações do usuário
   */
  setUser(user) {
    if (this.isSentryInitialized && this.sentry?.setUser) {
      try {
        this.sentry.setUser({
          id: user?.id,
          email: user?.email,
          username: user?.username,
          // Não incluir informações sensíveis como senha
        });
      } catch (error) {
        console.error('Erro ao definir usuário no Sentry:', error);
      }
    }
  }

  /**
   * Limpa o contexto do usuário
   */
  clearUser() {
    if (this.isSentryInitialized && this.sentry?.setUser) {
      try {
        this.sentry.setUser(null);
      } catch (error) {
        console.error('Erro ao limpar usuário no Sentry:', error);
      }
    }
  }

  /**
   * Adiciona breadcrumb (rastro de ações)
   * @param {string} message - Mensagem do breadcrumb
   * @param {string} category - Categoria do breadcrumb
   * @param {Object} data - Dados adicionais
   */
  addBreadcrumb(message, category = 'custom', data = {}) {
    if (this.isSentryInitialized && this.sentry?.addBreadcrumb) {
      try {
        this.sentry.addBreadcrumb({
          message,
          category,
          level: 'info',
          data,
          timestamp: Date.now() / 1000,
        });
      } catch (error) {
        console.error('Erro ao adicionar breadcrumb:', error);
      }
    }
  }

  /**
   * Envia erro para endpoint customizado (fallback quando Sentry não está disponível)
   * @param {Object} errorInfo - Informações do erro
   */
  async sendToCustomEndpoint(errorInfo) {
    try {
      // Determinar a URL base da API (mesma lógica do client.js)
      const getApiBaseURL = () => {
        if (import.meta.env.DEV) {
          return '/api';
        }
        const apiUrl = import.meta.env.VITE_API_URL;
        return apiUrl || '/api';
      };
      
      // Você pode implementar um endpoint próprio aqui
      // Por exemplo, enviar para seu backend
      const apiBaseURL = getApiBaseURL();
      const response = await fetch(`${apiBaseURL}/logs/error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorInfo),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      // Silenciosamente falha se o endpoint não estiver disponível
      console.warn('Endpoint de logs não disponível:', error);
    }
  }

  /**
   * Captura erros não tratados globalmente
   */
  setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // Erros não capturados
    window.addEventListener('error', (event) => {
      this.logError(event.error || new Error(event.message), {
        type: 'unhandledError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Promises rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        {
          type: 'unhandledRejection',
          promise: event.promise,
        }
      );
    });
  }
}

// Exportar instância singleton
const errorLogger = new ErrorLogger();

// Configurar handlers globais
if (typeof window !== 'undefined') {
  errorLogger.setupGlobalErrorHandlers();
}

export default errorLogger;

