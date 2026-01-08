# Sistema de Eventos Customizados

Este documento descreve o sistema de eventos customizados implementado para sincronização de estado entre componentes.

## Visão Geral

O sistema de eventos permite que componentes se comuniquem de forma desacoplada. Quando um componente realiza uma ação que afeta dados compartilhados, ele emite um evento. Outros componentes que precisam reagir a essas mudanças podem escutar esses eventos e atualizar seus dados automaticamente.

## Arquitetura

O sistema é composto por três partes principais:

1. **eventStore.js** - Store Zustand que gerencia os eventos e listeners
2. **useEventEmitter** - Hook para emitir eventos
3. **useEventListener** - Hook para escutar eventos

## Uso Básico

### Emitindo Eventos

Use o hook `useEventEmitter` para emitir eventos:

```jsx
import { useEventEmitter } from '../hooks/useEventEmitter';

function MyComponent() {
  const { emit } = useEventEmitter();

  const handleAction = async () => {
    // Realizar ação...
    await api.create(data);
    
    // Emitir evento para notificar outros componentes
    emit('resource:created', { resource: data });
  };
}
```

### Escutando Eventos

Use o hook `useEventListener` para escutar eventos:

```jsx
import { useEventListener } from '../hooks/useEventListener';

function MyComponent() {
  const loadData = async () => {
    // Carregar dados...
  };

  useEffect(() => {
    loadData();
  }, []);

  // Escutar eventos e recarregar dados quando necessário
  useEventListener(
    ['resource:created', 'resource:updated'],
    () => {
      loadData();
    }
  );
}
```

### Escutando Múltiplos Eventos

Você pode escutar múltiplos eventos passando um array:

```jsx
useEventListener(
  [
    'studySession:created',
    'revision:completed',
    'subject:created',
  ],
  () => {
    loadData();
  }
);
```

## Eventos Disponíveis

### Sessões de Estudo
- `studySession:created` - Emitido quando uma nova sessão de estudo é criada
  - Dados: `{ session, formData }`

### Revisões
- `revision:completed` - Emitido quando uma revisão é marcada como concluída
  - Dados: `{ revisionId }`

### Ciclos de Estudo
- `studyCycle:created` - Emitido quando um novo ciclo é criado
  - Dados: `{ cycle }`
- `studyCycle:updated` - Emitido quando um ciclo é atualizado
  - Dados: `{ cycle }` ou `{ cycleId }`
- `studyCycle:advanced` - Emitido quando um ciclo avança para o próximo item
  - Dados: `{ cycleId }`

### Matérias
- `subject:created` - Emitido quando uma nova matéria é criada
  - Dados: `{ subject }`
- `subject:updated` - Emitido quando uma matéria é atualizada
  - Dados: `{ subject }`
- `subject:deleted` - Emitido quando uma matéria é deletada
  - Dados: `{ subjectId }`

### Editais
- `examOutline:created` - Emitido quando um novo edital é criado
  - Dados: `{ outline }`

## Exemplos de Integração

### Dashboard

O Dashboard escuta múltiplos eventos para manter os dados atualizados:

```jsx
useEventListener(
  [
    'studySession:created',
    'revision:completed',
    'studyCycle:updated',
    'studyCycle:advanced',
    'subject:created',
    'subject:updated',
    'subject:deleted',
  ],
  () => {
    loadData();
  }
);
```

### Statistics

A página de estatísticas escuta eventos relacionados a sessões e revisões:

```jsx
useEventListener(
  [
    'studySession:created',
    'revision:completed',
    'subject:created',
    'subject:updated',
    'subject:deleted',
  ],
  () => {
    loadData();
  },
  [period] // Dependências do useEffect
);
```

## Boas Práticas

1. **Nomes de Eventos**: Use o padrão `resource:action` (ex: `studySession:created`)
2. **Dados do Evento**: Sempre inclua informações relevantes no payload do evento
3. **Cleanup**: O hook `useEventListener` faz cleanup automaticamente quando o componente desmonta
4. **Dependências**: Passe dependências relevantes como terceiro parâmetro se necessário
5. **Performance**: Evite escutar muitos eventos desnecessariamente - seja específico sobre quais eventos são relevantes

## Benefícios

1. **Desacoplamento**: Componentes não precisam conhecer uns aos outros diretamente
2. **Sincronização Automática**: Dados são atualizados automaticamente em todas as páginas relevantes
3. **Manutenibilidade**: Fácil adicionar novos listeners sem modificar componentes existentes
4. **Testabilidade**: Eventos podem ser testados isoladamente

## Limitações

- Eventos são locais à aplicação (não persistem entre sessões)
- Não há garantia de ordem de execução dos listeners
- Listeners são executados de forma síncrona

## Troubleshooting

### Evento não está sendo disparado

1. Verifique se o componente está usando `useEventEmitter` corretamente
2. Confirme que o nome do evento está correto
3. Verifique se há erros no console que possam estar impedindo a execução

### Listener não está reagindo

1. Verifique se o hook `useEventListener` está sendo chamado
2. Confirme que os nomes dos eventos correspondem
3. Verifique se há dependências que precisam ser incluídas
4. Verifique se o componente ainda está montado quando o evento é emitido



