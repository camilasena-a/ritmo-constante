import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import prisma from '../../src/config/database.js';
import subjectsRoutes from '../../src/routes/subjects.routes.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { defaultUser } from '../../src/middleware/defaultUser.js';

const app = express();
app.use(express.json());
app.use('/api/subjects', subjectsRoutes);
app.use(errorHandler);

describe('API de Matérias - Integração', () => {
  let testUser;

  beforeAll(async () => {
    // Criar usuário de teste
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'subjects-test@example.com',
        password: 'hashed-password',
      },
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.subject.deleteMany({
      where: {
        userId: testUser.id,
      },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpar matérias antes de cada teste
    await prisma.subject.deleteMany({
      where: {
        userId: testUser.id,
      },
    });
  });

  describe('GET /api/subjects', () => {
    it('deve listar matérias do usuário', async () => {
      // Criar matérias de teste
      await prisma.subject.createMany({
        data: [
          {
            userId: testUser.id,
            name: 'Matemática',
            color: '#6366f1',
          },
          {
            userId: testUser.id,
            name: 'Português',
            color: '#10b981',
          },
        ],
      });

      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/subjects', subjectsRoutes);
      appWithAuth.use(errorHandler);

      const response = await request(appWithAuth)
        .get('/api/subjects');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('deve retornar array vazio quando não há matérias', async () => {
      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/subjects', subjectsRoutes);
      appWithAuth.use(errorHandler);

      const response = await request(appWithAuth)
        .get('/api/subjects');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('POST /api/subjects', () => {
    it('deve criar uma matéria com dados válidos', async () => {
      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/subjects', subjectsRoutes);
      appWithAuth.use(errorHandler);

      const response = await request(appWithAuth)
        .post('/api/subjects')
        .send({
          name: 'História',
          color: '#f59e0b',
          description: 'História do Brasil',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('História');
      expect(response.body.color).toBe('#f59e0b');
      expect(response.body.userId).toBe(testUser.id);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/subjects', subjectsRoutes);
      appWithAuth.use(errorHandler);

      const response = await request(appWithAuth)
        .post('/api/subjects')
        .send({
          name: '', // Nome vazio
          color: 'invalid-color',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/subjects/:id', () => {
    it('deve atualizar uma matéria existente', async () => {
      const subject = await prisma.subject.create({
        data: {
          userId: testUser.id,
          name: 'Geografia',
          color: '#3b82f6',
        },
      });

      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/subjects', subjectsRoutes);
      appWithAuth.use(errorHandler);

      const response = await request(appWithAuth)
        .put(`/api/subjects/${subject.id}`)
        .send({
          name: 'Geografia Atualizada',
          color: '#8b5cf6',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Geografia Atualizada');
      expect(response.body.color).toBe('#8b5cf6');
    });

    it('deve retornar erro 404 para matéria não encontrada', async () => {
      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/subjects', subjectsRoutes);
      appWithAuth.use(errorHandler);

      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(appWithAuth)
        .put(`/api/subjects/${fakeId}`)
        .send({
          name: 'Test',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/subjects/:id', () => {
    it('deve deletar uma matéria existente', async () => {
      const subject = await prisma.subject.create({
        data: {
          userId: testUser.id,
          name: 'Física',
          color: '#ef4444',
        },
      });

      const appWithAuth = express();
      appWithAuth.use(express.json());
      appWithAuth.use((req, res, next) => {
        req.userId = testUser.id;
        next();
      });
      appWithAuth.use('/api/subjects', subjectsRoutes);
      appWithAuth.use(errorHandler);

      const response = await request(appWithAuth)
        .delete(`/api/subjects/${subject.id}`);

      expect(response.status).toBe(204);

      // Verificar que foi deletado
      const deleted = await prisma.subject.findUnique({
        where: { id: subject.id },
      });
      expect(deleted).toBeNull();
    });
  });
});






