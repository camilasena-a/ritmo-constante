import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';

// Rotas
import authRoutes from './routes/auth.routes.js';
import subjectsRoutes from './routes/subjects.routes.js';
import studyCycleRoutes from './routes/studyCycle.routes.js';
import studySessionsRoutes from './routes/studySessions.routes.js';
import revisionsRoutes from './routes/revisions.routes.js';
import statisticsRoutes from './routes/statistics.routes.js';
import examOutlineRoutes from './routes/examOutline.routes.js';
import weeklyPlanRoutes from './routes/weeklyPlan.routes.js';
import tasksRoutes from './routes/tasks.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/study-cycles', studyCycleRoutes);
app.use('/api/study-sessions', studySessionsRoutes);
app.use('/api/revisions', revisionsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/exam-outlines', examOutlineRoutes);
app.use('/api/weekly-plans', weeklyPlanRoutes);
app.use('/api/tasks', tasksRoutes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});





