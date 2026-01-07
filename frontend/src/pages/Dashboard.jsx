import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statisticsApi } from '../api/statistics';
import { studySessionsApi } from '../api/studySessions';
import { revisionsApi } from '../api/revisions';
import { studyCyclesApi } from '../api/studyCycles';
import Loading from '../components/Loading';
import StudySessionForm from '../components/StudySessionForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEventListener } from '../hooks/useEventListener';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [pendingRevisions, setPendingRevisions] = useState([]);
  const [activeCycle, setActiveCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionForm, setShowSessionForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Escutar eventos para sincronizar dados
  useEventListener(
    [
      'studySession:created',
      'revision:completed',
      'studyCycle:updated',
      'studyCycle:advanced',
      'subject:created',
      'subject:updated',
      'subject:deleted',
    ],
    () => {
      loadData();
    }
  );

  const loadData = async () => {
    try {
      const [overviewData, sessionsData, revisionsData, cycleData] = await Promise.all([
        statisticsApi.getOverview('7'),
        studySessionsApi.getAll({ startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }),
        revisionsApi.getPending(),
        studyCyclesApi.getActive().catch(() => null),
      ]);

      setOverview(overviewData);
      setRecentSessions(sessionsData.slice(0, 5));
      setPendingRevisions(revisionsData.slice(0, 5));
      setActiveCycle(cycleData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  if (loading) return <Loading />;

  const handleSessionSuccess = () => {
    setShowSessionForm(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Visão geral dos seus estudos</p>
        </div>
        <button
          onClick={() => setShowSessionForm(true)}
          className="btn btn-primary w-full sm:w-auto"
        >
          + Registrar Sessão
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tempo estudado (7 dias)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {overview ? formatTime(overview.totalTime) : '0min'}
              </p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Questões resolvidas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {overview?.totalQuestions || 0}
              </p>
            </div>
            <div className="text-3xl">📝</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de acerto</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {overview?.accuracy ? `${(overview.accuracy * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sequência (Streak)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {overview?.streak || 0} dias
              </p>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ciclo ativo */}
        {activeCycle && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ciclo Ativo</h2>
              <Link to="/study-cycle" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                Ver detalhes →
              </Link>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{activeCycle.name}</p>
            {activeCycle.cycleItems && activeCycle.cycleItems.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Próxima matéria:</p>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: activeCycle.cycleItems[activeCycle.currentIndex]?.subject?.color || '#6366f1' }}
                  />
                  <span className="font-medium">
                    {activeCycle.cycleItems[activeCycle.currentIndex]?.subject?.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Revisões pendentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Revisões Pendentes</h2>
            <Link to="/revisions" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              Ver todas →
            </Link>
          </div>
          {pendingRevisions.length > 0 ? (
            <div className="space-y-3">
              {pendingRevisions.map((revision) => (
                <div key={revision.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{revision.subject?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(revision.scheduledDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Nenhuma revisão pendente</p>
          )}
        </div>
      </div>

      {/* Sessões recentes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Sessões Recentes</h2>
          <Link to="/statistics" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
            Ver todas →
          </Link>
        </div>
        {recentSessions.length > 0 ? (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: session.subject?.color || '#6366f1' }}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{session.subject?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(session.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • {formatTime(session.duration)}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                  {session.type === 'study' ? 'Estudo' : session.type === 'review' ? 'Revisão' : 'Questões'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Nenhuma sessão registrada ainda</p>
        )}
      </div>

      {/* Modal de registro de sessão */}
      {showSessionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Registrar Sessão de Estudo</h2>
            <StudySessionForm
              onSuccess={handleSessionSuccess}
              onCancel={() => setShowSessionForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

