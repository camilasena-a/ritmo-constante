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

- Node.js 18+ 
- PostgreSQL 14+
- npm ou yarn

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd ritmo-constante
```

### 2. Instale as dependências

```bash
# Instalar dependências do projeto raiz
npm install

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 3. Configure o banco de dados

Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE ritmo_constante;
```

### 4. Configure as variáveis de ambiente

No diretório `backend`, crie um arquivo `.env` baseado no `.env.example`:

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/ritmo_constante?schema=public"
JWT_SECRET="seu_secret_jwt_super_seguro_aqui"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### 5. Execute as migrations do Prisma

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

## 🚀 Executando o Projeto

### Desenvolvimento

Para executar backend e frontend simultaneamente:

```bash
# Na raiz do projeto
npm run dev
```

Ou execute separadamente:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

O backend estará disponível em `http://localhost:3001`
O frontend estará disponível em `http://localhost:5173`

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

## 📝 Decisões Arquiteturais

1. **Monorepo com workspaces** - Facilita gerenciamento de dependências
2. **Prisma ORM** - Type-safe, migrations automáticas, melhor DX
3. **JWT para autenticação** - Stateless, escalável
4. **Zustand para estado** - Simples, leve, sem boilerplate
5. **TailwindCSS** - Estilização rápida e consistente
6. **Chart.js** - Gráficos interativos e responsivos
7. **Validação com Zod** - Type-safe validation no backend

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- Tokens JWT com expiração
- Middleware de autenticação em rotas protegidas
- Validação de dados com Zod
- CORS configurado

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





