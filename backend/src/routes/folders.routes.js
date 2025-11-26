import express from 'express';
import prisma from '../config/database.js';
import { defaultUser } from '../middleware/defaultUser.js';
import { z } from 'zod';

const router = express.Router();

const folderSchema = z.object({
  name: z.string().min(1, 'Nome da pasta é obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
});

// Usa usuário padrão (sem necessidade de autenticação)
router.use(defaultUser);

// Listar todas as pastas do usuário
router.get('/', async (req, res, next) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.userId },
      include: {
        _count: {
          select: {
            subjects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(folders);
  } catch (error) {
    next(error);
  }
});

// Obter uma pasta específica com suas matérias
router.get('/:id', async (req, res, next) => {
  try {
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        subjects: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            subjects: true,
          },
        },
      },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    res.json(folder);
  } catch (error) {
    next(error);
  }
});

// Criar nova pasta
router.post('/', async (req, res, next) => {
  try {
    const data = folderSchema.parse(req.body);

    const folder = await prisma.folder.create({
      data: {
        ...data,
        userId: req.userId,
      },
    });

    res.status(201).json(folder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    // Log do erro para debug
    console.error('Erro ao criar pasta:', error);
    next(error);
  }
});

// Atualizar pasta
router.put('/:id', async (req, res, next) => {
  try {
    const data = folderSchema.partial().parse(req.body);

    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    const updated = await prisma.folder.update({
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

// Deletar pasta
router.delete('/:id', async (req, res, next) => {
  try {
    const folder = await prisma.folder.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        _count: {
          select: {
            subjects: true,
          },
        },
      },
    });

    if (!folder) {
      return res.status(404).json({ error: 'Pasta não encontrada' });
    }

    // Se a pasta tiver matérias, não permitir deletar (ou mover matérias para null)
    if (folder._count.subjects > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar uma pasta que contém matérias. Remova ou mova as matérias primeiro.' 
      });
    }

    await prisma.folder.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

