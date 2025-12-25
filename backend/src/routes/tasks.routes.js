import express from 'express';
import prisma from '../config/database.js';
import { defaultUser } from '../middleware/defaultUser.js';
import { z } from 'zod';

const router = express.Router();

const taskSchema = z.object({
  title: z.string().min(1, 'Título da tarefa é obrigatório'),
  description: z.string().optional(),
  date: z.string().datetime(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  color: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  completed: z.boolean().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

// Usa usuário padrão (sem necessidade de autenticação)
router.use(defaultUser);

// Listar todas as tarefas do usuário
router.get('/', async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { startDate, endDate, completed, tagIds, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Validar parâmetros de paginação
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Parâmetros de paginação inválidos' });
    }

    // Processar tagIds (pode ser string única ou array separado por vírgula)
    let tagIdsArray = [];
    if (tagIds) {
      tagIdsArray = Array.isArray(tagIds) ? tagIds : tagIds.split(',').filter(Boolean);
    }

    const where = {
      userId: req.userId,
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
      ...(completed !== undefined && { completed: completed === 'true' }),
      ...(tagIdsArray.length > 0 && {
        tags: {
          some: {
            tagId: {
              in: tagIdsArray,
            },
          },
        },
      }),
    };

    // Buscar total de registros e dados paginados em paralelo
    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        select: {
          id: true,
          userId: true,
          title: true,
          description: true,
          date: true,
          startTime: true,
          endTime: true,
          color: true,
          priority: true,
          completed: true,
          createdAt: true,
          updatedAt: true,
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' },
        ],
        skip,
        take: limitNum,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Transformar tasks para incluir tags no formato esperado
    const tasksWithTags = tasks.map(task => ({
      ...task,
      tags: task.tags.map(tt => tt.tag),
    }));

    res.json({
      data: tasksWithTags,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
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
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        date: true,
        startTime: true,
        endTime: true,
        color: true,
        priority: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    // Transformar para incluir tags no formato esperado
    const taskWithTags = {
      ...task,
      tags: task.tags.map(tt => tt.tag),
    };

    res.json(taskWithTags);
  } catch (error) {
    next(error);
  }
});

// Criar nova tarefa
router.post('/', async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const data = taskSchema.parse(req.body);
    const { tagIds, ...taskData } = data;

    // Validar se as tags pertencem ao usuário
    if (tagIds && tagIds.length > 0) {
      const userTags = await prisma.tag.findMany({
        where: {
          id: { in: tagIds },
          userId: req.userId,
        },
        select: {
          id: true,
        },
      });

      if (userTags.length !== tagIds.length) {
        return res.status(400).json({ error: 'Uma ou mais tags não foram encontradas ou não pertencem ao usuário' });
      }
    }

    const task = await prisma.task.create({
      data: {
        ...taskData,
        userId: req.userId,
        date: new Date(taskData.date),
        tags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map(tagId => ({
            tagId,
          })),
        } : undefined,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        date: true,
        startTime: true,
        endTime: true,
        color: true,
        priority: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    // Transformar para incluir tags no formato esperado
    const taskWithTags = {
      ...task,
      tags: task.tags.map(tt => tt.tag),
    };

    res.status(201).json(taskWithTags);
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
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const data = taskSchema.partial().parse(req.body);
    const { tagIds, ...taskData } = data;

    // Validar se as tags pertencem ao usuário
    if (tagIds && tagIds.length > 0) {
      const userTags = await prisma.tag.findMany({
        where: {
          id: { in: tagIds },
          userId: req.userId,
        },
        select: {
          id: true,
        },
      });

      if (userTags.length !== tagIds.length) {
        return res.status(400).json({ error: 'Uma ou mais tags não foram encontradas ou não pertencem ao usuário' });
      }
    }

    // Atualizar tarefa e tags
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...taskData,
        ...(taskData.date && { date: new Date(taskData.date) }),
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {}, // Remove todas as tags existentes
            create: tagIds.map(tagId => ({
              tagId,
            })),
          },
        }),
      },
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        date: true,
        startTime: true,
        endTime: true,
        color: true,
        priority: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    // Transformar para incluir tags no formato esperado
    const taskWithTags = {
      ...updated,
      tags: updated.tags.map(tt => tt.tag),
    };

    res.json(taskWithTags);
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
