# Backend - Ritmo Constante

## Configuração

1. Copie o arquivo `.env.example` para `.env`
2. Configure as variáveis de ambiente:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/ritmo_constante?schema=public"
JWT_SECRET="seu_secret_jwt_super_seguro_aqui"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

## Comandos

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

## Estrutura

- `src/config/` - Configurações (database, auth)
- `src/middleware/` - Middlewares (auth, error handler)
- `src/routes/` - Rotas da API
- `src/server.js` - Servidor Express
- `prisma/schema.prisma` - Schema do banco de dados





