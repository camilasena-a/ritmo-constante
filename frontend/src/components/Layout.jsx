import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useThemeStore from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { foldersApi } from '../api/folders';
import { subjectsApi } from '../api/subjects';

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Ciclo de Estudos', href: '/study-cycle', icon: '🔄' },
  { name: 'Revisões', href: '/revisions', icon: '📚' },
  { name: 'Quadro Semanal', href: '/weekly-plan', icon: '📅' },
  { name: 'Calendário', href: '/calendar', icon: '🗓️' },
];

const userMenuItems = [
  { name: 'Estatísticas', href: '/statistics', icon: '📈' },
  { name: 'Constância', href: '/constancy', icon: '🔥' },
  { name: 'Edital', href: '/exam-outline', icon: '📋' },
  { name: 'Configurações', href: '/settings', icon: '⚙️' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [folders, setFolders] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowUserMenu(false);
  };

  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  useEffect(() => {
    loadFolders();
    loadSubjects();
    
    // Listener para atualizar quando houver mudanças nas pastas/matérias
    const handleUpdate = () => {
      loadFolders();
      loadSubjects();
    };
    
    window.addEventListener('foldersUpdated', handleUpdate);
    window.addEventListener('subjectsUpdated', handleUpdate);

    // Fechar menu ao clicar fora
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('foldersUpdated', handleUpdate);
      window.removeEventListener('subjectsUpdated', handleUpdate);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  const loadFolders = async () => {
    try {
      const foldersData = await foldersApi.getAll();
      setFolders(foldersData);
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const subjectsData = await subjectsApi.getAll();
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Erro ao carregar matérias:', error);
    }
  };

  const getSubjectCount = (folderId) => {
    if (folderId === null) {
      return subjects.filter(s => !s.folderId).length;
    }
    return subjects.filter(s => s.folderId === folderId).length;
  };

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
          <nav className="mt-8 flex-1 px-2 space-y-1 overflow-y-auto">
            {mainNavigation.map((item) => {
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

            {/* Seção de Pastas */}
            {folders.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pastas
                  </h3>
                </div>
                <div className="space-y-1">
                  {folders.map((folder) => {
                    const subjectCount = getSubjectCount(folder.id);
                    const isActive = location.pathname === '/settings' && location.search === `?folder=${folder.id}`;
                    return (
                      <Link
                        key={folder.id}
                        to={`/settings?folder=${folder.id}`}
                        className={`${
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-r-2 border-primary-600 dark:border-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } group flex items-center justify-between px-4 py-2 text-sm font-medium rounded-r-lg transition-colors`}
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <span className="mr-2 text-base">📁</span>
                          <span className="truncate">{folder.name}</span>
                        </div>
                        {subjectCount > 0 && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {subjectCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  {/* Pasta "Sem pasta" para matérias sem pasta */}
                  {getSubjectCount(null) > 0 && (
                    <Link
                      to="/settings?folder=null"
                      className={`${
                        location.pathname === '/settings' && location.search === '?folder=null'
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-r-2 border-primary-600 dark:border-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } group flex items-center justify-between px-4 py-2 text-sm font-medium rounded-r-lg transition-colors`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <span className="mr-2 text-base">📂</span>
                        <span className="truncate">Sem pasta</span>
                      </div>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        {getSubjectCount(null)}
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </nav>
        </div>
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
          <div className="relative user-menu-container">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(!showUserMenu);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                  {getUserInitials()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Menu dropdown do usuário */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                {userMenuItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserMenu(false);
                      }}
                      className={`${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } flex items-center px-4 py-3 text-sm font-medium transition-colors`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  );
                })}
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <span className="mr-3 text-lg">🚪</span>
                    Sair
                  </button>
                </div>
              </div>
            )}
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

