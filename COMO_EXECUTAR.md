# 🚀 Como Executar os Scripts

## Método 1: PowerShell (Recomendado)

### Passo a Passo:

1. **Abra o PowerShell:**
   - Pressione `Win + X` e escolha "Windows PowerShell" ou "Terminal"
   - Ou pesquise "PowerShell" no menu Iniciar

2. **Navegue até a pasta do projeto:**
   ```powershell
   cd "C:\Users\user\Documents\Repositorios\ritmo-constante"
   ```
   
   **Dica:** Você também pode:
   - Digitar `cd ` (com espaço no final)
   - Arrastar a pasta do projeto para o PowerShell
   - Pressionar Enter

3. **Execute o script:**
   ```powershell
   .\start-backend-only.ps1
   ```

4. **Uma nova janela PowerShell será aberta** com o backend rodando e mostrando os logs!

---

## Método 2: Explorador de Arquivos

1. Abra o **Explorador de Arquivos** (Win + E)
2. Navegue até: `C:\Users\user\Documents\Repositorios\ritmo-constante`
3. Clique com o **botão direito** no arquivo `start-backend-only.ps1`
4. Selecione **"Executar com PowerShell"**

---

## Método 3: Terminal Integrado do VS Code / Cursor

Se você está usando VS Code ou Cursor:

1. Abra o terminal integrado: `` Ctrl + ` ``
2. Certifique-se de que está na pasta raiz do projeto
3. Execute:
   ```powershell
   .\start-backend-only.ps1
   ```

---

## 📋 Scripts Disponíveis

### `start-backend-only.ps1`
Inicia apenas o backend em um terminal separado.
**Útil para:** Ver logs do backend e depuração

### `start-dev.ps1`
Inicia backend e frontend em terminais separados.
**Útil para:** Desenvolvimento completo com logs separados

### `start.ps1`
Inicia backend e frontend (versão original).

---

## ⚠️ Solução de Problemas

### Erro: "não pode ser carregado porque a execução de scripts está desabilitada"

Execute no PowerShell (como Administrador):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Depois tente executar o script novamente.

### O script não abre uma nova janela

Certifique-se de que está executando o script corretamente:
- Use `.\start-backend-only.ps1` (com `.\` no início)
- Não use `start-backend-only.ps1` sem o `.\`

### Não consigo ver os logs

1. Verifique se uma nova janela PowerShell foi aberta
2. Procure por uma janela com título relacionado ao PowerShell
3. A janela deve mostrar os logs do servidor

---

## ✅ Verificação Rápida

Após executar o script, você deve ver:

1. **Uma nova janela PowerShell** aberta
2. **Logs como:**
   ```
   🔧 Backend - Logs do servidor
   📍 Porta: 3001
   🌐 Health Check: http://localhost:3001/health
   
   ✅ Prisma Client conectado ao banco de dados
   🚀 Servidor rodando na porta 3001
   📡 Ambiente: development
   ```

3. **Para testar se está funcionando:**
   - Abra o navegador
   - Acesse: `http://localhost:3001/health`
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

---

## 💡 Dicas

- **Mantenha a janela do backend visível** para ver os logs em tempo real
- **Não feche a janela** enquanto estiver desenvolvendo
- **Use Ctrl+C** na janela do backend para parar o servidor
- **Recarregue a página** (F5) para ver novos logs aparecerem















