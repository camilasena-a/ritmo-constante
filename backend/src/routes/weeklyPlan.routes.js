import express from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns';

const router = express.Router();

// Requer autenticação JWT
router.use(authenticate);

const planItemSchema = z.object({
  subjectId: z.string().uuid().optional(),
  date: z.string().datetime(),
  type: z.enum(['study', 'review']),
  notes: z.string().optional(),
});

// Obter plano da semana atual
router.get('/current', async (req, res, next) => {
  try {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Segunda-feira
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    let plan = await prisma.weeklyPlan.findFirst({
      where: {
        userId: req.userId,
        weekStart: {
          lte: weekEnd,
        },
        weekEnd: {
          gte: weekStart,
        },
      },
      include: {
        planItems: {
          include: {
            plan: true,
          },
          orderBy: { date: 'asc' },
        },
      },
    });

    // Se não existe, criar um novo
    if (!plan) {
      plan = await prisma.weeklyPlan.create({
        data: {
          userId: req.userId,
          weekStart,
          weekEnd,
        },
        include: {
          planItems: true,
        },
      });
    }

    res.json(plan);
  } catch (error) {
    next(error);
  }
});

// Obter plano de uma semana específica
router.get('/week/:date', async (req, res, next) => {
  try {
    const date = new Date(req.params.date);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

    let plan = await prisma.weeklyPlan.findFirst({
      where: {
        userId: req.userId,
        weekStart: {
          lte: weekEnd,
        },
        weekEnd: {
          gte: weekStart,
        },
      },
      include: {
        planItems: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!plan) {
      plan = await prisma.weeklyPlan.create({
        data: {
          userId: req.userId,
          weekStart,
          weekEnd,
        },
        include: {
          planItems: true,
        },
      });
    }

    res.json(plan);
  } catch (error) {
    next(error);
  }
});

// Criar plano semanal
router.post('/', async (req, res, next) => {
  try {
    const { weekStart, weekEnd, items } = req.body;

    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekEnd);

    const plan = await prisma.weeklyPlan.create({
      data: {
        userId: req.userId,
        weekStart: weekStartDate,
        weekEnd: weekEndDate,
        planItems: items
          ? {
              create: items.map((item) => planItemSchema.parse(item)),
            }
          : undefined,
      },
      include: {
        planItems: {
          orderBy: { date: 'asc' },
        },
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Adicionar item ao plano
router.post('/:id/items', async (req, res, next) => {
  try {
    const plan = await prisma.weeklyPlan.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plano não encontrado' });
    }

    const itemData = planItemSchema.parse(req.body);

    const item = await prisma.weeklyPlanItem.create({
      data: {
        ...itemData,
        planId: req.params.id,
        date: new Date(itemData.date),
      },
    });

    res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Atualizar item do plano
router.put('/:id/items/:itemId', async (req, res, next) => {
  try {
    const item = await prisma.weeklyPlanItem.findFirst({
      where: {
        id: req.params.itemId,
        plan: {
          id: req.params.id,
          userId: req.userId,
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const schema = planItemSchema.partial().extend({
      completed: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const updated = await prisma.weeklyPlanItem.update({
      where: { id: req.params.itemId },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) }),
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

// Deletar item do plano
router.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    const item = await prisma.weeklyPlanItem.findFirst({
      where: {
        id: req.params.itemId,
        plan: {
          id: req.params.id,
          userId: req.userId,
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    await prisma.weeklyPlanItem.delete({
      where: { id: req.params.itemId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

