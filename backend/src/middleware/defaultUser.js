import prisma from '../config/database.js';
import { hashPassword } from '../config/auth.js';

// ID do usuário padrão (será criado automaticamente se não existir)
let DEFAULT_USER_ID = null;

// Função para garantir que existe um usuário padrão
async function ensureDefaultUser() {
  if (DEFAULT_USER_ID) {
    return DEFAULT_USER_ID;
  }

  try {
    console.log('Verificando usuário padrão...');
    
    // Buscar ou criar usuário padrão
    let defaultUser = await prisma.user.findFirst({
      where: {
        email: 'usuario@padrao.com',
      },
    });

    if (!defaultUser) {
      console.log('Usuário padrão não encontrado. Criando...');
      // Hash da senha padrão
      const hashedPassword = await hashPassword('senha_temporaria');
      
      defaultUser = await prisma.user.create({
        data: {
          name: 'Usuário Padrão',
          email: 'usuario@padrao.com',
          password: hashedPassword,
        },
      });
      console.log('Usuário padrão criado com sucesso:', defaultUser.id);
    } else {
      console.log('Usuário padrão encontrado:', defaultUser.id);
    }

    DEFAULT_USER_ID = defaultUser.id;
    return DEFAULT_USER_ID;
  } catch (error) {
    console.error('Erro ao garantir usuário padrão:', error);
    console.error('Tipo do erro:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Middleware que define o usuário padrão
export const defaultUser = async (req, res, next) => {
  try {
    const userId = await ensureDefaultUser();
    if (!userId) {
      console.error('Falha ao obter ID do usuário padrão');
      return res.status(500).json({ error: 'Erro ao inicializar usuário padrão' });
    }
    req.userId = userId;
    next();
  } catch (error) {
    console.error('Erro ao garantir usuário padrão:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({ 
      error: 'Erro ao inicializar usuário padrão',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};





