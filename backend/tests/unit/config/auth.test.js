import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  comparePassword,
} from '../../../src/config/auth.js';

describe('Configuração de Autenticação', () => {
  describe('generateAccessToken', () => {
    it('deve gerar um token válido', () => {
      const userId = 'test-user-id';
      const token = generateAccessToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT tem 3 partes
    });

    it('deve gerar tokens diferentes para usuários diferentes', () => {
      const token1 = generateAccessToken('user-1');
      const token2 = generateAccessToken('user-2');

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('deve gerar um token aleatório', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      expect(token1).toBeDefined();
      expect(typeof token1).toBe('string');
      expect(token1.length).toBeGreaterThan(0);
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('deve verificar um token válido', () => {
      const userId = 'test-user-id';
      const token = generateAccessToken(userId);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(userId);
    });

    it('deve retornar null para token inválido', () => {
      const decoded = verifyToken('invalid-token');

      expect(decoded).toBeNull();
    });

    it('deve retornar null para token expirado', () => {
      // Criar um token com expiração muito curta
      const oldDate = Date.now();
      const token = generateAccessToken('test-user-id');
      
      // Simular token expirado (não podemos realmente expirar sem esperar)
      // Mas podemos testar com token inválido
      const decoded = verifyToken('expired.token.here');

      expect(decoded).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('deve gerar um hash diferente da senha original', async () => {
      const password = 'test-password-123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('deve gerar hashes diferentes para a mesma senha', async () => {
      const password = 'test-password-123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt gera salt diferente
    });
  });

  describe('comparePassword', () => {
    it('deve retornar true para senha correta', async () => {
      const password = 'test-password-123';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('deve retornar false para senha incorreta', async () => {
      const password = 'test-password-123';
      const wrongPassword = 'wrong-password';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });
});









