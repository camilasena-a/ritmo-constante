// Configuração global para testes
// Mock do console para reduzir ruído nos testes (opcional)
// Descomente se quiser silenciar logs durante os testes
// global.console = {
//   ...console,
//   log: () => {},
//   debug: () => {},
//   info: () => {},
//   warn: () => {},
//   error: () => {},
// };

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

