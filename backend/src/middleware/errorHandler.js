import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);
  console.error('Stack:', err.stack);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  console.error('Body:', req.body);

  // Erros de validação Zod
  if (err instanceof z.ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    // Se houver apenas um erro, retornar mensagem direta
    if (errors.length === 1) {
      return res.status(400).json({
        error: errors[0].message,
        field: errors[0].field,
        details: errors,
      });
    }

    // Múltiplos erros
    return res.status(400).json({
      error: 'Dados inválidos. Verifique os campos abaixo.',
      details: errors,
    });
  }

  // Erros do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Violação de constraint única
        const field = err.meta?.target?.[0] || 'campo';
        return res.status(409).json({
          error: `Este ${field} já está em uso. Por favor, escolha outro valor.`,
          field,
        });
      case 'P2025':
        // Registro não encontrado
        return res.status(404).json({
          error: 'Registro não encontrado.',
        });
      case 'P2003':
        // Violação de foreign key
        return res.status(400).json({
          error: 'Não é possível realizar esta operação. Verifique se os dados relacionados existem.',
        });
      default:
        return res.status(400).json({
          error: 'Erro ao processar solicitação. Verifique os dados enviados.',
        });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Dados inválidos. Verifique os tipos e valores informados.',
    });
  }

  // Erros de validação genéricos
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.message,
    });
  }

  // Erros de autenticação
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Não autorizado. Faça login novamente.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Sessão expirada. Faça login novamente.',
    });
  }

  // Erros 404
  if (err.status === 404) {
    return res.status(404).json({
      error: err.message || 'Recurso não encontrado.',
    });
  }

  // Erros 403
  if (err.status === 403) {
    return res.status(403).json({
      error: err.message || 'Você não tem permissão para realizar esta ação.',
    });
  }

  // Erros 400
  if (err.status === 400) {
    return res.status(400).json({
      error: err.message || 'Requisição inválida.',
    });
  }

  // Erro genérico do servidor
  const statusCode = err.status || 500;
  const errorMessage = err.message || 'Erro interno do servidor. Tente novamente mais tarde.';
  
  console.error(`Erro ${statusCode}:`, errorMessage);
  
  res.status(statusCode).json({
    error: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.toString(),
    }),
  });
};





