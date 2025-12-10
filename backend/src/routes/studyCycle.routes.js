import express from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Requer autenticação JWT
router.use(authenticate);

const cycleSchema = z.object({
  name: z.string().min(1, 'Nome do ciclo é obrigatório'),
  active: z.boolean().optional(),
});

const cycleItemSchema = z.object({
  subjectId: z.string().uuid(),
  order: z.number().int().min(0),
  weight: z.number().int().min(1).optional(),
  targetTime: z.number().int().min(1).optional(),
  targetQuestions: z.number().int().min(1).optional(),
});

// Listar ciclos do usuário
router.get('/', async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const cycles = await prisma.studyCycle.findMany({
      where: { userId: req.userId },
      include: {
        cycleItems: {
          include: {
            subject: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(cycles);
  } catch (error) {
    next(error);
  }
});

// Obter ciclo ativo
router.get('/active', async (req, res, next) => {
  try {
    const cycle = await prisma.studyCycle.findFirst({
      where: {
        userId: req.userId,
        active: true,
      },
      include: {
        cycleItems: {
          include: {
            subject: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!cycle) {
      return res.status(404).json({ error: 'Nenhum ciclo ativo encontrado' });
    }

    res.json(cycle);
  } catch (error) {
    next(error);
  }
});

// Criar novo ciclo
router.post('/', async (req, res, next) => {
  try {
    const { name, active, items } = req.body;

    const cycleData = cycleSchema.parse({ name, active });

    // Se estiver ativando um novo ciclo, desativar os outros
    if (active) {
      await prisma.studyCycle.updateMany({
        where: { userId: req.userId },
        data: { active: false },
      });
    }

    const cycle = await prisma.studyCycle.create({
      data: {
        ...cycleData,
        userId: req.userId,
        cycleItems: items
          ? {
              create: items.map((item) => cycleItemSchema.parse(item)),
            }
          : undefined,
      },
      include: {
        cycleItems: {
          include: {
            subject: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    res.status(201).json(cycle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Atualizar ciclo
router.put('/:id', async (req, res, next) => {
  try {
    const cycle = await prisma.studyCycle.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo não encontrado' });
    }

    const data = cycleSchema.partial().parse(req.body);

    // Se estiver ativando, desativar os outros
    if (data.active === true) {
      await prisma.studyCycle.updateMany({
        where: {
          userId: req.userId,
          id: { not: req.params.id },
        },
        data: { active: false },
      });
    }

    const updated = await prisma.studyCycle.update({
      where: { id: req.params.id },
      data,
      include: {
        cycleItems: {
          include: {
            subject: true,
          },
          orderBy: { order: 'asc' },
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

// Adicionar item ao ciclo
router.post('/:id/items', async (req, res, next) => {
  try {
    const cycle = await prisma.studyCycle.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo não encontrado' });
    }

    const itemData = cycleItemSchema.parse(req.body);

    const item = await prisma.cycleItem.create({
      data: {
        ...itemData,
        cycleId: req.params.id,
      },
      include: {
        subject: true,
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

// Atualizar item do ciclo
router.put('/:id/items/:itemId', async (req, res, next) => {
  try {
    const item = await prisma.cycleItem.findFirst({
      where: {
        id: req.params.itemId,
        cycle: {
          id: req.params.id,
          userId: req.userId,
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const data = cycleItemSchema.partial().parse(req.body);

    const updated = await prisma.cycleItem.update({
      where: { id: req.params.itemId },
      data,
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

// Remover item do ciclo
router.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    const item = await prisma.cycleItem.findFirst({
      where: {
        id: req.params.itemId,
        cycle: {
          id: req.params.id,
          userId: req.userId,
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    await prisma.cycleItem.delete({
      where: { id: req.params.itemId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Obter próximo item do ciclo
router.get('/:id/next', async (req, res, next) => {
  try {
    const cycle = await prisma.studyCycle.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        cycleItems: {
          include: {
            subject: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo não encontrado' });
    }

    if (cycle.cycleItems.length === 0) {
      return res.status(404).json({ error: 'Ciclo sem itens' });
    }

    const nextIndex = cycle.currentIndex % cycle.cycleItems.length;
    const nextItem = cycle.cycleItems[nextIndex];

    res.json(nextItem);
  } catch (error) {
    next(error);
  }
});

// Avançar para próximo item do ciclo
router.post('/:id/advance', async (req, res, next) => {
  try {
    const cycle = await prisma.studyCycle.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        cycleItems: true,
      },
    });

    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo não encontrado' });
    }

    if (cycle.cycleItems.length === 0) {
      return res.status(400).json({ error: 'Ciclo sem itens' });
    }

    const nextIndex = (cycle.currentIndex + 1) % cycle.cycleItems.length;

    const updated = await prisma.studyCycle.update({
      where: { id: req.params.id },
      data: { currentIndex: nextIndex },
      include: {
        cycleItems: {
          include: {
            subject: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Deletar ciclo
router.delete('/:id', async (req, res, next) => {
  try {
    const cycle = await prisma.studyCycle.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!cycle) {
      return res.status(404).json({ error: 'Ciclo não encontrado' });
    }

    await prisma.studyCycle.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

