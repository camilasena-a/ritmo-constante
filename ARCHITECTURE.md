# Arquitetura do Sistema - Ritmo Constante

## Visão Geral

A plataforma Ritmo Constante é uma aplicação full-stack desenvolvida com arquitetura moderna, separando claramente backend e frontend.

## Arquitetura Geral

```
┌─────────────────┐
│   Frontend      │  React + Vite + TailwindCSS
│   (Port 5173)   │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│   Backend       │  Node.js + Express
│   (Port 3001)   │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  Banco de Dados
│   (Port 5432)   │
└─────────────────┘
```

## Backend

### Stack Tecnológica
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (jsonwebtoken)
- **Validação**: Zod
- **Utilitários**: date-fns, bcryptjs

### Estrutura de Pastas

```
backend/
├── prisma/
│   └── schema.prisma          # Modelagem do banco
├── src/
│   ├── config/
│   │   ├── database.js        # Cliente Prisma
│   │   └── auth.js            # JWT helpers
│   ├── middleware/
│   │   ├── auth.js            # Middleware de autenticação
│   │   └── errorHandler.js    # Tratamento de erros
│   ├── routes/
│   │   ├── auth.routes.js      # Autenticação
│   │   ├── subjects.routes.js # Matérias
│   │   ├── studyCycle.routes.js # Ciclos
│   │   ├── studySessions.routes.js # Sessões
│   │   ├── revisions.routes.js # Revisões
│   │   ├── statistics.routes.js # Estatísticas
│   │   ├── examOutline.routes.js # Editais
│   │   └── weeklyPlan.routes.js # Planos semanais
│   └── server.js              # Servidor Express
└── package.json
```

### Fluxo de Requisição

1. Cliente faz requisição HTTP
2. Middleware de CORS processa
3. Middleware de autenticação valida token (rotas protegidas)
4. Rota processa requisição
5. Validação com Zod
6. Prisma interage com banco
7. Resposta JSON retornada
8. Error handler captura erros

### Modelos de Dados

#### User
- Informações do usuário
- Relacionamentos com todos os outros modelos

#### Subject
- Matérias/disciplinas
- Cor personalizada
- Relaciona com sessões, revisões, ciclos, editais

#### StudySession
- Registro de sessões de estudo
- Tipo: study, review, questions
- Atualiza constância e estatísticas automaticamente

#### Revision
- Revisões programadas
- Intervalos configuráveis (1, 7, 30 dias)
- Criadas automaticamente ao registrar estudo

#### StudyCycle
- Ciclos de estudos personalizáveis
- Rotação automática de matérias
- Índice atual para controle

#### Constancy
- Registro diário de estudos
- Minutos estudados por dia
- Unique por usuário e data

#### Statistics
- Agregação de dados
- Por matéria e por data
- Unique por usuário, matéria e data

#### ExamOutline
- Editais verticalizados
- Itens com progresso
- Por matéria

## Frontend

### Stack Tecnológica
- **Framework**: React 18
- **Build Tool**: Vite
- **Roteamento**: React Router DOM
- **Estilização**: TailwindCSS
- **Estado Global**: Zustand
- **HTTP Client**: Axios
- **Gráficos**: Chart.js + react-chartjs-2
- **Utilitários**: date-fns

### Estrutura de Pastas

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js          # Cliente Axios configurado
│   │   ├── auth.js            # API de autenticação
│   │   ├── subjects.js        # API de matérias
│   │   ├── studySessions.js   # API de sessões
│   │   ├── studyCycles.js     # API de ciclos
│   │   ├── revisions.js       # API de revisões
│   │   ├── statistics.js      # API de estatísticas
│   │   ├── examOutlines.js    # API de editais
│   │   └── weeklyPlans.js    # API de planos
│   ├── components/
│   │   ├── Layout.jsx         # Layout principal
│   │   ├── Loading.jsx        # Componente de loading
│   │   └── StudySessionForm.jsx # Form de sessão
│   ├── pages/
│   │   ├── Login.jsx          # Login
│   │   ├── Register.jsx       # Cadastro
│   │   ├── Dashboard.jsx      # Dashboard
│   │   ├── StudyCycle.jsx     # Ciclo de estudos
│   │   ├── Revisions.jsx      # Revisões
│   │   ├── WeeklyPlan.jsx     # Quadro semanal
│   │   ├── Statistics.jsx     # Estatísticas
│   │   ├── Constancy.jsx      # Constância
│   │   ├── ExamOutline.jsx    # Edital
│   │   └── Settings.jsx      # Configurações
│   ├── store/
│   │   └── authStore.js       # Estado de autenticação
│   ├── App.jsx                # Componente raiz
│   └── main.jsx               # Entry point
└── package.json
```

### Fluxo de Autenticação

1. Usuário faz login/cadastro
2. Backend retorna token JWT
3. Token salvo no localStorage via Zustand
4. Axios interceptor adiciona token nas requisições
5. Rotas protegidas verificam autenticação
6. Logout limpa token e redireciona

### Gerenciamento de Estado

- **Zustand**: Estado global de autenticação
- **Local State**: useState para estado local dos componentes
- **API State**: Gerenciado via React hooks (useState, useEffect)

## Segurança

### Backend
- Senhas hasheadas com bcrypt (10 rounds)
- Tokens JWT com expiração configurável
- Middleware de autenticação em todas as rotas protegidas
- Validação de dados com Zod
- CORS configurado para frontend específico

### Frontend
- Token armazenado no localStorage
- Interceptor Axios para adicionar token
- Rotas protegidas com componente PrivateRoute
- Logout automático em caso de 401

## Banco de Dados

### Relacionamentos Principais

```
User (1) ──< (N) Subject
User (1) ──< (N) StudySession
User (1) ──< (N) Revision
User (1) ──< (N) StudyCycle
User (1) ──< (N) Constancy
User (1) ──< (N) Statistics
User (1) ──< (N) ExamOutline

Subject (1) ──< (N) StudySession
Subject (1) ──< (N) Revision
Subject (1) ──< (N) CycleItem
Subject (1) ──< (N) ExamOutline
Subject (1) ──< (N) Statistics

StudyCycle (1) ──< (N) CycleItem
WeeklyPlan (1) ──< (N) WeeklyPlanItem
ExamOutline (1) ──< (N) OutlineItem
```

### Constraints

- Unique: User.email
- Unique: Constancy (userId, date)
- Unique: Statistics (userId, subjectId, date)
- Unique: CycleItem (cycleId, order)

### Índices

- Índices automáticos do Prisma em campos únicos
- Índices em foreign keys para performance

## Fluxos Principais

### 1. Registro de Sessão de Estudo

1. Usuário preenche formulário
2. Frontend envia POST /api/study-sessions
3. Backend valida dados
4. Cria StudySession
5. Atualiza Constancy (upsert)
6. Atualiza Statistics (upsert)
7. Cria revisões futuras (1, 7, 30 dias)
8. Retorna sessão criada

### 2. Ciclo de Estudos

1. Usuário cria ciclo com matérias
2. Sistema mantém índice atual
3. Ao avançar, incrementa índice (modulo)
4. Próxima matéria calculada dinamicamente

### 3. Revisões

1. Criadas automaticamente ao estudar
2. Agendadas para intervalos configuráveis
3. Listadas como pendentes até completar
4. Marcação manual de conclusão

### 4. Estatísticas

1. Agregadas automaticamente ao criar sessões
2. Calculadas por matéria e por período
3. Incluem tempo, questões, acertos, taxa
4. Gráficos gerados no frontend

## Performance

### Backend
- Prisma com connection pooling
- Queries otimizadas com includes
- Agregações no banco quando possível

### Frontend
- Code splitting automático (Vite)
- Lazy loading de rotas
- Componentes otimizados
- Gráficos renderizados sob demanda

## Escalabilidade

### Possíveis Melhorias
- Cache com Redis para estatísticas
- Background jobs para cálculos pesados
- CDN para assets estáticos
- Load balancer para múltiplas instâncias
- Database read replicas

## Testes (Futuro)

### Backend
- Unit tests com Jest
- Integration tests
- E2E tests com Supertest

### Frontend
- Component tests com React Testing Library
- E2E tests com Cypress

## Deploy

### Backend
- Variáveis de ambiente configuradas
- Migrations executadas automaticamente
- Health check endpoint

### Frontend
- Build otimizado com Vite
- Assets estáticos
- SPA routing configurado

