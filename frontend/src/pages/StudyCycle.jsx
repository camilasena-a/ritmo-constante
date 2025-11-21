import { useEffect, useState } from 'react';
import { studyCyclesApi } from '../api/studyCycles';
import { subjectsApi } from '../api/subjects';
import Loading from '../components/Loading';

export default function StudyCycle() {
  const [cycles, setCycles] = useState([]);
  const [activeCycle, setActiveCycle] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', items: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cyclesData, subjectsData] = await Promise.all([
        studyCyclesApi.getAll(),
        subjectsApi.getAll(),
      ]);
      setCycles(cyclesData);
      setActiveCycle(cyclesData.find(c => c.active) || null);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async () => {
    try {
      const cycle = await studyCyclesApi.create({
        ...formData,
        active: true,
      });
      await loadData();
      setShowCreateModal(false);
      setFormData({ name: '', items: [] });
    } catch (error) {
      console.error('Erro ao criar ciclo:', error);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { subjectId: '', order: formData.items.length, weight: 1 }],
    });
  };

  const handleAdvance = async () => {
    if (!activeCycle) return;
    try {
      await studyCyclesApi.advance(activeCycle.id);
      await loadData();
    } catch (error) {
      console.error('Erro ao avançar ciclo:', error);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ciclo de Estudos</h1>
          <p className="mt-2 text-gray-600">Gerencie seus ciclos de estudos personalizados</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          + Novo Ciclo
        </button>
      </div>

      {activeCycle ? (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{activeCycle.name}</h2>
              <p className="text-gray-600 mt-1">Ciclo ativo</p>
            </div>
            <button onClick={handleAdvance} className="btn btn-primary">
              Avançar para próximo
            </button>
          </div>

          {activeCycle.cycleItems && activeCycle.cycleItems.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">Matérias do ciclo:</h3>
              {activeCycle.cycleItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    index === activeCycle.currentIndex
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.subject?.color || '#6366f1' }}
                    />
                    <span className="font-medium text-gray-900">{item.subject?.name}</span>
                    {index === activeCycle.currentIndex && (
                      <span className="text-xs px-2 py-1 bg-primary-600 text-white rounded-full">
                        Próxima
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Peso: {item.weight} • {item.targetTime ? `${item.targetTime}min` : ''} {item.targetQuestions ? `${item.targetQuestions} questões` : ''}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Adicione matérias ao ciclo</p>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Nenhum ciclo ativo</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Criar primeiro ciclo
          </button>
        </div>
      )}

      {/* Modal de criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Criar Novo Ciclo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do ciclo
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Ciclo Semanal"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Matérias
                  </label>
                  <button onClick={handleAddItem} className="text-sm text-primary-600">
                    + Adicionar
                  </button>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <select
                      className="input flex-1"
                      value={item.subjectId}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].subjectId = e.target.value;
                        setFormData({ ...formData, items: newItems });
                      }}
                    >
                      <option value="">Selecione uma matéria</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="input w-24"
                      placeholder="Peso"
                      value={item.weight}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].weight = parseInt(e.target.value) || 1;
                        setFormData({ ...formData, items: newItems });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', items: [] });
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleCreateCycle} className="btn btn-primary">
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





