# Exemplo Prático: Migrando para useErrorHandler

Este documento mostra como migrar código existente para usar o novo sistema de tratamento de erros.

## Antes (Código Antigo)

```jsx
import { useState, useEffect } from 'react';
import { statisticsApi } from '../api/statistics';
import useToastStore from '../store/toastStore';

function Statistics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await statisticsApi.getOverview('week');
      setData(result);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      useToastStore.getState().error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* conteúdo */}
    </div>
  );
}
```

## Depois (Código Melhorado)

```jsx
import { useState, useEffect } from 'react';
import { statisticsApi } from '../api/statistics';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorBoundary from '../components/ErrorBoundary';

function Statistics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { handleError, addBreadcrumb } = useErrorHandler();

  useEffect(() => {
    addBreadcrumb('Página de estatísticas carregada', 'navigation');
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await statisticsApi.getOverview('week');
      setData(result);
      addBreadcrumb('Dados de estatísticas carregados', 'data', {
        period: 'week'
      });
    } catch (error) {
      handleError(error, 'Erro ao carregar dados', {
        component: 'Statistics',
        action: 'loadData',
        period: 'week'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary name="Statistics">
      <div>
        {/* conteúdo */}
      </div>
    </ErrorBoundary>
  );
}
```

## Benefícios da Migração

1. **Logging Automático**: Erros são automaticamente logados com contexto completo
2. **Rastreamento**: Breadcrumbs permitem rastrear o fluxo de ações
3. **Sentry Integration**: Se configurado, erros são enviados automaticamente
4. **Error Boundary**: Proteção adicional contra erros de renderização
5. **Consistência**: Todos os erros seguem o mesmo padrão de tratamento

## Migração Passo a Passo

1. **Importar o hook**:
   ```jsx
   import { useErrorHandler } from '../hooks/useErrorHandler';
   ```

2. **Usar o hook no componente**:
   ```jsx
   const { handleError, addBreadcrumb } = useErrorHandler();
   ```

3. **Substituir console.error por handleError**:
   ```jsx
   // Antes
   catch (error) {
     console.error('Erro:', error);
     useToastStore.getState().error('Mensagem');
   }

   // Depois
   catch (error) {
     handleError(error, 'Mensagem', {
       component: 'ComponentName',
       action: 'actionName'
     });
   }
   ```

4. **Adicionar breadcrumbs em ações importantes**:
   ```jsx
   addBreadcrumb('Ação realizada', 'user', { data });
   ```

5. **Envolver componente com ErrorBoundary** (opcional, mas recomendado):
   ```jsx
   <ErrorBoundary name="ComponentName">
     {/* conteúdo */}
   </ErrorBoundary>
   ```

## Exemplo Completo com Múltiplas Ações

```jsx
import { useState } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorBoundary from '../components/ErrorBoundary';
import { api } from '../api/client';

function DataManagement() {
  const { handleError, withErrorHandling, addBreadcrumb } = useErrorHandler();
  const [data, setData] = useState([]);

  // Opção 1: Tratamento manual
  const loadData = async () => {
    try {
      addBreadcrumb('Iniciando carregamento de dados', 'data');
      const result = await api.get('/data');
      setData(result.data);
      addBreadcrumb('Dados carregados com sucesso', 'data', {
        count: result.data.length
      });
    } catch (error) {
      handleError(error, 'Erro ao carregar dados', {
        component: 'DataManagement',
        action: 'loadData'
      });
    }
  };

  // Opção 2: Usando wrapper automático
  const deleteItem = withErrorHandling(
    async (id) => {
      addBreadcrumb('Deletando item', 'user', { id });
      await api.delete(`/data/${id}`);
      setData(prev => prev.filter(item => item.id !== id));
      addBreadcrumb('Item deletado', 'user', { id });
    },
    {
      defaultMessage: 'Erro ao deletar item',
      context: {
        component: 'DataManagement',
        action: 'deleteItem'
      }
    }
  );

  return (
    <ErrorBoundary name="DataManagement">
      <div>
        <button onClick={loadData}>Carregar</button>
        {data.map(item => (
          <button key={item.id} onClick={() => deleteItem(item.id)}>
            Deletar {item.id}
          </button>
        ))}
      </div>
    </ErrorBoundary>
  );
}
```

## Checklist de Migração

- [ ] Importar `useErrorHandler`
- [ ] Substituir `console.error` por `handleError`
- [ ] Adicionar contexto relevante aos logs
- [ ] Adicionar breadcrumbs em ações importantes
- [ ] Envolver componente com `ErrorBoundary` (opcional)
- [ ] Testar tratamento de erros
- [ ] Verificar logs no console/Sentry


