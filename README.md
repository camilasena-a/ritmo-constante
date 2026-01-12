# Ritmo Constante - Plataforma de Acompanhamento de Estudos

Plataforma web completa para organização, gerenciamento e acompanhamento de rotina de estudos para concursos e provas em geral.

## 🚀 Funcionalidades

- ✅ **Ciclo de Estudos Personalizável** - Crie ciclos com matérias, pesos e metas
- ✅ **Controle de Revisões** - Sistema de revisões configuráveis (24h, 7 dias, 30 dias)
- ✅ **Quadro Semanal** - Planejamento e visualização semanal de estudos
- ✅ **Estatísticas Detalhadas** - Gráficos e relatórios de desempenho
- ✅ **Linha de Constância** - Acompanhamento diário estilo GitHub contributions
- ✅ **Edital Verticalizado** - Acompanhamento de progresso por disciplina
- ✅ **Dashboard Central** - Visão geral do progresso
- ✅ **Autenticação JWT** - Sistema seguro de login e cadastro

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **npm** (vem com Node.js) ou **yarn**
- **Git** ([Download](https://git-scm.com/))

### Verificando as Instalações

```bash
# Verificar versão do Node.js
node --version  # Deve ser 18 ou superior

# Verificar versão do npm
npm --version

# Verificar se PostgreSQL está instalado
psql --version  # Deve ser 14 ou superior
```

## 🛠️ Instalação Detalhada

### Passo 1: Clone o Repositório

```bash
git clone <url-do-repositorio>
cd ritmo-constante
```

**Nota:** Se você não tem acesso ao repositório, você pode criar uma cópia local do projeto.

### Passo 2: Instale as Dependências

O projeto utiliza um monorepo com workspaces. Você pode instalar todas as dependências de uma vez:

```bash
# Instalar todas as dependências (raiz, backend e frontend)
npm run install:all
```

**Ou instale manualmente:**

```bash
# 1. Instalar dependências do projeto raiz
npm install

# 2. Instalar dependências do backend
cd backend
npm install

# 3. Instalar dependências do frontend
cd ../frontend
npm install

# 4. Voltar para a raiz
cd ..
```

**Tempo estimado:** 2-5 minutos dependendo da velocidade da internet.

### Passo 3: Configure o Banco de Dados PostgreSQL

#### 3.1. Inicie o PostgreSQL

Certifique-se de que o serviço PostgreSQL está rodando:

**Windows:**
```powershell
# Verificar se está rodando
Get-Service postgresql*

# Se não estiver rodando, inicie:
Start-Service postgresql-x64-14  # Ajuste a versão conforme necessário
```

**Linux/Mac:**
```bash
# Verificar status
sudo systemctl status postgresql

# Iniciar se necessário
sudo systemctl start postgresql
```

#### 3.2. Crie o Banco de Dados

Conecte-se ao PostgreSQL e crie o banco:

```bash
# Conectar ao PostgreSQL
psql -U postgres
```

Dentro do psql, execute:

```sql
-- Criar banco de dados
CREATE DATABASE ritmo_constante;

-- Verificar se foi criado
\l

-- Sair do psql
\q
```

**Alternativa via linha de comando:**
```bash
psql -U postgres -c "CREATE DATABASE ritmo_constante;"
```

### Passo 4: Configure as Variáveis de Ambiente

#### 4.1. Criar arquivo `.env`

No diretório `backend`, crie um arquivo `.env`:

**Windows (PowerShell):**
```powershell
cd backend
Copy-Item .env.example .env
```

**Windows (CMD):**
```cmd
cd backend
copy .env.example .env
```

**Linux/Mac:**
```bash
cd backend
cp .env.example .env
```

#### 4.2. Editar o arquivo `.env`

Abra o arquivo `backend/.env` e configure as seguintes variáveis:

```env
# URL de conexão com o banco de dados
# Formato: postgresql://usuario:senha@host:porta/nome_banco?schema=public
DATABASE_URL="postgresql://postgres:sua_senha@localhost:5432/ritmo_constante?schema=public"

# Secret para assinatura dos tokens JWT (use uma string aleatória e segura)
JWT_SECRET="seu_secret_jwt_super_seguro_aqui_mude_em_producao"

# Tempo de expiração do token JWT
JWT_EXPIRES_IN="7d"

# Porta do servidor backend
PORT=3001

# Ambiente de execução
NODE_ENV=development

# URL do frontend (para CORS)
FRONTEND_URL="http://localhost:5173"
```

**⚠️ Importante:**
- Substitua `sua_senha` pela senha do seu usuário PostgreSQL
- Substitua `postgres` pelo seu usuário PostgreSQL se diferente
- Gere um `JWT_SECRET` seguro para produção (pode usar: `openssl rand -base64 32`)

**Exemplo de DATABASE_URL:**
```env
# Usuário padrão do PostgreSQL
DATABASE_URL="postgresql://postgres:minhasenha123@localhost:5432/ritmo_constante?schema=public"

# Usuário customizado
DATABASE_URL="postgresql://meuusuario:minhasenha@localhost:5432/ritmo_constante?schema=public"
```

### Passo 5: Execute as Migrations do Prisma

O Prisma precisa gerar o cliente e executar as migrations para criar as tabelas no banco:

```bash
cd backend

# 1. Gerar o Prisma Client (necessário antes das migrations)
npm run prisma:generate

# 2. Executar as migrations (cria as tabelas no banco)
npm run prisma:migrate
```

**O que acontece:**
- O Prisma Client é gerado baseado no schema
- As migrations são executadas e criam todas as tabelas
- O banco de dados fica pronto para uso

**Se aparecer um prompt pedindo nome da migration:**
- Pressione `Enter` para usar o nome padrão, ou
- Digite um nome descritivo como `init` ou `initial_schema`

**Verificar se funcionou:**
```bash
# Abrir Prisma Studio (interface visual do banco)
npm run prisma:studio
```

Isso abrirá uma interface web em `http://localhost:5555` onde você pode visualizar o banco.

### Passo 6: (Opcional) Criar Usuário Administrador

Se você quiser criar um usuário admin diretamente:

```bash
cd backend
npm run create:admin
```

Siga as instruções no terminal para criar o usuário.

### ✅ Verificação da Instalação

Execute os seguintes comandos para verificar se tudo está configurado:

```bash
# 1. Verificar se o backend consegue conectar ao banco
cd backend
npm run prisma:generate

# 2. Testar o servidor (deve iniciar sem erros)
npm run dev
```

Se tudo estiver correto, você verá:
```
✅ Prisma Client conectado ao banco de dados
🚀 Servidor rodando na porta 3001
📡 Ambiente: development
```

### 🐛 Solução de Problemas Comuns

#### Erro: "Cannot find module"
```bash
# Reinstalar dependências
npm run install:all
```

#### Erro: "Connection refused" ou "ECONNREFUSED"
- Verifique se o PostgreSQL está rodando
- Confirme usuário e senha no `.env`
- Verifique se a porta 5432 está correta

#### Erro: "Database does not exist"
```sql
-- Conecte ao PostgreSQL e crie o banco
psql -U postgres
CREATE DATABASE ritmo_constante;
\q
```

#### Erro: "Migration failed"
```bash
# Resetar migrations (⚠️ apaga todos os dados)
cd backend
npm run prisma:migrate reset

# Ou criar uma nova migration
npm run prisma:migrate dev --name fix_migration
```

#### Erro: "Port 3001 already in use"
```bash
# Windows: Encontrar processo usando a porta
netstat -ano | findstr :3001

# Linux/Mac: Encontrar processo
lsof -i :3001

# Matar o processo ou mudar a porta no .env
```

#### Erro no PowerShell: "execution of scripts is disabled"
```powershell
# Executar como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🚀 Executando o Projeto

### Desenvolvimento

#### Opção 1: Scripts PowerShell (Recomendado para Windows)

**Iniciar tudo em terminais separados (melhor para ver logs):**
```powershell
.\start-dev.ps1
```
Isso abrirá dois terminais separados:
- Um para o backend (porta 3001)
- Um para o frontend (porta 5173)

**Iniciar apenas o backend (útil para depuração):**
```powershell
.\start-backend-only.ps1
```

#### Opção 2: NPM Scripts

**Executar tudo junto (logs misturados):**
```bash
# Na raiz do projeto
npm run dev
```

**Executar separadamente:**

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

#### URLs dos Serviços

- **Backend:** `http://localhost:3001`
- **Frontend:** `http://localhost:5173`
- **Health Check:** `http://localhost:3001/health`

### Produção

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📁 Estrutura do Projeto

```
ritmo-constante/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Schema do banco de dados
│   ├── src/
│   │   ├── config/               # Configurações (DB, Auth)
│   │   ├── middleware/           # Middlewares (Auth, Error Handler)
│   │   ├── routes/               # Rotas da API
│   │   └── server.js             # Servidor Express
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/                  # Clientes da API
│   │   ├── components/           # Componentes React
│   │   ├── pages/                # Páginas da aplicação
│   │   ├── store/                # Estado global (Zustand)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🗄️ Modelagem do Banco de Dados

O banco de dados inclui os seguintes modelos:

- **User** - Usuários do sistema
- **Subject** - Matérias/disciplinas
- **StudySession** - Sessões de estudo
- **Revision** - Revisões programadas
- **StudyCycle** - Ciclos de estudos
- **CycleItem** - Itens do ciclo (matérias)
- **WeeklyPlan** - Planos semanais
- **WeeklyPlanItem** - Itens do plano semanal
- **Constancy** - Registro de constância diária
- **ExamOutline** - Editais verticalizados
- **OutlineItem** - Itens do edital
- **Statistics** - Estatísticas agregadas

## 🔌 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Perfil do usuário
- `PUT /api/auth/me` - Atualizar perfil

### Matérias
- `GET /api/subjects` - Listar matérias
- `POST /api/subjects` - Criar matéria
- `GET /api/subjects/:id` - Obter matéria
- `PUT /api/subjects/:id` - Atualizar matéria
- `DELETE /api/subjects/:id` - Deletar matéria

### Ciclo de Estudos
- `GET /api/study-cycles` - Listar ciclos
- `GET /api/study-cycles/active` - Ciclo ativo
- `POST /api/study-cycles` - Criar ciclo
- `PUT /api/study-cycles/:id` - Atualizar ciclo
- `POST /api/study-cycles/:id/advance` - Avançar ciclo
- `GET /api/study-cycles/:id/next` - Próximo item

### Sessões de Estudo
- `GET /api/study-sessions` - Listar sessões
- `POST /api/study-sessions` - Criar sessão
- `GET /api/study-sessions/stats/summary` - Estatísticas

### Revisões
- `GET /api/revisions/pending` - Revisões pendentes
- `GET /api/revisions` - Listar revisões
- `POST /api/revisions/:id/complete` - Completar revisão

### Estatísticas
- `GET /api/statistics/overview` - Visão geral
- `GET /api/statistics/by-subject` - Por matéria
- `GET /api/statistics/constancy` - Constância
- `GET /api/statistics/timeline` - Evolução temporal

### Edital
- `GET /api/exam-outlines` - Listar editais
- `POST /api/exam-outlines` - Criar edital
- `GET /api/exam-outlines/:id` - Obter edital

### Plano Semanal
- `GET /api/weekly-plans/current` - Plano atual
- `GET /api/weekly-plans/week/:date` - Plano da semana

## 🎨 Tecnologias Utilizadas

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT (jsonwebtoken)
- bcryptjs
- Zod (validação)
- date-fns

### Frontend
- React 18
- Vite
- React Router DOM
- TailwindCSS
- Chart.js + react-chartjs-2
- Zustand
- Axios
- date-fns

## 💡 Exemplos de Uso

### 1. Criar Conta e Fazer Login

**Via Interface Web:**
1. Acesse `http://localhost:5173`
2. Clique em "Não tem uma conta? Cadastre-se"
3. Preencha: Nome, Email e Senha
4. Clique em "Criar conta"
5. Você será redirecionado automaticamente para o Dashboard

**Via API (cURL):**
```bash
# Cadastro
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

### 2. Criar Matérias/Disciplinas

**Via Interface Web:**
1. Vá em **Configurações** (ícone de engrenagem)
2. Clique em **"Gerenciar Matérias"**
3. Clique em **"Nova Matéria"**
4. Preencha:
   - Nome: "Matemática"
   - Cor: Escolha uma cor (ex: #3B82F6)
   - Descrição (opcional): "Álgebra e Geometria"
5. Clique em **"Salvar"**

**Via API:**
```bash
curl -X POST http://localhost:3001/api/subjects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "Matemática",
    "color": "#3B82F6",
    "description": "Álgebra e Geometria"
  }'
```

### 3. Registrar uma Sessão de Estudo

**Via Interface Web:**
1. No **Dashboard**, clique em **"Registrar Sessão"**
2. Preencha o formulário:
   - **Matéria:** Selecione uma matéria criada
   - **Duração:** Tempo estudado em minutos (ex: 120)
   - **Tipo:** Escolha entre:
     - `study` - Estudo normal
     - `review` - Revisão
     - `questions` - Resolução de questões
   - **Questões:** Número de questões resolvidas (se aplicável)
   - **Acertos:** Número de acertos (se aplicável)
   - **Notas:** Observações sobre a sessão (opcional)
3. Clique em **"Registrar"**

**O que acontece automaticamente:**
- ✅ Sessão registrada no histórico
- ✅ Constância diária atualizada
- ✅ Estatísticas recalculadas
- ✅ Revisões futuras criadas (24h, 7 dias, 30 dias) se tipo for `study`

**Via API:**
```bash
curl -X POST http://localhost:3001/api/study-sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "subjectId": "uuid-da-materia",
    "duration": 120,
    "type": "study",
    "questions": 50,
    "correctAnswers": 42,
    "notes": "Estudei funções e equações do segundo grau"
  }'
```

### 4. Criar um Ciclo de Estudos

**Via Interface Web:**
1. Vá em **"Ciclo de Estudos"** no menu
2. Clique em **"Novo Ciclo"**
3. Preencha:
   - **Nome:** "Ciclo 1 - Concurso X"
   - **Matérias:** Selecione as matérias e defina:
     - Ordem de estudo
     - Peso de cada matéria
     - Meta de tempo (opcional)
     - Meta de questões (opcional)
4. Clique em **"Criar Ciclo"**
5. Marque o ciclo como **"Ativo"** para começar a usar

**Como funciona:**
- O sistema mantém um índice da matéria atual
- Ao avançar, passa para a próxima matéria na ordem
- Ao chegar no final, volta para o início (ciclo contínuo)

**Via API:**
```bash
curl -X POST http://localhost:3001/api/study-cycles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "Ciclo 1 - Concurso X",
    "items": [
      {
        "subjectId": "uuid-matematica",
        "order": 1,
        "weight": 3,
        "targetTime": 120,
        "targetQuestions": 50
      },
      {
        "subjectId": "uuid-portugues",
        "order": 2,
        "weight": 2,
        "targetTime": 90,
        "targetQuestions": 30
      }
    ]
  }'
```

### 5. Visualizar Revisões Pendentes

**Via Interface Web:**
1. Vá em **"Revisões"** no menu
2. Você verá todas as revisões agendadas
3. Filtre por:
   - Pendentes (não completadas)
   - Por matéria
   - Por data
4. Clique em **"Marcar como Completa"** após revisar

**Via API:**
```bash
# Listar revisões pendentes
curl -X GET http://localhost:3001/api/revisions/pending \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Completar uma revisão
curl -X POST http://localhost:3001/api/revisions/UUID_DA_REVISAO/complete \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 6. Acompanhar Estatísticas

**Via Interface Web:**
1. Vá em **"Estatísticas"** no menu
2. Visualize:
   - **Visão Geral:** Tempo total, questões resolvidas, taxa de acerto
   - **Por Matéria:** Desempenho individual de cada disciplina
   - **Constância:** Gráfico estilo GitHub contributions
   - **Evolução Temporal:** Gráfico de linha mostrando progresso ao longo do tempo

**Gráficos disponíveis:**
- 📊 Tempo estudado por matéria (pizza)
- 📈 Evolução temporal (linha)
- 📅 Calendário de constância (heatmap)
- 🎯 Taxa de acerto por matéria (barras)

**Via API:**
```bash
# Visão geral
curl -X GET http://localhost:3001/api/statistics/overview \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Por matéria
curl -X GET http://localhost:3001/api/statistics/by-subject \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Constância
curl -X GET http://localhost:3001/api/statistics/constancy \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 7. Criar Edital Verticalizado

**Via Interface Web:**
1. Vá em **"Edital"** no menu
2. Clique em **"Novo Edital"**
3. Selecione a matéria
4. Preencha o nome do edital (ex: "Edital Concurso X - Matemática")
5. Adicione itens do edital:
   - Título do tópico
   - Descrição (opcional)
   - Marque como estudado/revisado conforme progride
6. Salve o edital

**Uso:**
- Marque os itens como estudados conforme você cobre o conteúdo
- Acompanhe o progresso visual do edital
- Use para garantir que não esqueceu nenhum tópico

**Via API:**
```bash
curl -X POST http://localhost:3001/api/exam-outlines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "subjectId": "uuid-da-materia",
    "name": "Edital Concurso X - Matemática",
    "items": [
      {
        "title": "Álgebra",
        "description": "Equações, funções, polinômios",
        "order": 1
      },
      {
        "title": "Geometria",
        "description": "Geometria plana e espacial",
        "order": 2
      }
    ]
  }'
```

### 8. Planejar Semana de Estudos

**Via Interface Web:**
1. Vá em **"Quadro Semanal"** no menu
2. O sistema mostra a semana atual automaticamente
3. Adicione itens ao plano:
   - Selecione o dia
   - Escolha a matéria
   - Defina o tipo (estudo ou revisão)
   - Adicione notas (opcional)
4. Marque como completo após estudar

**Via API:**
```bash
# Obter plano da semana atual
curl -X GET http://localhost:3001/api/weekly-plans/current \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Obter plano de uma semana específica
curl -X GET "http://localhost:3001/api/weekly-plans/week/2024-01-15" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 9. Fluxo Completo de Uso Diário

**Rotina sugerida:**

1. **Manhã:** Abra o Dashboard e veja:
   - Próxima matéria do ciclo
   - Revisões pendentes para hoje
   - Meta diária de estudo

2. **Durante o estudo:**
   - Registre sessões conforme estuda
   - Use o timer ou registre manualmente
   - Adicione notas sobre o que estudou

3. **Fim do dia:**
   - Verifique se completou as revisões pendentes
   - Veja suas estatísticas do dia
   - Planeje o próximo dia no Quadro Semanal

4. **Semanalmente:**
   - Revise suas estatísticas
   - Ajuste o ciclo se necessário
   - Planeje a próxima semana

## 🏗️ Arquitetura do Projeto

### Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  React 18 + Vite + TailwindCSS + Zustand                    │
│  Porta: 5173                                                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  Components  │  │    Store     │     │
│  │              │  │              │  │   (Zustand)   │     │
│  │ - Dashboard  │  │ - Forms      │  │ - Auth       │     │
│  │ - Statistics │  │ - Charts     │  │ - Theme       │     │
│  │ - Revisions  │  │ - Layout    │  │ - Loading     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │   API Client   │                       │
│                    │    (Axios)     │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTP/REST
                             │ JSON + JWT
┌────────────────────────────▼────────────────────────────────┐
│                        Backend                                │
│  Node.js + Express + Prisma                                  │
│  Porta: 3001                                                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Middleware  │  │    Routes    │  │   Services   │     │
│  │              │  │              │  │              │     │
│  │ - Auth       │  │ - Auth       │  │ - Email      │     │
│  │ - Error      │  │ - Subjects  │  │ - Export     │     │
│  │ - CORS       │  │ - Sessions   │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │   Prisma ORM   │                       │
│                    │   (Client)     │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼────────────────────────────────┘
                             │ SQL
┌────────────────────────────▼────────────────────────────────┐
│                    Banco de Dados                            │
│                    PostgreSQL/SQLite                         │
│                    Porta: 5432                               │
└──────────────────────────────────────────────────────────────┘
```

### Arquitetura do Backend

#### Estrutura de Diretórios

```
backend/
├── prisma/
│   └── schema.prisma          # Modelagem do banco de dados
├── src/
│   ├── config/
│   │   ├── database.js        # Cliente Prisma (singleton)
│   │   └── auth.js            # Helpers JWT (gerar/verificar tokens)
│   ├── middleware/
│   │   ├── auth.js            # Middleware de autenticação
│   │   ├── errorHandler.js    # Tratamento centralizado de erros
│   │   └── defaultUser.js     # Middleware para desenvolvimento
│   ├── routes/
│   │   ├── auth.routes.js     # POST /register, POST /login, GET /me
│   │   ├── subjects.routes.js # CRUD de matérias
│   │   ├── studySessions.routes.js # CRUD de sessões de estudo
│   │   ├── studyCycle.routes.js # CRUD de ciclos
│   │   ├── revisions.routes.js # Listar e completar revisões
│   │   ├── statistics.routes.js # Endpoints de estatísticas
│   │   ├── examOutline.routes.js # CRUD de editais
│   │   ├── weeklyPlan.routes.js # Planos semanais
│   │   ├── tasks.routes.js     # CRUD de tarefas
│   │   ├── tags.routes.js     # CRUD de tags
│   │   └── folders.routes.js  # CRUD de pastas
│   ├── services/
│   │   ├── email.js           # Serviço de envio de emails
│   │   └── exportService.js   # Exportação de dados (PDF/Excel)
│   ├── utils/
│   │   └── sanitize.js        # Funções de sanitização
│   └── server.js              # Configuração do Express e rotas
├── scripts/
│   └── createAdmin.js         # Script para criar usuário admin
├── tests/
│   ├── unit/                  # Testes unitários
│   └── integration/           # Testes de integração
└── package.json
```

#### Fluxo de Requisição no Backend

```
1. Cliente faz requisição HTTP
   ↓
2. Express recebe requisição
   ↓
3. Middleware CORS processa (permite origem do frontend)
   ↓
4. Middleware de autenticação (se rota protegida)
   ├─ Extrai token do header Authorization
   ├─ Verifica e decodifica token JWT
   ├─ Adiciona userId ao req.userId
   └─ Continua para próxima etapa
   ↓
5. Rota específica processa requisição
   ├─ Valida dados com Zod (schema validation)
   ├─ Sanitiza inputs (prevenção de XSS)
   └─ Chama Prisma para operações no banco
   ↓
6. Prisma executa query no banco de dados
   ↓
7. Resposta JSON retornada ao cliente
   ↓
8. Se houver erro, errorHandler captura e formata resposta de erro
```

#### Modelos de Dados Principais

**User (Usuário)**
- Armazena informações do usuário
- Relaciona com todos os outros modelos (one-to-many)
- Senha hasheada com bcrypt

**Subject (Matéria)**
- Disciplinas de estudo do usuário
- Cor personalizada para visualização
- Relaciona com sessões, revisões, ciclos, editais

**StudySession (Sessão de Estudo)**
- Registro de cada sessão de estudo
- Tipos: `study`, `review`, `questions`
- Atualiza automaticamente Constancy e Statistics

**Revision (Revisão)**
- Revisões programadas automaticamente
- Intervalos: 1 dia, 7 dias, 30 dias
- Criadas quando tipo de sessão é `study`

**StudyCycle (Ciclo de Estudos)**
- Ciclo personalizado de matérias
- Mantém índice atual para rotação
- Permite pesos e metas por matéria

**Constancy (Constância)**
- Registro diário de estudos
- Unique por usuário e data
- Atualizado automaticamente ao criar sessões

**Statistics (Estatísticas)**
- Agregação de dados por matéria e data
- Calcula tempo total, questões, acertos, taxa
- Unique por usuário, matéria e data

### Arquitetura do Frontend

#### Estrutura de Diretórios

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js          # Cliente Axios configurado
│   │   ├── auth.js            # Endpoints de autenticação
│   │   ├── subjects.js        # Endpoints de matérias
│   │   ├── studySessions.js   # Endpoints de sessões
│   │   ├── studyCycles.js     # Endpoints de ciclos
│   │   ├── revisions.js       # Endpoints de revisões
│   │   ├── statistics.js      # Endpoints de estatísticas
│   │   ├── examOutlines.js    # Endpoints de editais
│   │   ├── weeklyPlans.js     # Endpoints de planos
│   │   ├── tasks.js           # Endpoints de tarefas
│   │   ├── tags.js            # Endpoints de tags
│   │   └── folders.js         # Endpoints de pastas
│   ├── components/
│   │   ├── Layout.jsx         # Layout principal com navegação
│   │   ├── ProtectedRoute.jsx # Rota protegida (requer auth)
│   │   ├── PublicRoute.jsx    # Rota pública (redireciona se auth)
│   │   ├── Loading.jsx        # Componente de loading
│   │   ├── ErrorBoundary.jsx  # Tratamento de erros React
│   │   ├── Toast.jsx          # Notificações toast
│   │   ├── StudySessionForm.jsx # Formulário de sessão
│   │   └── ...                # Outros componentes
│   ├── pages/
│   │   ├── Login.jsx          # Página de login
│   │   ├── Register.jsx       # Página de cadastro
│   │   ├── Dashboard.jsx      # Dashboard principal
│   │   ├── StudyCycle.jsx     # Gerenciamento de ciclos
│   │   ├── Revisions.jsx      # Lista de revisões
│   │   ├── Statistics.jsx     # Estatísticas e gráficos
│   │   ├── Constancy.jsx      # Calendário de constância
│   │   ├── ExamOutline.jsx    # Editais verticalizados
│   │   ├── WeeklyPlan.jsx     # Quadro semanal
│   │   └── Settings.jsx       # Configurações
│   ├── store/
│   │   ├── authStore.js       # Estado de autenticação (Zustand)
│   │   ├── themeStore.js      # Estado do tema (dark/light)
│   │   ├── loadingStore.js    # Estado de loading global
│   │   ├── toastStore.js      # Estado de notificações
│   │   └── eventStore.js      # Sistema de eventos
│   ├── hooks/
│   │   ├── useErrorHandler.js # Hook para tratamento de erros
│   │   ├── useEventEmitter.js # Hook para emitir eventos
│   │   ├── useEventListener.js # Hook para escutar eventos
│   │   └── useRevisionNotifications.js # Notificações de revisão
│   ├── services/
│   │   ├── errorLogger.js     # Serviço de log de erros (Sentry)
│   │   └── notificationService.js # Serviço de notificações
│   ├── utils/
│   │   └── serviceWorkerRegistration.js # Service Worker
│   ├── App.jsx                # Componente raiz com rotas
│   └── main.jsx               # Entry point
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service Worker
└── package.json
```

#### Fluxo de Autenticação no Frontend

```
1. Usuário preenche formulário de login
   ↓
2. Frontend envia POST /api/auth/login
   ↓
3. Backend valida credenciais e retorna token JWT
   ↓
4. Frontend salva token no localStorage via Zustand
   ↓
5. Axios interceptor adiciona token em todas as requisições
   ↓
6. Usuário navega para Dashboard
   ↓
7. ProtectedRoute verifica autenticação
   ↓
8. Se não autenticado, redireciona para Login
```

#### Gerenciamento de Estado

**Zustand Stores:**
- **authStore:** Gerencia autenticação (user, token, isAuthenticated)
- **themeStore:** Gerencia tema (dark/light mode)
- **loadingStore:** Loading global da aplicação
- **toastStore:** Notificações toast
- **eventStore:** Sistema de eventos customizado

**Estado Local:**
- Componentes usam `useState` para estado local
- `useEffect` para side effects e chamadas de API
- React Query poderia ser adicionado para cache de dados

#### Sistema de Rotas

```javascript
/                    → PublicRoute → Login (se não autenticado)
/login               → PublicRoute → Login
/register            → PublicRoute → Register
/dashboard           → ProtectedRoute → Dashboard
/study-cycle         → ProtectedRoute → StudyCycle
/revisions           → ProtectedRoute → Revisions
/statistics          → ProtectedRoute → Statistics
/constancy           → ProtectedRoute → Constancy
/exam-outline        → ProtectedRoute → ExamOutline
/weekly-plan         → ProtectedRoute → WeeklyPlan
/settings            → ProtectedRoute → Settings
```

### Fluxos Principais do Sistema

#### 1. Fluxo de Registro de Sessão de Estudo

```
Usuário preenche formulário
   ↓
Frontend valida dados localmente
   ↓
POST /api/study-sessions
   ↓
Backend valida com Zod
   ↓
Verifica se matéria pertence ao usuário
   ↓
Cria StudySession no banco
   ↓
Atualiza Constancy (upsert por data)
   ↓
Atualiza Statistics (upsert por matéria e data)
   ↓
Se tipo = "study", cria 3 revisões futuras:
   ├─ Revisão em 1 dia
   ├─ Revisão em 7 dias
   └─ Revisão em 30 dias
   ↓
Retorna sessão criada
   ↓
Frontend emite evento 'studySession:created'
   ↓
Componentes escutam evento e atualizam UI
```

#### 2. Fluxo de Ciclo de Estudos

```
Usuário cria ciclo com matérias
   ↓
Sistema salva ordem e pesos
   ↓
Usuário marca ciclo como ativo
   ↓
Sistema mantém currentIndex = 0
   ↓
Usuário estuda matéria atual
   ↓
Ao avançar ciclo:
   ├─ currentIndex++
   ├─ Se currentIndex >= items.length
   │  └─ currentIndex = 0 (volta ao início)
   └─ Retorna próxima matéria
   ↓
Usuário vê próxima matéria no Dashboard
```

#### 3. Fluxo de Revisões

```
Sessão de estudo criada (tipo = "study")
   ↓
Sistema cria 3 revisões:
   ├─ scheduledDate = hoje + 1 dia
   ├─ scheduledDate = hoje + 7 dias
   └─ scheduledDate = hoje + 30 dias
   ↓
Revisões aparecem em /revisions quando scheduledDate <= hoje
   ↓
Usuário marca revisão como completa
   ↓
Sistema atualiza:
   ├─ completed = true
   ├─ completedDate = agora
   └─ Revisão sai da lista de pendentes
```

### Decisões Arquiteturais

1. **Monorepo com workspaces**
   - Facilita gerenciamento de dependências compartilhadas
   - Permite scripts unificados
   - Melhor para desenvolvimento full-stack

2. **Prisma ORM**
   - Type-safe queries
   - Migrations automáticas
   - Melhor Developer Experience
   - Suporta múltiplos bancos (PostgreSQL, SQLite)

3. **JWT para autenticação**
   - Stateless (não precisa de sessão no servidor)
   - Escalável (múltiplos servidores)
   - Refresh tokens para segurança adicional

4. **Zustand para estado**
   - Simples e leve
   - Sem boilerplate
   - Fácil de usar e entender
   - Alternativa mais simples que Redux

5. **TailwindCSS**
   - Estilização rápida
   - Consistência visual
   - Responsivo por padrão
   - Menor bundle size

6. **Chart.js**
   - Gráficos interativos
   - Responsivos
   - Fácil customização
   - Boa performance

7. **Validação com Zod**
   - Type-safe validation
   - Mensagens de erro claras
   - Pode ser compartilhado entre frontend e backend

8. **Axios Interceptors**
   - Adiciona token automaticamente
   - Trata erros 401 (logout automático)
   - Centraliza configuração de requisições

9. **Sistema de Eventos Customizado**
   - Comunicação entre componentes
   - Desacoplamento
   - Fácil de debugar

10. **Service Worker**
    - Suporte offline básico
    - Cache de assets
    - Preparado para PWA

## 🧪 Testes

O projeto inclui suporte para testes unitários, de integração e end-to-end.

### Executando Testes

**Todos os testes do backend:**
```bash
cd backend
npm test
```

**Apenas testes unitários:**
```bash
npm run test:unit
```

**Apenas testes de integração:**
```bash
npm run test:integration
```

**Com cobertura:**
```bash
npm run test:coverage
```

**Testes E2E (Playwright):**
```bash
# Na raiz do projeto
npm run test:e2e

# Com interface visual
npm run test:e2e:ui

# Modo headed (ver navegador)
npm run test:e2e:headed
```

### Estrutura de Testes

```
backend/
├── tests/
│   ├── unit/              # Testes unitários
│   │   ├── config/        # Testes de configuração
│   │   └── middleware/    # Testes de middlewares
│   └── integration/       # Testes de integração
│       ├── auth.test.js   # Testes de autenticação
│       ├── subjects.test.js # Testes de matérias
│       └── revisions.test.js # Testes de revisões

e2e/                       # Testes end-to-end
├── auth.spec.js          # Fluxo de autenticação
├── dashboard.spec.js     # Testes do dashboard
├── revisions.spec.js     # Testes de revisões
└── subjects.spec.js      # Testes de matérias
```

### Exemplo de Teste

```javascript
// backend/tests/integration/auth.test.js
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/server.js';

describe('POST /api/auth/register', () => {
  it('deve criar um novo usuário', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
  });
});
```

## 🔒 Segurança

### Medidas de Segurança Implementadas

**Backend:**
- ✅ Senhas hasheadas com bcrypt (10 rounds)
- ✅ Tokens JWT com expiração configurável
- ✅ Refresh tokens para renovação segura
- ✅ Middleware de autenticação em todas as rotas protegidas
- ✅ Validação de dados com Zod (prevenção de dados inválidos)
- ✅ Sanitização de inputs (prevenção de XSS)
- ✅ CORS configurado para origem específica do frontend
- ✅ Error handling centralizado (não expõe informações sensíveis)

**Frontend:**
- ✅ Token armazenado de forma segura (localStorage)
- ✅ Interceptor Axios para adicionar token automaticamente
- ✅ Logout automático em caso de token expirado (401)
- ✅ Rotas protegidas com componente ProtectedRoute
- ✅ Validação de formulários antes do envio
- ✅ Error boundaries para capturar erros React

### Boas Práticas de Segurança

1. **Nunca commite o arquivo `.env`** - Está no `.gitignore`
2. **Use senhas fortes** para JWT_SECRET em produção
3. **Configure HTTPS** em produção
4. **Mantenha dependências atualizadas** - Execute `npm audit` regularmente
5. **Valide todos os inputs** no backend, mesmo que já validados no frontend
6. **Use rate limiting** em produção para prevenir abuso
7. **Monitore logs** para detectar atividades suspeitas

## 📈 Próximos Passos

- [ ] Recuperação de senha
- [ ] Notificações de revisões
- [ ] Exportação de relatórios (PDF)
- [ ] Integração com calendário
- [ ] Modo escuro
- [ ] App mobile (React Native)

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.

---

Desenvolvido com ❤️ para estudantes dedicados





