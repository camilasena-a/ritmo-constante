import { useEffect, useState } from 'react';
import { statisticsApi } from '../api/statistics';
import { studySessionsApi } from '../api/studySessions';
import { Skeleton, SkeletonGrid, SkeletonChart, SkeletonTable } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import useToastStore from '../store/toastStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
);

export default function Statistics() {
  const [overview, setOverview] = useState(null);
  const [bySubject, setBySubject] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionsPagination, setSessionsPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [period, setPeriod] = useState('30');
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsFilter, setSessionsFilter] = useState({ subjectId: '', type: '', startDate: '', endDate: '' });
  const [showDeleteSessionModal, setShowDeleteSessionModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, [period]);

  useEffect(() => {
    loadSessions();
  }, [sessionsPage, sessionsFilter, period]);

  const loadData = async () => {
    try {
      const [overviewData, bySubjectData, timelineData] = await Promise.all([
        statisticsApi.getOverview(period),
        statisticsApi.getBySubject(period),
        statisticsApi.getTimeline(period, 'day'),
      ]);
      setOverview(overviewData);
      setBySubject(bySubjectData);
      setTimeline(timelineData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const params = {
        page: sessionsPage,
        limit: 20,
        startDate: sessionsFilter.startDate || startDate.toISOString(),
        endDate: sessionsFilter.endDate || new Date().toISOString(),
        ...(sessionsFilter.subjectId && { subjectId: sessionsFilter.subjectId }),
        ...(sessionsFilter.type && { type: sessionsFilter.type }),
      };

      const sessionsData = await studySessionsApi.getAll(params);
      
      if (sessionsData.data && sessionsData.pagination) {
        setSessions(sessionsData.data);
        setSessionsPagination(sessionsData.pagination);
      } else {
        setSessions(sessionsData);
        setSessionsPagination(null);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const handleFilterChange = (field, value) => {
    setSessionsFilter(prev => ({ ...prev, [field]: value }));
    setSessionsPage(1); // Resetar página ao mudar filtro
  };

  const handleDeleteSessionClick = (sessionId) => {
    setSessionToDelete(sessionId);
    setShowDeleteSessionModal(true);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await studySessionsApi.delete(sessionToDelete);
      useToastStore.getState().success('Sessão deletada com sucesso!');
      await loadSessions();
      await loadData(); // Recarregar estatísticas
      setSessionToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar sessão:', error);
      // O toast de erro já será exibido pelo client.js
    }
  };

  const timelineChartData = {
    labels: timeline.map((item) => new Date(item.date).toLocaleDateString('pt-BR')),
    datasets: [
      {
        label: 'Tempo estudado (minutos)',
        data: timeline.map((item) => item.totalTime),
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
      },
    ],
  };

  const accuracyChartData = {
    labels: timeline.map((item) => new Date(item.date).toLocaleDateString('pt-BR')),
    datasets: [
      {
        label: 'Taxa de acerto (%)',
        data: timeline.map((item) => (item.accuracy * 100).toFixed(1)),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
      },
    ],
  };

  const radarChartData = {
    labels: bySubject.map((item) => item.subject.name),
    datasets: [
      {
        label: 'Desempenho',
        data: bySubject.map((item) => (item.accuracy * 100).toFixed(1)),
        backgroundColor: 'rgba(14, 165, 233, 0.2)',
        borderColor: 'rgb(14, 165, 233)',
      },
    ],
  };

  const barChartData = {
    labels: bySubject.map((item) => item.subject.name),
    datasets: [
      {
        label: 'Tempo estudado (minutos)',
        data: bySubject.map((item) => item.totalTime),
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Estatísticas</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Acompanhe seu desempenho</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="input w-48"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>

      {loading ? (
        <>
          {/* Resumo - Skeleton */}
          <SkeletonGrid items={4} columns={4} />

          {/* Gráficos - Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
          </div>

          {/* Tabela - Skeleton */}
          <SkeletonTable rows={5} columns={5} />
        </>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600">Tempo total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {overview ? formatTime(overview.totalTime) : '0min'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Questões</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {overview?.totalQuestions || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Taxa de acerto</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {overview?.accuracy ? `${(overview.accuracy * 100).toFixed(1)}%` : '0%'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Dias estudados</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {overview?.daysStudied || 0}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Evolução do Tempo</h2>
          {timeline.length > 0 ? (
            <Line data={timelineChartData} />
          ) : (
            <p className="text-gray-500 text-center py-8">Sem dados para exibir</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Evolução da Taxa de Acerto</h2>
          {timeline.length > 0 ? (
            <Line data={accuracyChartData} />
          ) : (
            <p className="text-gray-500 text-center py-8">Sem dados para exibir</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Desempenho por Disciplina</h2>
          {bySubject.length > 0 ? (
            <Radar data={radarChartData} />
          ) : (
            <p className="text-gray-500 text-center py-8">Sem dados para exibir</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tempo por Disciplina</h2>
          {bySubject.length > 0 ? (
            <Bar data={barChartData} />
          ) : (
            <p className="text-gray-500 text-center py-8">Sem dados para exibir</p>
          )}
        </div>
      </div>

      {/* Tabela por matéria */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Detalhes por Matéria</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Matéria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tempo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Questões
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acertos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Taxa de Acerto
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bySubject.map((item) => (
                <tr key={item.subject.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: item.subject.color }}
                      />
                      <span className="font-medium text-gray-900">{item.subject.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(item.totalTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.totalQuestions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.totalCorrect}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(item.accuracy * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lista de sessões com paginação */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Todas as Sessões</h2>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <select
            value={sessionsFilter.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="input"
          >
            <option value="">Todos os tipos</option>
            <option value="study">Estudo</option>
            <option value="review">Revisão</option>
            <option value="questions">Questões</option>
          </select>
          <input
            type="date"
            value={sessionsFilter.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="input"
            placeholder="Data inicial"
          />
          <input
            type="date"
            value={sessionsFilter.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="input"
            placeholder="Data final"
          />
          <button
            onClick={() => {
              setSessionsFilter({ subjectId: '', type: '', startDate: '', endDate: '' });
              setSessionsPage(1);
            }}
            className="btn btn-secondary"
          >
            Limpar Filtros
          </button>
        </div>

        {sessionsLoading ? (
          <SkeletonList items={5} />
        ) : sessions.length > 0 ? (
          <>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: session.subject?.color || '#6366f1' }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{session.subject?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(session.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • {formatTime(session.duration)}
                      </p>
                      {session.questions > 0 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {session.questions} questões • {session.correctAnswers} acertos ({((session.correctAnswers / session.questions) * 100).toFixed(1)}%)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                      {session.type === 'study' ? 'Estudo' : session.type === 'review' ? 'Revisão' : 'Questões'}
                    </span>
                    <button
                      onClick={() => handleDeleteSessionClick(session.id)}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      title="Deletar sessão"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {sessionsPagination && (
              <Pagination pagination={sessionsPagination} onPageChange={setSessionsPage} className="mt-4" />
            )}
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhuma sessão encontrada</p>
        )}
      </div>
        </>
      )}

      {/* Modal de confirmação para deletar sessão */}
      <ConfirmModal
        isOpen={showDeleteSessionModal}
        onClose={() => {
          setShowDeleteSessionModal(false);
          setSessionToDelete(null);
        }}
        onConfirm={handleDeleteSession}
        title="Deletar Sessão"
        message="Tem certeza que deseja deletar esta sessão de estudo? Esta ação não pode ser desfeita e afetará suas estatísticas."
        confirmText="Deletar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}





