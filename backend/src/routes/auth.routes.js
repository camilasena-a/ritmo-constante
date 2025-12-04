import express from 'express';
import prisma from '../config/database.js';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../config/auth.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

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

export default router;





