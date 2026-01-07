# Tratamento de Erros e Logging

Este documento descreve o sistema de tratamento de erros e logging implementado no projeto.

## Componentes Implementados

### 1. Error Boundary (`ErrorBoundary.jsx`)

O Error Boundary captura erros de renderização do React e exibe uma UI de fallback amigável ao usuário.

**Características:**
- Captura erros em componentes filhos
- Exibe mensagem amigável ao usuário
- Mostra detalhes do erro apenas em desenvolvimento
- Opções para tentar novamente ou recarregar a página
- Integrado automaticamente com o sistema de logging

**Uso:**
```jsx
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary name="ComponentName" showHomeButton>
  <YourComponent />
</ErrorBoundary>
```

### 2. Serviço de Logging (`errorLogger.js`)

Serviço centralizado para logging de erros com suporte ao Sentry.

**Características:**
- Suporte ao Sentry (opcional)
- Fallback para console logging
- Captura de erros globais não tratados
- Breadcrumbs para rastreamento
- Contexto de usuário
- Filtragem de informações sensíveis

**Configuração do Sentry:**

1. Crie uma conta em [Sentry.io](https://sentry.io)
2. Crie um novo projeto
3. Copie a DSN do projeto
4. Adicione no arquivo `.env`:
   ```
   VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

**Uso:**
```javascript
import errorLogger from './services/errorLogger';

// Log de erro
errorLogger.logError(error, {
  type: 'customError',
  context: 'additional info'
});

// Log de mensagem
errorLogger.logMessage('Algo aconteceu', 'warning', { context });

// Adicionar breadcrumb
errorLogger.addBreadcrumb('Ação realizada', 'user', { data });

// Definir usuário
errorLogger.setUser({ id: '123', email: 'user@example.com' });
```

### 3. Hook useErrorHandler

Hook React para facilitar o tratamento de erros em componentes.

**Uso:**
```jsx
import { useErrorHandler } from '../hooks/useErrorHandler';

function MyComponent() {
  const { handleError, withErrorHandling } = useErrorHandler();

  const fetchData = async () => {
    try {
      // código que pode gerar erro
    } catch (error) {
      handleError(error, 'Erro ao carregar dados', {
        component: 'MyComponent'
      });
    }
  };

  // Ou usar wrapper automático
  const safeFetchData = withErrorHandling(fetchData, {
    defaultMessage: 'Erro ao carregar dados',
    context: { component: 'MyComponent' }
  });

  return <button onClick={safeFetchData}>Carregar</button>;
}
```

## Integração Automática

### API Client (`client.js`)

O cliente API já está integrado com o sistema de logging:
- Erros de requisição são automaticamente logados
- Breadcrumbs são adicionados para cada requisição com erro
- Contexto completo da requisição é capturado

### Auth Store (`authStore.js`)

O store de autenticação integra automaticamente:
- Define contexto do usuário no Sentry ao fazer login
- Limpa contexto ao fazer logout
- Loga erros de storage

## Erros Globais

O sistema captura automaticamente:
- Erros não tratados (`window.onerror`)
- Promises rejeitadas não tratadas (`unhandledrejection`)
- Erros de renderização do React (via Error Boundary)

## Boas Práticas

1. **Use Error Boundaries** em componentes críticos ou rotas principais
2. **Use o hook useErrorHandler** em componentes funcionais
3. **Adicione contexto** ao logar erros para facilitar debugging
4. **Não logue informações sensíveis** (senhas, tokens completos, etc.)
5. **Use breadcrumbs** para rastrear fluxo de ações do usuário

## Exemplo Completo

```jsx
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorBoundary from '../components/ErrorBoundary';

function DataPage() {
  const { handleError, addBreadcrumb } = useErrorHandler();

  useEffect(() => {
    addBreadcrumb('Página de dados carregada', 'navigation');
  }, []);

  const loadData = async () => {
    try {
      const data = await api.get('/data');
      return data;
    } catch (error) {
      handleError(error, 'Erro ao carregar dados', {
        component: 'DataPage',
        action: 'loadData'
      });
    }
  };

  return (
    <ErrorBoundary name="DataPage">
      {/* conteúdo */}
    </ErrorBoundary>
  );
}
```

## Monitoramento em Produção

Com o Sentry configurado, você terá acesso a:
- Dashboard com todos os erros
- Stack traces completos
- Contexto do usuário e ambiente
- Breadcrumbs de ações
- Session Replay (gravação de sessões com erros)
- Performance monitoring
- Alertas configuráveis

## Desenvolvimento vs Produção

- **Desenvolvimento**: Erros são logados no console e detalhes são exibidos no Error Boundary
- **Produção**: Erros são enviados para Sentry (se configurado) e UI amigável é exibida ao usuário





