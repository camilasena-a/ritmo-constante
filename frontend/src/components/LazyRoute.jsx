import { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import Loading from './Loading';

/**
 * Componente wrapper para rotas lazy-loaded
 * Combina ErrorBoundary e Suspense para melhor tratamento de erros e loading
 */
export default function LazyRoute({ children, name }) {
  return (
    <ErrorBoundary name={name}>
      <Suspense fallback={<Loading fullScreen />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

