import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import prisma from '../../src/config/database.js';
import revisionsRoutes from '../../src/routes/revisions.routes.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { defaultUser } from '../../src/middleware/defaultUser.js';
import { generateAccessToken } from '../../src/config/auth.js';

const app = express();
app.use(express.json());
app.use('/api/revisions', revisionsRoutes);
app.use(errorHandler);

describe('API de Revisões - Integração', () => {
  let testUser;
  let testSubject;
  let authToken;

  beforeAll(async () => {
    // Criar usuário de teste
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'revisions-test@example.com',
        password: 'hashed-password',
      },
    });

    // Criar matéria de teste
    testSubject = await prisma.subject.create({
      data: {
        userId: testUser.id,
        name: 'Test Subject',
        color: '#6366f1',
      },
    });

    authToken = generateAccessToken(testUser.id);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.revision.deleteMany({
      where: {
        userId: testUser.id,
      },
    });
    await prisma.subject.delete({
      where: { id: testSubject.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpar revisões antes de cada teste
    await prisma.revision.deleteMany({
      where: {
        userId: testUser.id,
      },
    });
  });

  describe('GET /api/revisions/pending', () => {
    it('deve listar revisões pendentes', async () => {
      // Criar revisão pendente
      await prisma.revision.create({
        data: {
          userId: testUser.id,
          subjectId: testSubject.id,
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
          interval: 1,
          completed: false,
        },
      });

      // Mock do defaultUser middleware
      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/revisions', revisionsRoutes);
      appWithAuth.use(errorHandler);

      const response = await request(appWithAuth)
        .get('/api/revisions/pending');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve filtrar revisões por período', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      await prisma.revision.create({
        data: {
          userId: testUser.id,
          subjectId: testSubject.id,
          scheduledDate: tomorrow,
          interval: 1,
          completed: false,
        },
      });

      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/revisions', revisionsRoutes);
      appWithAuth.use(errorHandler);

      const startDate = new Date().toISOString();
      const endDate = nextWeek.toISOString();

      const response = await request(appWithAuth)
        .get(`/api/revisions/pending?startDate=${startDate}&endDate=${endDate}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/revisions', () => {
    it('deve criar uma revisão com dados válidos', async () => {
      const scheduledDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/revisions', revisionsRoutes);
      appWithAuth.use(errorHandler);

      const response = await request(appWithAuth)
        .post('/api/revisions')
        .send({
          subjectId: testSubject.id,
          scheduledDate: scheduledDate.toISOString(),
          interval: 7,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.subjectId).toBe(testSubject.id);
      expect(response.body.interval).toBe(7);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/revisions', revisionsRoutes);
      appWithAuth.use(errorHandler);

      const response = await request(appWithAuth)
        .post('/api/revisions')
        .send({
          subjectId: 'invalid-uuid',
          scheduledDate: 'invalid-date',
          interval: -1,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/revisions/:id/complete', () => {
    it('deve marcar revisão como concluída', async () => {
      const revision = await prisma.revision.create({
        data: {
          userId: testUser.id,
          subjectId: testSubject.id,
          scheduledDate: new Date(),
          interval: 1,
          completed: false,
        },
      });

      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/revisions', revisionsRoutes);
      appWithAuth.use(errorHandler);

      const response = await request(appWithAuth)
        .post(`/api/revisions/${revision.id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
      expect(response.body.completedDate).toBeDefined();
    });

    it('deve retornar erro 404 para revisão não encontrada', async () => {
      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/revisions', revisionsRoutes);
      appWithAuth.use(errorHandler);

      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(appWithAuth)
        .post(`/api/revisions/${fakeId}/complete`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});









