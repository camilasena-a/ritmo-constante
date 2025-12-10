import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Testar conexão ao inicializar
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma Client conectado ao banco de dados');
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar Prisma Client:', error);
  });

// Tratamento de desconexão ao encerrar
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;





