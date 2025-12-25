import express from 'express';
import prisma from '../config/database.js';
import { defaultUser } from '../middleware/defaultUser.js';
import { z } from 'zod';

const router = express.Router();

router.use(defaultUser);

// Contar revisões pendentes próximas (otimizado para notificações)
router.get('/pending/count', async (req, res, next) => {
  try {
    const { hoursAhead = 24 } = req.query;
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + parseInt(hoursAhead));
    
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const count = await prisma.revision.count({
      where: {
        userId: req.userId,
        completed: false,
        scheduledDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

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
      select: {
        id: true,
        userId: true,
        subjectId: true,
        studySessionId: true,
        scheduledDate: true,
        completedDate: true,
        interval: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
      select: {
        id: true,
        userId: true,
        subjectId: true,
        studySessionId: true,
        scheduledDate: true,
        completedDate: true,
        interval: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
      select: {
        id: true,
        userId: true,
        subjectId: true,
        studySessionId: true,
        scheduledDate: true,
        completedDate: true,
        interval: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
      select: {
        id: true,
        completedDate: true,
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
      select: {
        id: true,
        userId: true,
        subjectId: true,
        studySessionId: true,
        scheduledDate: true,
        completedDate: true,
        interval: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
      select: {
        id: true,
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
      select: {
        id: true,
        userId: true,
        subjectId: true,
        studySessionId: true,
        scheduledDate: true,
        completedDate: true,
        interval: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
      select: {
        id: true,
        completedDate: true,
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
      select: {
        id: true,
        userId: true,
        subjectId: true,
        studySessionId: true,
        scheduledDate: true,
        completedDate: true,
        interval: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
      select: {
        id: true,
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

