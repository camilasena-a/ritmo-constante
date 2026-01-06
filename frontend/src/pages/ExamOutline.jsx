import { useEffect, useState } from 'react';
import { examOutlinesApi } from '../api/examOutlines';
import { subjectsApi } from '../api/subjects';
import Loading from '../components/Loading';

export default function ExamOutline() {
  const [outlines, setOutlines] = useState([]);
  const [selectedOutline, setSelectedOutline] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ subjectId: '', name: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [outlinesData, subjectsData] = await Promise.all([
        examOutlinesApi.getAll(),
        subjectsApi.getAll(),
      ]);
      setOutlines(outlinesData);
      setSubjects(subjectsData);
      if (outlinesData.length > 0 && !selectedOutline) {
        setSelectedOutline(outlinesData[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOutlineDetails = async (id) => {
    try {
      const outline = await examOutlinesApi.getById(id);
      setSelectedOutline(outline);
    } catch (error) {
      console.error('Erro ao carregar edital:', error);
    }
  };

  const handleCreateOutline = async () => {
    try {
      await examOutlinesApi.create(formData);
      await loadData();
      setShowCreateModal(false);
      setFormData({ subjectId: '', name: '', description: '' });
    } catch (error) {
      console.error('Erro ao criar edital:', error);
    }
  };

  const handleToggleStudied = async (itemId, currentValue) => {
    try {
      await examOutlinesApi.updateItem(selectedOutline.id, itemId, {
        studied: !currentValue,
      });
      await loadOutlineDetails(selectedOutline.id);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  const handleToggleReviewed = async (itemId, currentValue) => {
    try {
      await examOutlinesApi.updateItem(selectedOutline.id, itemId, {
        reviewed: !currentValue,
      });
      await loadOutlineDetails(selectedOutline.id);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edital Verticalizado</h1>
          <p className="mt-2 text-gray-600">Acompanhe o progresso do edital por disciplina</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          + Novo Edital
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de editais */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Editais</h2>
            <div className="space-y-2">
              {outlines.map((outline) => (
                <button
                  key={outline.id}
                  onClick={() => loadOutlineDetails(outline.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedOutline?.id === outline.id
                      ? 'bg-primary-50 border-2 border-primary-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium text-gray-900">{outline.name}</p>
                  <p className="text-sm text-gray-500">{outline.subject?.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detalhes do edital */}
        <div className="lg:col-span-2">
          {selectedOutline ? (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedOutline.name}</h2>
                <p className="text-gray-600 mt-1">{selectedOutline.subject?.name}</p>
                {selectedOutline.progress && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progresso</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedOutline.progress.studied} / {selectedOutline.progress.total} estudados
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${selectedOutline.progress.studiedPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {selectedOutline.items && selectedOutline.items.length > 0 ? (
                  selectedOutline.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleStudied(item.id, item.studied)}
                          className={`px-3 py-1 rounded text-sm ${
                            item.studied
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.studied ? '✓ Estudado' : 'Marcar como estudado'}
                        </button>
                        <button
                          onClick={() => handleToggleReviewed(item.id, item.reviewed)}
                          className={`px-3 py-1 rounded text-sm ${
                            item.reviewed
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.reviewed ? '✓ Revisado' : 'Marcar como revisado'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhum item no edital</p>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-500">Selecione um edital para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Criar Novo Edital</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matéria
                </label>
                <select
                  className="input"
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                >
                  <option value="">Selecione uma matéria</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do edital
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Edital Concurso X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ subjectId: '', name: '', description: '' });
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleCreateOutline} className="btn btn-primary">
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





