import express from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// Requer autenticação JWT
router.use(authenticate);

const outlineSchema = z.object({
  subjectId: z.string().uuid(),
  name: z.string().min(1, 'Nome do edital é obrigatório'),
  description: z.string().optional(),
});

const outlineItemSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  order: z.number().int().min(0),
});

// Listar editais do usuário
router.get('/', async (req, res, next) => {
  try {
    const { subjectId } = req.query;

    const where = {
      userId: req.userId,
      ...(subjectId && { subjectId }),
    };

    const outlines = await prisma.examOutline.findMany({
      where,
      include: {
        subject: true,
        items: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(outlines);
  } catch (error) {
    next(error);
  }
});

// Obter edital específico
router.get('/:id', async (req, res, next) => {
  try {
    const outline = await prisma.examOutline.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        subject: true,
        items: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!outline) {
      return res.status(404).json({ error: 'Edital não encontrado' });
    }

    // Calcular progresso
    const totalItems = outline.items.length;
    const studiedItems = outline.items.filter((item) => item.studied).length;
    const reviewedItems = outline.items.filter((item) => item.reviewed).length;

    res.json({
      ...outline,
      progress: {
        total: totalItems,
        studied: studiedItems,
        reviewed: reviewedItems,
        studiedPercentage: totalItems > 0 ? (studiedItems / totalItems) * 100 : 0,
        reviewedPercentage: totalItems > 0 ? (reviewedItems / totalItems) * 100 : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Criar edital
router.post('/', async (req, res, next) => {
  try {
    const data = outlineSchema.parse(req.body);

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

    const outline = await prisma.examOutline.create({
      data: {
        ...data,
        userId: req.userId,
      },
      include: {
        subject: true,
        items: true,
      },
    });

    res.status(201).json(outline);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Atualizar edital
router.put('/:id', async (req, res, next) => {
  try {
    const outline = await prisma.examOutline.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!outline) {
      return res.status(404).json({ error: 'Edital não encontrado' });
    }

    const data = outlineSchema.partial().parse(req.body);

    const updated = await prisma.examOutline.update({
      where: { id: req.params.id },
      data,
      include: {
        subject: true,
        items: {
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

// Adicionar item ao edital
router.post('/:id/items', async (req, res, next) => {
  try {
    const outline = await prisma.examOutline.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!outline) {
      return res.status(404).json({ error: 'Edital não encontrado' });
    }

    const itemData = outlineItemSchema.parse(req.body);

    const item = await prisma.outlineItem.create({
      data: {
        ...itemData,
        outlineId: req.params.id,
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

// Atualizar item do edital
router.put('/:id/items/:itemId', async (req, res, next) => {
  try {
    const item = await prisma.outlineItem.findFirst({
      where: {
        id: req.params.itemId,
        outline: {
          id: req.params.id,
          userId: req.userId,
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    const schema = z.object({
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      order: z.number().int().min(0).optional(),
      studied: z.boolean().optional(),
      reviewed: z.boolean().optional(),
    });

    const data = schema.parse(req.body);

    const updated = await prisma.outlineItem.update({
      where: { id: req.params.itemId },
      data: {
        ...data,
        ...(data.studied && !item.studiedAt && { studiedAt: new Date() }),
        ...(data.reviewed && !item.reviewedAt && { reviewedAt: new Date() }),
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

// Deletar item do edital
router.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    const item = await prisma.outlineItem.findFirst({
      where: {
        id: req.params.itemId,
        outline: {
          id: req.params.id,
          userId: req.userId,
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    await prisma.outlineItem.delete({
      where: { id: req.params.itemId },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Deletar edital
router.delete('/:id', async (req, res, next) => {
  try {
    const outline = await prisma.examOutline.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!outline) {
      return res.status(404).json({ error: 'Edital não encontrado' });
    }

    await prisma.examOutline.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

