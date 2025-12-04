import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'; // Access token: 15 minutos
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'; // Refresh token: 7 dias

// Gera access token (curto)
export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Gera refresh token (longo)
export const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Verifica access token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Verifica refresh token (do banco de dados)
export const verifyRefreshToken = async (token, prisma) => {
  try {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken) {
      return null;
    }

    if (refreshToken.revoked) {
      return null;
    }

    if (refreshToken.expiresAt < new Date()) {
      return null;
    }

    return refreshToken;
  } catch (error) {
    return null;
  }
};

// Mantém compatibilidade com código antigo
export const generateToken = (userId) => {
  return generateAccessToken(userId);
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};





