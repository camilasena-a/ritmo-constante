import express from 'express';
import prisma from '../config/database.js';
import { defaultUser } from '../middleware/defaultUser.js';
import { z } from 'zod';

const router = express.Router();

const subjectSchema = z.object({
  name: z.string().min(1, 'Nome da matéria é obrigatório'),
  color: z.string().optional(),
  description: z.string().optional(),
});

// Usa usuário padrão (sem necessidade de autenticação)
router.use(defaultUser);

// Listar todas as matérias do usuário
router.get('/', async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    console.log('Buscando matérias para userId:', req.userId);

    const subjects = await prisma.subject.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        userId: true,
        name: true,
        color: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('Matérias encontradas:', subjects.length);
    res.json(subjects);
  } catch (error) {
    console.error('Erro ao buscar matérias:', error);
    console.error('Stack:', error.stack);
    next(error);
  }
});

// Obter uma matéria específica
router.get('/:id', async (req, res, next) => {
  try {
    const subject = await prisma.subject.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        color: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            studySessions: true,
            revisions: true,
          },
        },
      },
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    res.json(subject);
  } catch (error) {
    next(error);
  }
});

// Criar nova matéria
router.post('/', async (req, res, next) => {
  try {
    const data = subjectSchema.parse(req.body);

    const subject = await prisma.subject.create({
      data: {
        ...data,
        userId: req.userId,
      },
    });

    res.status(201).json(subject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Atualizar matéria
router.put('/:id', async (req, res, next) => {
  try {
    const data = subjectSchema.partial().parse(req.body);

    const subject = await prisma.subject.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      select: {
        id: true,
      },
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    const updated = await prisma.subject.update({
      where: { id: req.params.id },
      data,
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Deletar matéria
router.delete('/:id', async (req, res, next) => {
  try {
    const subject = await prisma.subject.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      select: {
        id: true,
      },
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    await prisma.subject.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

