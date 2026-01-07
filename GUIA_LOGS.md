# 📋 Guia de Visualização de Logs

Este guia explica como visualizar os logs do servidor backend para depuração.

## 🎯 Métodos para Visualizar Logs

### Método 1: Script PowerShell (Mais Fácil)

Execute o script que abre o backend em um terminal separado:

```powershell
.\start-backend-only.ps1
```

Isso abrirá uma janela PowerShell dedicada apenas para o backend, onde você verá todos os logs.

### Método 2: Terminal Manual

1. Abra um novo terminal PowerShell
2. Navegue até a pasta do backend:
   ```powershell
   cd backend
   ```
3. Execute o servidor:
   ```powershell
   npm run dev
   ```

### Método 3: Executar Tudo Junto

Se você executou `npm run dev` na raiz do projeto, os logs aparecem no mesmo terminal com prefixos:
- `[0]` = Backend
- `[1]` = Frontend

## 📊 O Que Você Verá nos Logs

Quando o backend iniciar corretamente, você verá:

```
✅ Prisma Client conectado ao banco de dados
🚀 Servidor rodando na porta 3001
📡 Ambiente: development
```

Quando uma requisição for feita, você verá logs como:

```
Verificando usuário padrão...
Usuário padrão encontrado: abc-123-def-456
Buscando matérias para userId: abc-123-def-456
Matérias encontradas: 5
```

Se houver erros, você verá:

```
Erro ao garantir usuário padrão: [detalhes do erro]
Stack: [stack trace completo]
URL: /api/subjects
Method: GET
Body: {}
```

## 🔍 Logs Adicionados para Depuração

Os seguintes logs foram adicionados para facilitar a depuração:

### No Middleware `defaultUser`:
- ✅ Verificação de usuário padrão
- ✅ Criação de usuário padrão (se necessário)
- ❌ Erros ao criar/buscar usuário

### Nas Rotas:
- 📋 Busca de matérias (com userId)
- 📊 Quantidade de matérias encontradas
- ❌ Erros específicos com stack trace

### No Error Handler:
- 🔍 URL da requisição que falhou
- 📝 Método HTTP (GET, POST, etc.)
- 📦 Body da requisição
- 🐛 Stack trace completo do erro

## 🐛 Resolvendo Problemas

### Se você não vê logs:

1. **Verifique se o servidor está rodando:**
   - Acesse: `http://localhost:3001/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

2. **Verifique se há processos Node rodando:**
   ```powershell
   Get-Process node
   ```

3. **Reinicie o servidor:**
   - Pare o servidor (Ctrl+C)
   - Execute novamente: `npm run dev`

### Se você vê erros:

1. **Copie o erro completo** do console
2. **Verifique a mensagem de erro** e o stack trace
3. **Verifique os logs anteriores** para entender o contexto

## 💡 Dicas

- **Use terminais separados** para backend e frontend quando depurando
- **Mantenha o terminal do backend visível** para ver os logs em tempo real
- **Procure por mensagens de erro** que começam com `❌` ou `Erro:`
- **Verifique o stack trace** para identificar a linha exata do problema

## 📝 Exemplo de Logs de Sucesso

```
✅ Prisma Client conectado ao banco de dados
🚀 Servidor rodando na porta 3001
📡 Ambiente: development
Verificando usuário padrão...
Usuário padrão encontrado: 123e4567-e89b-12d3-a456-426614174000
Buscando matérias para userId: 123e4567-e89b-12d3-a456-426614174000
Matérias encontradas: 3
```

## 📝 Exemplo de Logs de Erro

```
Erro ao garantir usuário padrão: PrismaClientKnownRequestError
Tipo do erro: PrismaClientKnownRequestError
Mensagem: Invalid `prisma.user.findFirst()` invocation
Stack: [stack trace completo]
```

















