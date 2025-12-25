import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import prisma from '../../src/config/database.js';
import authRoutes from '../../src/routes/auth.routes.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('API de Autenticação - Integração', () => {
  let testUser;

  beforeAll(async () => {
    // Limpar dados de teste anteriores
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'test2@example.com'],
        },
      },
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'test2@example.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('deve criar um novo usuário com dados válidos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');

      testUser = response.body.user;
    });

    it('deve retornar erro 400 para email já cadastrado', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('já cadastrado');
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'T',
          email: 'invalid-email',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro 400 quando falta campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('deve retornar erro 401 para senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro 401 para usuário não encontrado', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Criar refresh token válido
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      
      refreshToken = loginResponse.body.refreshToken;
    });

    it('deve renovar o token com refresh token válido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('deve retornar erro 401 para refresh token inválido', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve retornar erro 400 quando falta refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});




