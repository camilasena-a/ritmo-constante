/**
 * Utilitários para lidar com paths considerando o base path do GitHub Pages
 */

/**
 * Obtém o base path configurado no Vite
 * @returns {string} Base path (ex: '/' ou '/nome-repositorio/')
 */
export const getBasePath = () => {
  return import.meta.env.BASE_URL || '/';
};

/**
 * Cria uma URL completa considerando o base path
 * @param {string} path - Path relativo (ex: '/login', '/dashboard')
 * @returns {string} URL completa com base path
 */
export const createPath = (path) => {
  const basePath = getBasePath();
  // Remove barra inicial do path se existir
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Remove barra final do basePath se existir (exceto se for '/')
  const cleanBasePath = basePath === '/' ? '' : basePath.replace(/\/$/, '');
  return `${cleanBasePath}/${cleanPath}`;
};

/**
 * Redireciona para um path considerando o base path
 * @param {string} path - Path para redirecionar
 */
export const redirectTo = (path) => {
  window.location.href = createPath(path);
};
