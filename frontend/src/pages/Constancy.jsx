import { useEffect, useState } from 'react';
import { statisticsApi } from '../api/statistics';
import Loading from '../components/Loading';
import { format, startOfYear, endOfYear, eachDayOfInterval, isSameDay } from 'date-fns';

export default function Constancy() {
  const [constancyData, setConstancyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      const data = await statisticsApi.getConstancy(year);
      setConstancyData(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensity = (minutes) => {
    if (minutes === 0) return 0;
    if (minutes < 30) return 1;
    if (minutes < 60) return 2;
    if (minutes < 120) return 3;
    return 4;
  };

  const getColor = (intensity) => {
    const colors = [
      '#ebedf0', // nenhum
      '#9be9a8', // pouco
      '#40c463', // médio
      '#30a14e', // bom
      '#216e39', // muito
    ];
    return colors[intensity] || colors[0];
  };

  // Criar grid do ano
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 11, 31));
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Agrupar por semanas
  const weeks = [];
  let currentWeek = [];
  
  allDays.forEach((day, index) => {
    if (index % 7 === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    const dayData = constancyData.find((d) => isSameDay(new Date(d.date), day));
    currentWeek.push({
      date: day,
      studied: dayData?.studied || false,
      minutes: dayData?.minutes || 0,
    });
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Constância</h1>
          <p className="mt-2 text-gray-600">Acompanhe sua frequência de estudos</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="input w-32"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Calendário de Contribuições</h2>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-gray-600">Menos</span>
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map((intensity) => (
                <div
                  key={intensity}
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: getColor(intensity) }}
                />
              ))}
            </div>
            <span className="text-gray-600">Mais</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex space-x-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {week.map((day, dayIndex) => {
                  const intensity = getIntensity(day.minutes);
                  return (
                    <div
                      key={dayIndex}
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getColor(intensity) }}
                      title={`${format(day.date, 'dd/MM/yyyy')}: ${day.minutes} minutos`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600">Dias estudados</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {constancyData.filter((d) => d.studied).length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Total de minutos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {constancyData.reduce((sum, d) => sum + d.minutes, 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">Média diária</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {constancyData.length > 0
              ? Math.round(
                  constancyData.reduce((sum, d) => sum + d.minutes, 0) / constancyData.length
                )
              : 0}{' '}
            minutos
          </p>
        </div>
      </div>
    </div>
  );
}




