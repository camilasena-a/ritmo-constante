import { useEffect, useState } from 'react';
import { revisionsApi } from '../api/revisions';
import Loading from '../components/Loading';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Revisions() {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, all, completed

  useEffect(() => {
    loadRevisions();
  }, [filter]);

  const loadRevisions = async () => {
    try {
      let data;
      if (filter === 'pending') {
        data = await revisionsApi.getPending();
      } else {
        data = await revisionsApi.getAll({ completed: filter === 'completed' });
      }
      setRevisions(data);
    } catch (error) {
      console.error('Erro ao carregar revisões:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await revisionsApi.complete(id);
      await loadRevisions();
    } catch (error) {
      console.error('Erro ao completar revisão:', error);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revisões</h1>
          <p className="mt-2 text-gray-600">Gerencie suas revisões programadas</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('pending')}
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Concluídas
          </button>
        </div>
      </div>

      {revisions.length > 0 ? (
        <div className="space-y-3">
          {revisions.map((revision) => (
            <div
              key={revision.id}
              className={`card ${!revision.completed ? 'border-l-4 border-primary-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: revision.subject?.color || '#6366f1' }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{revision.subject?.name}</h3>
                    <p className="text-sm text-gray-500">
                      Agendada para: {format(new Date(revision.scheduledDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Intervalo: {revision.interval} {revision.interval === 1 ? 'dia' : 'dias'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {revision.completed ? (
                    <span className="text-sm text-green-600 font-medium">✓ Concluída</span>
                  ) : (
                    <button
                      onClick={() => handleComplete(revision.id)}
                      className="btn btn-primary text-sm"
                    >
                      Marcar como concluída
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">Nenhuma revisão encontrada</p>
        </div>
      )}
    </div>
  );
}





