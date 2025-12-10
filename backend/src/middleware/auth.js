import { verifyToken } from '../config/auth.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    console.error('Stack:', error.stack);
    return res.status(401).json({ 
      error: 'Erro na autenticação',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};





