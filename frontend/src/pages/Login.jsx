import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import useThemeStore from '../store/themeStore';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, token, refreshToken } = await authApi.login(formData);
      setAuth(user, token, refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="relative">
          <button
            onClick={toggleTheme}
            className="absolute top-0 right-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Alternar tema"
          >
            {isDark ? (
              <span className="text-xl">☀️</span>
            ) : (
              <span className="text-xl">🌙</span>
            )}
          </button>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Ritmo Constante
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Faça login na sua conta
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div 
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input mt-1"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                aria-required="true"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="input mt-1"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                aria-required="true"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-label={loading ? 'Entrando na conta' : 'Fazer login'}
              aria-busy={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/register" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}




