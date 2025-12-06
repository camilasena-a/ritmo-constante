import express from 'express';
import prisma from '../config/database.js';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../config/auth.js';
import { authenticate } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/email.js';
import { z } from 'zod';
import crypto from 'crypto';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Cadastro
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();

    // Salvar refresh token no banco
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    res.status(201).json({
      user,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();

    // Revogar refresh tokens antigos do usuário
    await prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    // Salvar novo refresh token no banco
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Perfil do usuário
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Atualizar perfil
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const updateSchema = z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
    });

    const data = updateSchema.parse(req.body);

    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== req.userId) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Renovar tokens (refresh token)
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }

    const tokenData = await verifyRefreshToken(refreshToken, prisma);

    if (!tokenData) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    // Gerar novos tokens
    const newAccessToken = generateAccessToken(tokenData.userId);
    const newRefreshToken = generateRefreshToken();

    // Revogar o refresh token antigo
    await prisma.refreshToken.update({
      where: { id: tokenData.id },
      data: { revoked: true },
    });

    // Criar novo refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await prisma.refreshToken.create({
      data: {
        userId: tokenData.userId,
        token: newRefreshToken,
        expiresAt,
      },
    });

    res.json({
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
});

// Logout (revogar refresh token)
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Revogar todos os refresh tokens do usuário
    await prisma.refreshToken.updateMany({
      where: {
        userId: req.userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Solicitar recuperação de senha
router.post('/forgot-password', async (req, res, next) => {
  try {
    const forgotPasswordSchema = z.object({
      email: z.string().email('Email inválido'),
    });

    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Por segurança, sempre retorna sucesso mesmo se o email não existir
    // Isso previne enumeração de emails
    if (!user) {
      return res.json({ 
        message: 'Se o email estiver cadastrado, você receberá um link de recuperação de senha.' 
      });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira em 1 hora

    // Invalidar tokens anteriores do usuário
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Criar novo token de reset
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Enviar email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Não falha a requisição se o email não for enviado
      // Em produção, você pode querer tratar isso de forma diferente
    }

    res.json({ 
      message: 'Se o email estiver cadastrado, você receberá um link de recuperação de senha.' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Redefinir senha com token
router.post('/reset-password', async (req, res, next) => {
  try {
    const resetPasswordSchema = z.object({
      token: z.string().min(1, 'Token é obrigatório'),
      password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    });

    const { token, password } = resetPasswordSchema.parse(req.body);

    // Buscar token válido
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    if (resetToken.used) {
      return res.status(400).json({ error: 'Token já foi utilizado' });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token expirado' });
    }

    // Atualizar senha do usuário
    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Marcar token como usado
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Revogar todos os refresh tokens do usuário (forçar logout de todos os dispositivos)
    await prisma.refreshToken.updateMany({
      where: {
        userId: resetToken.userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

export default router;





