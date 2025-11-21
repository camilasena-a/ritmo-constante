import { useEffect, useState } from 'react';
import { weeklyPlansApi } from '../api/weeklyPlans';
import { subjectsApi } from '../api/subjects';
import Loading from '../components/Loading';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WeeklyPlan() {
  const [plan, setPlan] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentWeek]);

  const loadData = async () => {
    try {
      const [planData, subjectsData] = await Promise.all([
        weeklyPlansApi.getByWeek(currentWeek.toISOString()),
        subjectsApi.getAll(),
      ]);
      setPlan(planData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getDayItems = (date) => {
    if (!plan?.planItems) return [];
    return plan.planItems.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getDate() === date.getDate() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getFullYear() === date.getFullYear()
      );
    });
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quadro Semanal</h1>
          <p className="mt-2 text-gray-600">Planejamento semanal de estudos</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="btn btn-secondary"
          >
            ← Semana anterior
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="btn btn-secondary"
          >
            Hoje
          </button>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="btn btn-secondary"
          >
            Próxima semana →
          </button>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayItems = getDayItems(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <div
                key={day.toISOString()}
                className={`border rounded-lg p-3 ${
                  isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
              >
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    {format(day, 'EEE', { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(day, 'dd/MM', { locale: ptBR })}
                  </p>
                </div>
                <div className="space-y-2">
                  {dayItems.length > 0 ? (
                    dayItems.map((item) => (
                      <div
                        key={item.id}
                        className={`text-xs p-2 rounded ${
                          item.completed
                            ? 'bg-green-100 text-green-800'
                            : item.type === 'review'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.type === 'review' ? '📚 Revisão' : '📖 Estudo'}
                        {item.subjectId && (
                          <span className="block mt-1">
                            {subjects.find((s) => s.id === item.subjectId)?.name}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">Sem atividades</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}




