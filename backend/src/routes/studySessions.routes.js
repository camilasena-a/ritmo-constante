import express from 'express';
import prisma from '../config/database.js';
import { defaultUser } from '../middleware/defaultUser.js';
import { z } from 'zod';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const router = express.Router();

router.use(defaultUser);

const sessionSchema = z.object({
  subjectId: z.string().uuid(),
  date: z.string().datetime().optional(),
  duration: z.number().int().min(1, 'Duração deve ser pelo menos 1 minuto'),
  type: z.enum(['study', 'review', 'questions']),
  questions: z
    .number({
      required_error: 'Informe o total de questões resolvidas',
    })
    .int()
    .min(0, 'Questões deve ser pelo menos 0'),
  correctAnswers: z
    .number({
      required_error: 'Informe o total de acertos',
    })
    .int()
    .min(0, 'Acertos deve ser pelo menos 0'),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.correctAnswers > data.questions) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Acertos não podem ser maiores que as questões resolvidas',
      path: ['correctAnswers'],
    });
  }

  if (data.type === 'questions' && data.questions === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sessões de questões precisam ter pelo menos 1 questão',
      path: ['questions'],
    });
  }
});

const normalizeDate = (date) => {
  if (!date) return null;
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const syncStatistics = async (userId, subjectId, date) => {
  if (!userId || !subjectId || !date) return;

  try {
    const statsDate = normalizeDate(date);
    if (!statsDate || isNaN(statsDate.getTime())) {
      console.error('Data inválida para syncStatistics:', date);
      return;
    }

    const aggregates = await prisma.studySession.aggregate({
      where: {
        userId,
        subjectId,
        date: {
          gte: startOfDay(statsDate),
          lte: endOfDay(statsDate),
        },
      },
      _sum: {
        duration: true,
        questions: true,
        correctAnswers: true,
      },
      _count: {
        _all: true,
      },
    });

    const totalSessions = aggregates._count?._all || 0;

    if (totalSessions === 0) {
      await prisma.statistics.deleteMany({ 
        where: {
          userId,
          subjectId,
          date: statsDate,
        }
      }).catch(() => {});
      return;
    }

    const totalTime = aggregates._sum.duration || 0;
    const totalQuestions = aggregates._sum.questions || 0;
    const totalCorrect = aggregates._sum.correctAnswers || 0;
    const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : null;

    // Verificar se já existe estatística para este dia/matéria
    const existingStats = await prisma.statistics.findFirst({
      where: {
        userId,
        subjectId,
        date: statsDate,
      },
    }).catch(() => null);

    if (existingStats) {
      await prisma.statistics.update({
        where: { id: existingStats.id },
        data: {
          totalTime,
          totalQuestions,
          correctAnswers: totalCorrect,
          accuracy,
        },
      });
    } else {
      await prisma.statistics.create({
        data: {
          userId,
          subjectId,
          date: statsDate,
          totalTime,
          totalQuestions,
          correctAnswers: totalCorrect,
          accuracy,
        },
      });
    }
  } catch (error) {
    console.error('Erro ao sincronizar estatísticas:', error);
    // Não lançar o erro para não interromper o fluxo principal
  }
};

// Listar sessões
router.get('/', async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { subjectId, startDate, endDate, type, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Validar parâmetros de paginação
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Parâmetros de paginação inválidos' });
    }

    const where = {
      userId: req.userId,
      ...(subjectId && { subjectId }),
      ...(type && { type }),
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    // Buscar total de registros e dados paginados em paralelo
    const [total, sessions] = await Promise.all([
      prisma.studySession.count({ where }),
      prisma.studySession.findMany({
        where,
        include: {
          subject: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: sessions,
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

// Obter sessão específica
router.get('/:id', async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        subject: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Criar sessão
router.post('/', async (req, res, next) => {
  try {
    const data = sessionSchema.parse(req.body);

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

    const session = await prisma.studySession.create({
      data: {
        ...data,
        userId: req.userId,
        date: data.date ? new Date(data.date) : new Date(),
      },
      include: {
        subject: true,
      },
    });

    // Atualizar constância
    const sessionDate = new Date(session.date);
    const dateOnly = normalizeDate(sessionDate);

    if (!dateOnly || isNaN(dateOnly.getTime())) {
      console.error('Data inválida ao atualizar constância:', session.date);
      return res.status(400).json({ error: 'Data inválida da sessão' });
    }

    await prisma.constancy.upsert({
      where: {
        userId_date: {
          userId: req.userId,
          date: dateOnly,
        },
      },
      update: {
        studied: true,
        minutes: {
          increment: session.duration,
        },
      },
      create: {
        userId: req.userId,
        date: dateOnly,
        studied: true,
        minutes: session.duration,
      },
    }).catch((error) => {
      console.error('Erro ao atualizar constância:', error);
      // Não interrompe o processo, mas loga o erro
    });

    // Atualizar estatísticas
    await syncStatistics(req.userId, data.subjectId, dateOnly);

    // Se for uma sessão de estudo, criar revisões futuras
    if (data.type === 'study') {
      const revisionIntervals = [1, 7, 30]; // 24h, 7 dias, 30 dias

      for (const interval of revisionIntervals) {
        try {
          const scheduledDate = new Date(sessionDate);
          scheduledDate.setDate(scheduledDate.getDate() + interval);

          await prisma.revision.create({
            data: {
              userId: req.userId,
              subjectId: data.subjectId,
              studySessionId: session.id,
              scheduledDate,
              interval,
            },
          });
        } catch (revisionError) {
          // Log do erro mas não interrompe o processo
          console.error(`Erro ao criar revisão para intervalo ${interval}:`, revisionError);
        }
      }
    }

    res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // O errorHandler já trata erros Zod de forma melhor, então apenas passar adiante
      return next(error);
    }
    next(error);
  }
});

// Atualizar sessão
router.put('/:id', async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    const data = sessionSchema.partial().parse(req.body);

    const originalDate = session.date;
    const originalSubjectId = session.subjectId;

    const updated = await prisma.studySession.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) }),
      },
      include: {
        subject: true,
      },
    });

    await syncStatistics(req.userId, originalSubjectId, originalDate);
    await syncStatistics(req.userId, updated.subjectId, updated.date);

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // O errorHandler já trata erros Zod de forma melhor, então apenas passar adiante
      return next(error);
    }
    next(error);
  }
});

// Deletar sessão
router.delete('/:id', async (req, res, next) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    await prisma.studySession.delete({
      where: { id: req.params.id },
    });

    await syncStatistics(req.userId, session.subjectId, session.date);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Estatísticas de sessões
router.get('/stats/summary', async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;
    const now = new Date();
    let start, end;

    switch (period) {
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      default:
        start = startOfDay(now);
        end = endOfDay(now);
    }

    const sessions = await prisma.studySession.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions || 0), 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
    const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

    res.json({
      totalSessions: sessions.length,
      totalTime,
      totalQuestions,
      totalCorrect,
      accuracy,
      byType: {
        study: sessions.filter(s => s.type === 'study').length,
        review: sessions.filter(s => s.type === 'review').length,
        questions: sessions.filter(s => s.type === 'questions').length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

