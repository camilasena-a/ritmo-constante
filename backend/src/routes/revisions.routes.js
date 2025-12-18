import express from 'express';
import prisma from '../config/database.js';
import { defaultUser } from '../middleware/defaultUser.js';
import { z } from 'zod';

const router = express.Router();

router.use(defaultUser);

// Listar revisões pendentes
router.get('/pending', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      userId: req.userId,
      completed: false,
      ...(startDate && endDate && {
        scheduledDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const revisions = await prisma.revision.findMany({
      where,
      include: {
        subject: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });

    res.json(revisions);
  } catch (error) {
    next(error);
  }
});

// Listar todas as revisões
router.get('/', async (req, res, next) => {
  try {
    const { subjectId, completed, startDate, endDate } = req.query;

    const where = {
      userId: req.userId,
      ...(subjectId && { subjectId }),
      ...(completed !== undefined && { completed: completed === 'true' }),
      ...(startDate && endDate && {
        scheduledDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const revisions = await prisma.revision.findMany({
      where,
      include: {
        subject: true,
      },
      orderBy: { scheduledDate: 'desc' },
    });

    res.json(revisions);
  } catch (error) {
    next(error);
  }
});

// Obter revisão específica
router.get('/:id', async (req, res, next) => {
  try {
    const revision = await prisma.revision.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        subject: true,
      },
    });

    if (!revision) {
      return res.status(404).json({ error: 'Revisão não encontrada' });
    }

    res.json(revision);
  } catch (error) {
    next(error);
  }
});

// Marcar revisão como concluída
router.post('/:id/complete', async (req, res, next) => {
  try {
    const revision = await prisma.revision.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!revision) {
      return res.status(404).json({ error: 'Revisão não encontrada' });
    }

    const updated = await prisma.revision.update({
      where: { id: req.params.id },
      data: {
        completed: true,
        completedDate: new Date(),
      },
      include: {
        subject: true,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Criar revisão customizada
router.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      subjectId: z.string().uuid(),
      scheduledDate: z.string().datetime(),
      interval: z.number().int().min(1),
      studySessionId: z.string().uuid().optional(),
    });

    const data = schema.parse(req.body);

    // Verificar se a matéria pertence ao usuário
    const subject = await prisma.subject.findFirst({
      where: {
        id: data.subjectId,
        userId: req.userId,
      },
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    const revision = await prisma.revision.create({
      data: {
        ...data,
        userId: req.userId,
        scheduledDate: new Date(data.scheduledDate),
      },
      include: {
        subject: true,
      },
    });

    res.status(201).json(revision);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Atualizar revisão
router.put('/:id', async (req, res, next) => {
  try {
    const revision = await prisma.revision.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!revision) {
      return res.status(404).json({ error: 'Revisão não encontrada' });
    }

    const schema = z.object({
      scheduledDate: z.string().datetime().optional(),
      interval: z.number().int().min(1).optional(),
      completed: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const updated = await prisma.revision.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.scheduledDate && { scheduledDate: new Date(data.scheduledDate) }),
        ...(data.completed && !revision.completedDate && { completedDate: new Date() }),
      },
      include: {
        subject: true,
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Deletar revisão
router.delete('/:id', async (req, res, next) => {
  try {
    const revision = await prisma.revision.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!revision) {
      return res.status(404).json({ error: 'Revisão não encontrada' });
    }

    await prisma.revision.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

