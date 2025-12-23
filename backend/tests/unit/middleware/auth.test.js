import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { jest as jestMock } from '@jest/globals';
import { authenticate } from '../../../src/middleware/auth.js';
import { generateAccessToken, verifyToken } from '../../../src/config/auth.js';

describe('Middleware de Autenticação', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jestMock.fn().mockReturnThis(),
      json: jestMock.fn().mockReturnThis(),
    };
    next = jestMock.fn();
  });

  describe('authenticate', () => {
    it('deve retornar 401 quando não há token', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token não fornecido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando o token não começa com Bearer', async () => {
      req.headers.authorization = 'Invalid token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token não fornecido' });
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando o token é inválido', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('deve passar quando o token é válido', async () => {
      const userId = 'test-user-id';
      const token = generateAccessToken(userId);
      req.headers.authorization = `Bearer ${token}`;

      await authenticate(req, res, next);

      expect(req.userId).toBe(userId);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando o token não contém userId', async () => {
      // Criar um token sem userId
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MDAwMDAwMDB9.invalid';
      req.headers.authorization = `Bearer ${token}`;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

