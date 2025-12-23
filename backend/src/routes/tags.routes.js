import express from 'express';
import prisma from '../config/database.js';
import { defaultUser } from '../middleware/defaultUser.js';
import { z } from 'zod';

const router = express.Router();

const tagSchema = z.object({
  name: z.string().min(1, 'Nome da tag é obrigatório').max(50, 'Nome da tag deve ter no máximo 50 caracteres'),
  color: z.string().optional(),
});

// Usa usuário padrão (sem necessidade de autenticação)
router.use(defaultUser);

// Listar todas as tags do usuário
router.get('/', async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const tags = await prisma.tag.findMany({
      where: {
        userId: req.userId,
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    res.json(tags);
  } catch (error) {
    next(error);
  }
});

// Obter uma tag específica
router.get('/:id', async (req, res, next) => {
  try {
    const tag = await prisma.tag.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    res.json(tag);
  } catch (error) {
    next(error);
  }
});

// Criar nova tag
router.post('/', async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const data = tagSchema.parse(req.body);

    // Verificar se já existe uma tag com o mesmo nome para o usuário
    const existingTag = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId: req.userId,
          name: data.name.trim(),
        },
      },
    });

    if (existingTag) {
      return res.status(409).json({ error: 'Já existe uma tag com este nome' });
    }

    const tag = await prisma.tag.create({
      data: {
        ...data,
        name: data.name.trim(),
        userId: req.userId,
      },
    });

    res.status(201).json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe uma tag com este nome' });
    }
    next(error);
  }
});

// Atualizar tag
router.put('/:id', async (req, res, next) => {
  try {
    const tag = await prisma.tag.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    const data = tagSchema.partial().parse(req.body);

    // Se o nome está sendo alterado, verificar se já existe outra tag com o mesmo nome
    if (data.name && data.name.trim() !== tag.name) {
      const existingTag = await prisma.tag.findUnique({
        where: {
          userId_name: {
            userId: req.userId,
            name: data.name.trim(),
          },
        },
      });

      if (existingTag) {
        return res.status(409).json({ error: 'Já existe uma tag com este nome' });
      }
    }

    const updated = await prisma.tag.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.name && { name: data.name.trim() }),
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe uma tag com este nome' });
    }
    next(error);
  }
});

// Deletar tag
router.delete('/:id', async (req, res, next) => {
  try {
    const tag = await prisma.tag.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag não encontrada' });
    }

    await prisma.tag.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;







