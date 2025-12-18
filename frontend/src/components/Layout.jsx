import { Outlet, Link, useLocation } from 'react-router-dom';
import useThemeStore from '../store/themeStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Ciclo de Estudos', href: '/study-cycle', icon: '🔄' },
  { name: 'Revisões', href: '/revisions', icon: '📚' },
  { name: 'Quadro Semanal', href: '/weekly-plan', icon: '📅' },
  { name: 'Estatísticas', href: '/statistics', icon: '📈' },
  { name: 'Constância', href: '/constancy', icon: '🔥' },
  { name: 'Edital', href: '/exam-outline', icon: '📋' },
  { name: 'Metas', href: '/goals', icon: '🎯' },
  { name: 'Configurações', href: '/settings', icon: '⚙️' },
];

export default function Layout() {
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-between flex-shrink-0 px-4">
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
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-r-2 border-primary-600 dark:border-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } group flex items-center px-4 py-3 text-sm font-medium rounded-r-lg transition-colors`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
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
      <div className="pl-64">
        <main className="py-8 px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

