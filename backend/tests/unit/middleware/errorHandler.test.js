import { describe, it, expect, beforeEach, jest as jestMock } from '@jest/globals';
import { errorHandler } from '../../../src/middleware/errorHandler.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      url: '/test',
      method: 'GET',
      body: {},
    };
    res = {
      status: jestMock.fn().mockReturnThis(),
      json: jestMock.fn().mockReturnThis(),
    };
    next = jestMock.fn();
  });

  describe('Zod Validation Errors', () => {
    it('deve tratar erro de validação Zod com um campo', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      try {
        schema.parse({ email: 'invalid-email' });
      } catch (error) {
        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.any(String),
            field: expect.any(String),
            details: expect.any(Array),
          })
        );
      }
    });

    it('deve tratar erro de validação Zod com múltiplos campos', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
      });

      try {
        schema.parse({ email: 'invalid', password: '123' });
      } catch (error) {
        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Dados inválidos. Verifique os campos abaixo.',
            details: expect.any(Array),
          })
        );
      }
    });
  });

  describe('Prisma Errors', () => {
    it('deve tratar erro P2002 (constraint única)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('já está em uso'),
          field: 'email',
        })
      );
    });

    it('deve tratar erro P2025 (registro não encontrado)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Registro não encontrado.',
      });
    });

    it('deve tratar erro P2003 (foreign key)', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key violation', {
        code: 'P2003',
        clientVersion: '5.0.0',
      });

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('dados relacionados'),
        })
      );
    });
  });

  describe('Authentication Errors', () => {
    it('deve tratar erro de token JWT inválido', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Não autorizado. Faça login novamente.',
      });
    });

    it('deve tratar erro de token expirado', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Sessão expirada. Faça login novamente.',
      });
    });
  });

  describe('Generic Errors', () => {
    it('deve tratar erro genérico com status 500', () => {
      const error = new Error('Internal server error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
        })
      );
    });

    it('deve tratar erro com status customizado', () => {
      const error = new Error('Custom error');
      error.status = 400;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Custom error',
      });
    });
  });
});

