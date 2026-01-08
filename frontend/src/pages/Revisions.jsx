import { useEffect, useState } from 'react';
import { revisionsApi } from '../api/revisions';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEventEmitter } from '../hooks/useEventEmitter';

export default function Revisions() {
  const { emit } = useEventEmitter();
  const [revisions, setRevisions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, all, completed
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1); // Resetar página ao mudar filtro
  }, [filter]);

  useEffect(() => {
    loadRevisions();
  }, [filter, page]);

  const loadRevisions = async () => {
    setLoading(true);
    try {
      let data;
      if (filter === 'pending') {
        data = await revisionsApi.getPending({ page, limit: 20 });
      } else {
        data = await revisionsApi.getAll({ completed: filter === 'completed', page, limit: 20 });
      }
      
      // Compatibilidade com resposta paginada ou não paginada
      if (data && data.data && data.pagination) {
        setRevisions(data.data);
        setPagination(data.pagination);
      } else if (data && Array.isArray(data)) {
        // Resposta antiga (array direto)
        setRevisions(data);
        setPagination(null);
      } else {
        setRevisions([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('Erro ao carregar revisões:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await revisionsApi.complete(id);
      
      // Emitir evento para sincronizar outros componentes
      emit('revision:completed', { revisionId: id });
      
      await loadRevisions();
    } catch (error) {
      console.error('Erro ao completar revisão:', error);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Revisões</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Gerencie suas revisões programadas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`btn text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            aria-label="Filtrar revisões pendentes"
            aria-pressed={filter === 'pending'}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`btn text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            aria-label="Mostrar todas as revisões"
            aria-pressed={filter === 'all'}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`btn text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            aria-label="Filtrar revisões concluídas"
            aria-pressed={filter === 'completed'}
          >
            Concluídas
          </button>
        </div>
      </div>

      {revisions.length > 0 ? (
        <>
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
                        className="btn btn-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        aria-label={`Marcar revisão de ${revision.subject?.name} como concluída`}
                      >
                        Marcar como concluída
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {pagination && (
            <Pagination pagination={pagination} onPageChange={setPage} />
          )}
        </>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500">Nenhuma revisão encontrada</p>
        </div>
      )}
    </div>
  );
}





