import { useEffect, useState } from 'react';
import { statisticsApi } from '../api/statistics';
import Loading from '../components/Loading';
import { useEventListener } from '../hooks/useEventListener';
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
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadData();
  }, [period]);

  // Escutar eventos para sincronizar dados
  useEventListener(
    [
      'studySession:created',
      'revision:completed',
      'subject:created',
      'subject:updated',
      'subject:deleted',
    ],
    () => {
      loadData();
    },
    [period]
  );

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

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  if (loading) return <Loading />;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Estatísticas</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Acompanhe seu desempenho</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>

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
    </div>
  );
}





