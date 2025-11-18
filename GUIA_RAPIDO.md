# 🚀 Guia Rápido - Como Abrir no Navegador

## Passo a Passo

### 1️⃣ Instalar Dependências

Abra o terminal na pasta raiz do projeto e execute:

```bash
npm run install:all
```

Isso instalará as dependências do projeto raiz, backend e frontend.

### 2️⃣ Configurar Banco de Dados

#### 2.1 Criar o banco PostgreSQL

Abra o PostgreSQL e crie o banco:

```sql
CREATE DATABASE ritmo_constante;
```

#### 2.2 Configurar variáveis de ambiente

No diretório `backend`, crie um arquivo `.env`:

```bash
cd backend
copy .env.example .env
```

**No Windows PowerShell:**
```powershell
cd backend
Copy-Item .env.example .env
```

Edite o arquivo `.env` e configure:

```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/ritmo_constante?schema=public"
JWT_SECRET="qualquer_string_secreta_aqui_mude_em_producao"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

**Importante:** Substitua `seu_usuario` e `sua_senha` pelas suas credenciais do PostgreSQL.

### 3️⃣ Configurar o Banco de Dados (Prisma)

Execute as migrations do Prisma:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

Quando perguntar o nome da migration, pressione Enter para usar o padrão.

### 4️⃣ Iniciar os Servidores

#### Opção A: Executar tudo junto (Recomendado)

Na raiz do projeto:

```bash
npm run dev
```

Isso iniciará backend e frontend simultaneamente.

#### Opção B: Executar separadamente

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5️⃣ Abrir no Navegador

Após iniciar os servidores, você verá mensagens como:

```
🚀 Servidor rodando na porta 3001
📡 Ambiente: development
```

E no frontend:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**Abra seu navegador e acesse:**

🌐 **http://localhost:5173**

### 6️⃣ Criar sua Conta

1. Clique em "Não tem uma conta? Cadastre-se"
2. Preencha nome, email e senha
3. Clique em "Criar conta"
4. Você será redirecionado para o Dashboard

## ✅ Verificação

Se tudo estiver funcionando, você verá:

- ✅ Backend rodando na porta 3001
- ✅ Frontend rodando na porta 5173
- ✅ Página de login/cadastro no navegador
- ✅ Sem erros no console

## 🐛 Problemas Comuns

### Erro de conexão com banco

- Verifique se o PostgreSQL está rodando
- Confirme usuário e senha no `.env`
- Verifique se o banco `ritmo_constante` foi criado

### Erro "Cannot find module"

Execute novamente:
```bash
npm run install:all
```

### Porta já em uso

Se a porta 3001 ou 5173 estiver ocupada:
- Feche outros programas usando essas portas
- Ou altere as portas nos arquivos de configuração

### Erro de migration

Se der erro na migration, tente:
```bash
cd backend
npm run prisma:migrate reset
```

## 📝 Próximos Passos

Após fazer login:

1. Vá em **Configurações** e crie suas matérias
2. Crie um **Ciclo de Estudos**
3. Comece a **Registrar Sessões** de estudo
4. Acompanhe suas **Estatísticas** e **Constância**

---

**Dúvidas?** Consulte o `README.md` para mais detalhes!

