/**
 * Utilitários de sanitização de inputs
 * Remove caracteres perigosos e normaliza strings
 */

/**
 * Remove caracteres HTML/XML perigosos e normaliza espaços
 * @param {string} str - String a ser sanitizada
 * @returns {string} - String sanitizada
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove caracteres de controle
};

/**
 * Sanitiza e limita o tamanho de uma string
 * @param {string} str - String a ser sanitizada
 * @param {number} maxLength - Tamanho máximo permitido
 * @returns {string} - String sanitizada e truncada
 */
export const sanitizeStringWithMaxLength = (str, maxLength = 10000) => {
  if (typeof str !== 'string') return str;
  
  const sanitized = sanitizeString(str);
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
};

/**
 * Sanitiza um número, garantindo que seja válido e dentro de limites
 * @param {number} num - Número a ser sanitizado
 * @param {number} min - Valor mínimo permitido
 * @param {number} max - Valor máximo permitido
 * @returns {number} - Número sanitizado
 */
export const sanitizeNumber = (num, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) => {
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    throw new Error('Número inválido');
  }
  
  if (num < min) return min;
  if (num > max) return max;
  return Math.floor(num); // Garante que seja inteiro se necessário
};

/**
 * Sanitiza uma data, garantindo que seja válida
 * @param {string|Date} date - Data a ser sanitizada
 * @returns {Date|null} - Data sanitizada ou null se inválida
 */
export const sanitizeDate = (date) => {
  if (!date) return null;
  
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return null;
  
  // Limita datas a um range razoável (1900-2100)
  const minDate = new Date('1900-01-01');
  const maxDate = new Date('2100-12-31');
  
  if (parsed < minDate || parsed > maxDate) return null;
  
  return parsed;
};

/**
 * Sanitiza um UUID, removendo caracteres inválidos
 * @param {string} uuid - UUID a ser sanitizado
 * @returns {string|null} - UUID sanitizado ou null se inválido
 */
export const sanitizeUUID = (uuid) => {
  if (typeof uuid !== 'string') return null;
  
  // Remove espaços e caracteres especiais, mantém apenas o formato UUID
  const cleaned = uuid.trim().toLowerCase();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  
  return uuidRegex.test(cleaned) ? cleaned : null;
};

/**
 * Sanitiza um objeto removendo propriedades undefined/null desnecessárias
 * @param {object} obj - Objeto a ser sanitizado
 * @returns {object} - Objeto sanitizado
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  }
  return sanitized;
};






