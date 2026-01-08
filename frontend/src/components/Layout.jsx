import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useThemeStore from '../store/themeStore';
import useRevisionNotifications from '../hooks/useRevisionNotifications';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Ciclo de Estudos', href: '/study-cycle', icon: '🔄' },
  { name: 'Revisões', href: '/revisions', icon: '📚' },
  { name: 'Quadro Semanal', href: '/weekly-plan', icon: '📅' },
  { name: 'Estatísticas', href: '/statistics', icon: '📈' },
  { name: 'Constância', href: '/constancy', icon: '🔥' },
  { name: 'Edital', href: '/exam-outline', icon: '📋' },
  { name: 'Configurações', href: '/settings', icon: '⚙️' },
];

export default function Layout() {
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Habilita notificações de revisões pendentes
  useRevisionNotifications({
    checkInterval: 30, // Verifica a cada 30 minutos
    enabled: true,
    hoursAhead: 24, // Verifica revisões nas próximas 24 horas
  });

  // Fechar menu mobile quando a rota mudar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevenir scroll do body quando menu mobile estiver aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Fechar menu ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip link para navegação por teclado */}
      <a href="#main-content" className="skip-link">
        Pular para conteúdo principal
      </a>
      {/* Mobile header com hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">Ritmo Constante</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Alternar tema"
            >
              {isDark ? (
                <span className="text-xl">☀️</span>
              ) : (
                <span className="text-xl">🌙</span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
            >
              <svg
                className="h-6 w-6 text-gray-700 dark:text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay para mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-30 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-30
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Header desktop */}
          <div className="hidden lg:flex items-center justify-between flex-shrink-0 px-4">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Ritmo Constante</h1>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Alternar tema"
            >
              {isDark ? (
                <span className="text-xl">☀️</span>
              ) : (
                <span className="text-xl">🌙</span>
              )}
            </button>
          </div>

          {/* Header mobile dentro do sidebar */}
          <div className="lg:hidden flex items-center justify-between flex-shrink-0 px-4 pt-4 pb-2">
            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">Menu</h1>
          </div>

          <nav className="mt-8 flex-1 px-2 space-y-1" aria-label="Navegação principal">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-r-2 border-primary-600 dark:border-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } group flex items-center px-4 py-3 text-sm font-medium rounded-r-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="mr-3 text-lg" aria-hidden="true">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center w-full">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Usuário Padrão</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Modo sem autenticação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main id="main-content" className="py-4 px-4 lg:py-8 lg:px-8" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

