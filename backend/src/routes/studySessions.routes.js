import express from 'express';
import prisma from '../config/database.js';
import { defaultUser } from '../middleware/defaultUser.js';
import { z } from 'zod';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { sanitizeStringWithMaxLength, sanitizeDate, sanitizeUUID } from '../utils/sanitize.js';

const router = express.Router();

router.use(defaultUser);

// Schema de validação para criação/atualização de sessões com sanitização integrada
const sessionSchema = z.object({
  subjectId: z
    .string({
      required_error: 'ID da matéria é obrigatório',
    })
    .uuid('ID da matéria deve ser um UUID válido')
    .transform((val) => sanitizeUUID(val) || val), // Sanitiza UUID
  date: z
    .union([z.string().datetime(), z.date(), z.string()])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const sanitized = sanitizeDate(val);
      return sanitized ? sanitized.toISOString() : undefined;
    })
    .refine((val) => {
      if (!val) return true;
      const sanitized = sanitizeDate(val);
      return sanitized !== null;
    }, {
      message: 'Data inválida. Use o formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
    }),
  duration: z
    .number({
      required_error: 'Duração é obrigatória',
      invalid_type_error: 'Duração deve ser um número',
    })
    .int('Duração deve ser um número inteiro')
    .min(1, 'Duração deve ser pelo menos 1 minuto')
    .max(1440, 'Duração não pode ser maior que 1440 minutos (24 horas)'),
  type: z.enum(['study', 'review', 'questions'], {
    errorMap: () => ({ message: 'Tipo deve ser: study, review ou questions' }),
  }),
  questions: z
    .number({
      required_error: 'Informe o total de questões resolvidas',
      invalid_type_error: 'Questões deve ser um número',
    })
    .int('Questões deve ser um número inteiro')
    .min(0, 'Questões deve ser pelo menos 0')
    .max(100000, 'Questões não pode ser maior que 100000'),
  correctAnswers: z
    .number({
      required_error: 'Informe o total de acertos',
      invalid_type_error: 'Acertos deve ser um número',
    })
    .int('Acertos deve ser um número inteiro')
    .min(0, 'Acertos deve ser pelo menos 0')
    .max(100000, 'Acertos não pode ser maior que 100000'),
  notes: z
    .string()
    .max(5000, 'Notas não podem ter mais de 5000 caracteres')
    .optional()
    .transform((val) => (val ? sanitizeStringWithMaxLength(val, 5000) : undefined)),
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

// Schema para validação de query params na listagem
const listQuerySchema = z.object({
  subjectId: z
    .string()
    .uuid('ID da matéria deve ser um UUID válido')
    .optional()
    .transform((val) => (val ? sanitizeUUID(val) || val : undefined)),
  startDate: z
    .string()
    .datetime('Data inicial inválida. Use o formato ISO 8601')
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const sanitized = sanitizeDate(val);
      return sanitized ? sanitized.toISOString() : undefined;
    }),
  endDate: z
    .string()
    .datetime('Data final inválida. Use o formato ISO 8601')
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const sanitized = sanitizeDate(val);
      return sanitized ? sanitized.toISOString() : undefined;
    }),
  type: z.enum(['study', 'review', 'questions']).optional(),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 ? 1 : num;
    }),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => {
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) return 20;
      return num > 100 ? 100 : num; // Limita a 100 por página
    }),
}).refine((data) => {
  // Se ambas as datas forem fornecidas, validar que startDate <= endDate
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }
  return true;
}, {
  message: 'Data inicial deve ser anterior ou igual à data final',
  path: ['startDate'],
});

// Schema para validação de route params (UUID)
const uuidParamSchema = z.object({
  id: z
    .string()
    .uuid('ID deve ser um UUID válido')
    .transform((val) => sanitizeUUID(val) || val),
});

// Schema para validação de query params nas estatísticas
const statsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month']).optional().default('week'),
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
      select: {
        id: true,
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

    // Validar e sanitizar query params
    const queryParams = listQuerySchema.parse(req.query);
    const { subjectId, startDate, endDate, type, page, limit } = queryParams;

    const skip = (page - 1) * limit;

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
        select: {
          id: true,
          userId: true,
          subjectId: true,
          date: true,
          duration: true,
          type: true,
          questions: true,
          correctAnswers: true,
          notes: true,
          completed: true,
          createdAt: true,
          updatedAt: true,
          subject: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    // Mensagem informativa quando não há dados
    if (sessions.length === 0) {
      return res.json({
        data: [],
        message: 'Nenhuma sessão de estudo encontrada para os filtros aplicados',
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

    res.json({
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Obter sessão específica
router.get('/:id', async (req, res, next) => {
  try {
    // Validar e sanitizar route param
    const { id } = uuidParamSchema.parse(req.params);

    const session = await prisma.studySession.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      select: {
        id: true,
        userId: true,
        subjectId: true,
        date: true,
        duration: true,
        type: true,
        questions: true,
        correctAnswers: true,
        notes: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
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
    // Validar e sanitizar body
    const data = sessionSchema.parse(req.body);

    // Verificar se a matéria pertence ao usuário
    const subject = await prisma.subject.findFirst({
      where: {
        id: data.subjectId,
        userId: req.userId,
      },
      select: {
        id: true,
      },
    });

    if (!subject) {
      return res.status(404).json({ error: 'Matéria não encontrada' });
    }

    // Sanitizar data antes de criar
    const sessionDate = data.date ? sanitizeDate(data.date) : new Date();
    if (!sessionDate) {
      return res.status(400).json({ error: 'Data inválida' });
    }

    const session = await prisma.studySession.create({
      data: {
        ...data,
        userId: req.userId,
        date: sessionDate,
      },
      select: {
        id: true,
        userId: true,
        subjectId: true,
        date: true,
        duration: true,
        type: true,
        questions: true,
        correctAnswers: true,
        notes: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
      },
    });

    // Atualizar constância
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
    // Validar e sanitizar route param
    const { id } = uuidParamSchema.parse(req.params);

    const session = await prisma.studySession.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      select: {
        id: true,
        date: true,
        subjectId: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    // Validar e sanitizar body (parcial para atualização)
    const data = sessionSchema.partial().parse(req.body);

    const originalDate = session.date;
    const originalSubjectId = session.subjectId;

    // Sanitizar data se fornecida
    const updateData = { ...data };
    if (data.date) {
      const sanitizedDate = sanitizeDate(data.date);
      if (!sanitizedDate) {
        return res.status(400).json({ error: 'Data inválida' });
      }
      updateData.date = sanitizedDate;
    }

    // Se subjectId foi atualizado, verificar se pertence ao usuário
    if (data.subjectId) {
      const subject = await prisma.subject.findFirst({
        where: {
          id: data.subjectId,
          userId: req.userId,
        },
        select: {
          id: true,
        },
      });

      if (!subject) {
        return res.status(404).json({ error: 'Matéria não encontrada' });
      }
    }

    const updated = await prisma.studySession.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        userId: true,
        subjectId: true,
        date: true,
        duration: true,
        type: true,
        questions: true,
        correctAnswers: true,
        notes: true,
        completed: true,
        createdAt: true,
        updatedAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
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
    // Validar e sanitizar route param
    const { id } = uuidParamSchema.parse(req.params);

    const session = await prisma.studySession.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      select: {
        id: true,
        subjectId: true,
        date: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    await prisma.studySession.delete({
      where: { id },
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
    // Validar e sanitizar query params
    const { period } = statsQuerySchema.parse(req.query);
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
      case 'day':
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
      select: {
        duration: true,
        questions: true,
        correctAnswers: true,
        type: true,
      },
    });

    // Tratar caso de array vazio de forma segura
    if (!sessions || sessions.length === 0) {
      return res.json({
        totalSessions: 0,
        totalTime: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        accuracy: 0,
        byType: {
          study: 0,
          review: 0,
          questions: 0,
        },
        message: `Nenhuma sessão de estudo encontrada para o período ${period === 'day' ? 'do dia' : period === 'week' ? 'da semana' : 'do mês'}`,
      });
    }

    // Garantir que reduce() funcione corretamente mesmo com arrays vazios
    const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
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

