import React from 'react';
import errorLogger from '../services/errorLogger';

/**
 * Error Boundary para capturar erros de renderização do React
 * 
 * Este componente captura erros que ocorrem durante a renderização,
 * em métodos do ciclo de vida, e em construtores de toda a árvore abaixo dele.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para que a próxima renderização mostre a UI de fallback
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro
    errorLogger.logError(error, {
      type: 'reactErrorBoundary',
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'ErrorBoundary',
    });

    // Salvar informações do erro no state para exibição
    this.setState({
      errorInfo,
    });

    // Chamar callback opcional se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Chamar callback opcional se fornecido
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Renderizar UI de fallback customizada ou padrão
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.handleReset,
        });
      }

      // UI padrão de erro
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Ops! Algo deu errado
            </h1>

            <p className="text-gray-600 text-center mb-6">
              Ocorreu um erro inesperado. Nossa equipe foi notificada e está
              trabalhando para resolver o problema.
            </p>

            {import.meta.env.MODE === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg overflow-auto max-h-64">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Detalhes do erro (apenas em desenvolvimento):
                </p>
                <pre className="text-xs text-red-600 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Tentar novamente
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Recarregar página
              </button>
            </div>

            {this.props.showHomeButton && (
              <button
                onClick={() => (window.location.href = '/')}
                className="mt-3 w-full px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                Voltar para o início
              </button>
            )}
          </div>
        </div>
      );
    }

    // Renderizar children normalmente se não houver erro
    return this.props.children;
  }
}

export default ErrorBoundary;


