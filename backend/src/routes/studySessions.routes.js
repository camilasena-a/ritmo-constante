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
  const parsed = new Date(date);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const syncStatistics = async (userId, subjectId, date) => {
  if (!userId || !subjectId || !date) return;

  const statsDate = normalizeDate(date);
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
  const statsWhere = {
    userId_subjectId_date: {
      userId,
      subjectId,
      date: statsDate,
    },
  };

  if (totalSessions === 0) {
    await prisma.statistics.delete({ where: statsWhere }).catch(() => {});
    return;
  }

  const totalTime = aggregates._sum.duration || 0;
  const totalQuestions = aggregates._sum.questions || 0;
  const totalCorrect = aggregates._sum.correctAnswers || 0;
  const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : null;

  await prisma.statistics.upsert({
    where: statsWhere,
    update: {
      totalTime,
      totalQuestions,
      correctAnswers: totalCorrect,
      accuracy,
    },
    create: {
      userId,
      subjectId,
      date: statsDate,
      totalTime,
      totalQuestions,
      correctAnswers: totalCorrect,
      accuracy,
    },
  });
};

// Listar sessões
router.get('/', async (req, res, next) => {
  try {
    const { subjectId, startDate, endDate, type } = req.query;

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

    const sessions = await prisma.studySession.findMany({
      where,
      include: {
        subject: true,
      },
      orderBy: { date: 'desc' },
    });

    res.json(sessions);
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
    });

    // Atualizar estatísticas
    await syncStatistics(req.userId, data.subjectId, dateOnly);

    // Se for uma sessão de estudo, criar revisões futuras
    if (data.type === 'study') {
      const revisionIntervals = [1, 7, 30]; // 24h, 7 dias, 30 dias

      for (const interval of revisionIntervals) {
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
      }
    }

    res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
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
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
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

