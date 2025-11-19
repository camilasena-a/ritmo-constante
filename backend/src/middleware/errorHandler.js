export const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Dados inválidos', details: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};


