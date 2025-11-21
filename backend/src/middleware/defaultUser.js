import prisma from '../config/database.js';

// ID do usuário padrão (será criado automaticamente se não existir)
let DEFAULT_USER_ID = null;

// Função para garantir que existe um usuário padrão
async function ensureDefaultUser() {
  if (DEFAULT_USER_ID) {
    return DEFAULT_USER_ID;
  }

  // Buscar ou criar usuário padrão
  let defaultUser = await prisma.user.findFirst({
    where: {
      email: 'usuario@padrao.com',
    },
  });

  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        name: 'Usuário Padrão',
        email: 'usuario@padrao.com',
        password: 'senha_temporaria', // Não será usada
      },
    });
  }

  DEFAULT_USER_ID = defaultUser.id;
  return DEFAULT_USER_ID;
}

// Middleware que define o usuário padrão
export const defaultUser = async (req, res, next) => {
  try {
    const userId = await ensureDefaultUser();
    req.userId = userId;
    next();
  } catch (error) {
    console.error('Erro ao garantir usuário padrão:', error);
    next(error);
  }
};




