import { useEffect, useState } from 'react';
import { subjectsApi } from '../api/subjects';
import Loading from '../components/Loading';

export default function Settings() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', color: '#6366f1', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const subjectsData = await subjectsApi.getAll();
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    try {
      await subjectsApi.create(subjectForm);
      await loadData();
      setShowSubjectModal(false);
      setSubjectForm({ name: '', color: '#6366f1', description: '' });
    } catch (error) {
      console.error('Erro ao criar matéria:', error);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta matéria?')) {
      try {
        await subjectsApi.delete(id);
        await loadData();
      } catch (error) {
        console.error('Erro ao deletar matéria:', error);
      }
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-2 text-gray-600">Gerencie suas preferências</p>
      </div>

      {/* Matérias */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Matérias</h2>
          <button
            onClick={() => setShowSubjectModal(true)}
            className="btn btn-primary"
          >
            + Nova Matéria
          </button>
        </div>
        <div className="space-y-3">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <div>
                  <p className="font-medium text-gray-900">{subject.name}</p>
                  {subject.description && (
                    <p className="text-sm text-gray-500">{subject.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteSubject(subject.id)}
                className="btn btn-danger text-sm"
              >
                Deletar
              </button>
            </div>
          ))}
          {subjects.length === 0 && (
            <p className="text-gray-500 text-center py-8">Nenhuma matéria cadastrada</p>
          )}
        </div>
      </div>

      {/* Modal de criação de matéria */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Nova Matéria</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  className="input"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="Ex: Matemática"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <input
                  type="color"
                  className="w-full h-10 rounded"
                  value={subjectForm.color}
                  onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSubjectModal(false);
                  setSubjectForm({ name: '', color: '#6366f1', description: '' });
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleCreateSubject} className="btn btn-primary">
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

