import express from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

const taskSchema = z.object({
  title: z.string().min(1, 'Título da tarefa é obrigatório'),
  description: z.string().optional(),
  date: z.union([z.string().datetime(), z.string(), z.date()]), // aceita ISO string, string de data ou Date
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  color: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  completed: z.boolean().optional(),
});

// Requer autenticação JWT
router.use(authenticate);

// Listar todas as tarefas do usuário
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      userId: req.userId,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Obter uma tarefa específica
router.get('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Criar nova tarefa
router.post('/', async (req, res, next) => {
  try {
    const data = taskSchema.parse(req.body);
    
    // Converter data para Date se for string
    const taskData = {
      ...data,
      date: data.date instanceof Date ? data.date : new Date(data.date),
      userId: req.userId,
    };

    const task = await prisma.task.create({
      data: taskData,
    });

    res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Atualizar tarefa
router.put('/:id', async (req, res, next) => {
  try {
    const data = taskSchema.partial().parse(req.body);

    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const updateData = { ...data };
    if (data.date) {
      updateData.date = data.date instanceof Date ? data.date : new Date(data.date);
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Deletar tarefa
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    await prisma.task.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

