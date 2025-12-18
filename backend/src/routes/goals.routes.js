import express from 'express';
import prisma from '../config/database.js';
import { defaultUser } from '../middleware/defaultUser.js';
import { z } from 'zod';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from 'date-fns';

const router = express.Router();

const goalSchema = z.object({
  type: z.enum(['daily_hours', 'weekly_questions'], {
    errorMap: () => ({ message: 'Tipo deve ser "daily_hours" ou "weekly_questions"' }),
  }),
  targetValue: z.number().positive('Valor da meta deve ser positivo'),
  active: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

router.use(defaultUser);

// Listar todas as metas do usuário
router.get('/', async (req, res, next) => {
  try {
    const { active } = req.query;
    
    const where = {
      userId: req.userId,
      ...(active !== undefined && { active: active === 'true' }),
    };

    const goals = await prisma.studyGoal.findMany({
      where,
      orderBy: [
        { active: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(goals);
  } catch (error) {
    next(error);
  }
});

// Obter uma meta específica
router.get('/:id', async (req, res, next) => {
  try {
    const goal = await prisma.studyGoal.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    res.json(goal);
  } catch (error) {
    next(error);
  }
});

// Criar nova meta
router.post('/', async (req, res, next) => {
  try {
    const data = goalSchema.parse(req.body);
    
    const goal = await prisma.studyGoal.create({
      data: {
        ...data,
        userId: req.userId,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    res.status(201).json(goal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    next(error);
  }
});

// Atualizar meta
router.put('/:id', async (req, res, next) => {
  try {
    const goal = await prisma.studyGoal.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const data = goalSchema.partial().parse(req.body);
    
    const updated = await prisma.studyGoal.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { 
          endDate: data.endDate ? new Date(data.endDate) : null 
        }),
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

// Deletar meta
router.delete('/:id', async (req, res, next) => {
  try {
    const goal = await prisma.studyGoal.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    await prisma.studyGoal.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Acompanhamento de progresso em relação às metas
router.get('/progress/overview', async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;
    
    // Buscar metas ativas
    const activeGoals = await prisma.studyGoal.findMany({
      where: {
        userId: req.userId,
        active: true,
      },
    });

    if (activeGoals.length === 0) {
      return res.json({
        goals: [],
        progress: [],
      });
    }

    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'month':
        startDate = subDays(now, 30);
        endDate = now;
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }

    const progress = [];

    for (const goal of activeGoals) {
      if (goal.type === 'daily_hours') {
        // Calcular horas estudadas por dia no período
        const sessions = await prisma.studySession.findMany({
          where: {
            userId: req.userId,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        // Agrupar por dia
        const dailyStats = {};
        sessions.forEach(session => {
          const day = startOfDay(session.date).toISOString();
          if (!dailyStats[day]) {
            dailyStats[day] = { totalMinutes: 0, days: 0 };
          }
          dailyStats[day].totalMinutes += session.duration;
        });

        const days = Object.keys(dailyStats).length || 1;
        const totalMinutes = Object.values(dailyStats).reduce((sum, stat) => sum + stat.totalMinutes, 0);
        const averageHours = (totalMinutes / 60) / days;
        const targetHours = goal.targetValue;
        const percentage = targetHours > 0 ? (averageHours / targetHours) * 100 : 0;

        progress.push({
          goalId: goal.id,
          type: goal.type,
          targetValue: targetHours,
          currentValue: averageHours,
          percentage: Math.min(percentage, 100),
          unit: 'horas/dia',
          period: period,
        });
      } else if (goal.type === 'weekly_questions') {
        // Calcular questões resolvidas na semana
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);

        const sessions = await prisma.studySession.findMany({
          where: {
            userId: req.userId,
            date: {
              gte: weekStart,
              lte: weekEnd,
            },
            type: 'questions',
          },
        });

        const totalQuestions = sessions.reduce((sum, session) => sum + (session.questions || 0), 0);
        const targetQuestions = goal.targetValue;
        const percentage = targetQuestions > 0 ? (totalQuestions / targetQuestions) * 100 : 0;

        progress.push({
          goalId: goal.id,
          type: goal.type,
          targetValue: targetQuestions,
          currentValue: totalQuestions,
          percentage: Math.min(percentage, 100),
          unit: 'questões/semana',
          period: 'week',
        });
      }
    }

    res.json({
      goals: activeGoals,
      progress,
    });
  } catch (error) {
    next(error);
  }
});

// Progresso detalhado de uma meta específica
router.get('/:id/progress', async (req, res, next) => {
  try {
    const { days = '7' } = req.query;
    const daysNum = parseInt(days, 10);

    const goal = await prisma.studyGoal.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const startDate = subDays(new Date(), daysNum);
    const endDate = new Date();

    let progressData = {};

    if (goal.type === 'daily_hours') {
      const sessions = await prisma.studySession.findMany({
        where: {
          userId: req.userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      });

      // Agrupar por dia
      const dailyData = {};
      sessions.forEach(session => {
        const day = startOfDay(session.date).toISOString();
        if (!dailyData[day]) {
          dailyData[day] = { totalMinutes: 0, date: day };
        }
        dailyData[day].totalMinutes += session.duration;
      });

      const dailyProgress = Object.values(dailyData).map(day => ({
        date: day.date,
        value: day.totalMinutes / 60, // converter para horas
        target: goal.targetValue,
        percentage: goal.targetValue > 0 ? ((day.totalMinutes / 60) / goal.targetValue) * 100 : 0,
      }));

      const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
      const averageHours = (totalMinutes / 60) / Math.max(Object.keys(dailyData).length, 1);

      progressData = {
        goal,
        dailyProgress,
        summary: {
          averageHours,
          targetHours: goal.targetValue,
          percentage: goal.targetValue > 0 ? (averageHours / goal.targetValue) * 100 : 0,
        },
      };
    } else if (goal.type === 'weekly_questions') {
      // Agrupar por semana
      const sessions = await prisma.studySession.findMany({
        where: {
          userId: req.userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          type: 'questions',
        },
        orderBy: { date: 'asc' },
      });

      const weeklyData = {};
      sessions.forEach(session => {
        const weekStart = startOfWeek(session.date);
        const weekKey = weekStart.toISOString();
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { totalQuestions: 0, weekStart: weekKey };
        }
        weeklyData[weekKey].totalQuestions += session.questions || 0;
      });

      const weeklyProgress = Object.values(weeklyData).map(week => ({
        weekStart: week.weekStart,
        value: week.totalQuestions,
        target: goal.targetValue,
        percentage: goal.targetValue > 0 ? (week.totalQuestions / goal.targetValue) * 100 : 0,
      }));

      const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions || 0), 0);
      const currentWeekStart = startOfWeek(new Date());
      const currentWeekQuestions = sessions
        .filter(s => startOfWeek(s.date).getTime() === currentWeekStart.getTime())
        .reduce((sum, s) => sum + (s.questions || 0), 0);

      progressData = {
        goal,
        weeklyProgress,
        summary: {
          currentWeekQuestions,
          targetQuestions: goal.targetValue,
          percentage: goal.targetValue > 0 ? (currentWeekQuestions / goal.targetValue) * 100 : 0,
        },
      };
    }

    res.json(progressData);
  } catch (error) {
    next(error);
  }
});

export default router;

