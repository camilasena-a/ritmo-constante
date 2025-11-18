import express from 'express';
import prisma from '../config/database.js';
import { defaultUser } from '../middleware/defaultUser.js';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

const router = express.Router();

router.use(defaultUser);

// Estatísticas gerais
router.get('/overview', async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    // Total de tempo estudado
    const totalTime = await prisma.studySession.aggregate({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        duration: true,
      },
    });

    // Total de questões
    const totalQuestions = await prisma.studySession.aggregate({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        questions: true,
      },
    });

    // Total de acertos
    const totalCorrect = await prisma.studySession.aggregate({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        correctAnswers: true,
      },
    });

    // Taxa de acerto
    const accuracy = totalQuestions._sum.questions > 0
      ? (totalCorrect._sum.correctAnswers || 0) / totalQuestions._sum.questions
      : 0;

    // Dias estudados
    const daysStudied = await prisma.constancy.count({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        studied: true,
      },
    });

    // Streak atual
    const constancies = await prisma.constancy.findMany({
      where: {
        userId: req.userId,
        date: {
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    let streak = 0;
    let currentDate = new Date(endDate);
    currentDate.setHours(0, 0, 0, 0);

    for (const constancy of constancies) {
      const constancyDate = new Date(constancy.date);
      constancyDate.setHours(0, 0, 0, 0);

      if (constancyDate.getTime() === currentDate.getTime() && constancy.studied) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (constancyDate.getTime() < currentDate.getTime()) {
        break;
      } else {
        break;
      }
    }

    res.json({
      totalTime: totalTime._sum.duration || 0,
      totalQuestions: totalQuestions._sum.questions || 0,
      totalCorrect: totalCorrect._sum.correctAnswers || 0,
      accuracy,
      daysStudied,
      streak,
      period: days,
    });
  } catch (error) {
    next(error);
  }
});

// Estatísticas por matéria
router.get('/by-subject', async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const subjects = await prisma.subject.findMany({
      where: { userId: req.userId },
    });

    const stats = await Promise.all(
      subjects.map(async (subject) => {
        const sessions = await prisma.studySession.findMany({
          where: {
            userId: req.userId,
            subjectId: subject.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
        const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions || 0), 0);
        const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
        const accuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

        return {
          subject: {
            id: subject.id,
            name: subject.name,
            color: subject.color,
          },
          totalTime,
          totalQuestions,
          totalCorrect,
          accuracy,
          sessionsCount: sessions.length,
        };
      })
    );

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Constância diária (para gráfico tipo GitHub contributions)
router.get('/constancy', async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31);

    const constancies = await prisma.constancy.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    const data = constancies.map((c) => ({
      date: format(new Date(c.date), 'yyyy-MM-dd'),
      studied: c.studied,
      minutes: c.minutes,
    }));

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Evolução temporal (para gráfico de linhas)
router.get('/timeline', async (req, res, next) => {
  try {
    const { period = '30', groupBy = 'day' } = req.query;
    const days = parseInt(period);
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

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

    // Agrupar por dia ou semana
    const grouped = {};
    sessions.forEach((session) => {
      const date = new Date(session.date);
      let key;

      if (groupBy === 'week') {
        const weekStart = startOfWeek(date);
        key = format(weekStart, 'yyyy-MM-dd');
      } else {
        key = format(date, 'yyyy-MM-dd');
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          totalTime: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          sessions: 0,
        };
      }

      grouped[key].totalTime += session.duration;
      grouped[key].totalQuestions += session.questions || 0;
      grouped[key].totalCorrect += session.correctAnswers || 0;
      grouped[key].sessions += 1;
    });

    const data = Object.values(grouped).map((item) => ({
      ...item,
      accuracy: item.totalQuestions > 0 ? item.totalCorrect / item.totalQuestions : 0,
    }));

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;

