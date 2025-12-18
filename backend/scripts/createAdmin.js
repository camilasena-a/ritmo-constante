import prisma from '../src/config/database.js';
import { hashPassword } from '../src/config/auth.js';

async function createAdmin() {
  try {
    const email = 'camilasenaraujo@gmail.com';
    const password = '@2311';
    const name = 'Admin';

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Usuário admin já existe! Atualizando senha...');
      const hashedPassword = await hashPassword(password);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          name: name,
        },
      });
      console.log('✅ Usuário admin atualizado com sucesso!');
      console.log(`Email: ${email}`);
      console.log(`Senha: ${password}`);
    } else {
      // Criar novo usuário
      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name: name,
          email: email,
          password: hashedPassword,
        },
      });
      console.log('✅ Usuário admin criado com sucesso!');
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${email}`);
      console.log(`Senha: ${password}`);
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();















