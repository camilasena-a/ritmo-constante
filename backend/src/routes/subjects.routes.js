import express from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

const subjectSchema = z.object({
  name: z.string().min(1, 'Nome da matéria é obrigatório'),
  color: z.string().optional(),
  description: z.string().optional(),
  folderId: z.string().uuid().optional().nullable(),
});

// Requer autenticação JWT
router.use(authenticate);

// Listar todas as matérias do usuário
router.get('/', async (req, res, next) => {
  try {
    const { folderId } = req.query;
    
    const where = { userId: req.userId };
    if (folderId === 'null' || folderId === '') {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId;
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(subjects);
  } catch (error) {
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
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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

    // Validar se folderId existe e pertence ao usuário (se fornecido)
    if (data.folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: data.folderId,
          userId: req.userId,
        },
      });

      if (!folder) {
        return res.status(404).json({ error: 'Pasta não encontrada' });
      }
    }

    const subject = await prisma.subject.create({
      data: {
        ...data,
        folderId: data.folderId || null,
        userId: req.userId,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
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
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    // Validar se folderId existe e pertence ao usuário (se fornecido)
    if (data.folderId !== undefined) {
      if (data.folderId === null || data.folderId === '') {
        data.folderId = null;
      } else {
        const folder = await prisma.folder.findFirst({
          where: {
            id: data.folderId,
            userId: req.userId,
          },
        });

        if (!folder) {
          return res.status(404).json({ error: 'Pasta não encontrada' });
        }
      }
    }

    const updated = await prisma.subject.update({
      where: { id: req.params.id },
      data,
      include: {
        folder: {
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

// Deletar matéria
router.delete('/:id', async (req, res, next) => {
  try {
    const subject = await prisma.subject.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
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

