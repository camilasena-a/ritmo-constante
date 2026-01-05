import { useState, useEffect, useCallback } from 'react';
import { studySessionsApi } from '../api/studySessions';
import { subjectsApi } from '../api/subjects';

export default function StudySessionForm({ onSuccess, onCancel }) {
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    subjectId: '',
    duration: 60,
    type: 'study',
    questions: 0,
    correctAnswers: 0,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSubjects = useCallback(async () => {
    try {
      const data = await subjectsApi.getAll();
      setSubjects(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, subjectId: data[0].id }));
      }
    } catch (error) {
      console.error('Erro ao carregar matérias:', error);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (formData.correctAnswers > formData.questions) {
        setError('Acertos não podem ser maiores que as questões resolvidas.');
        setLoading(false);
        return;
      }

      if (formData.type === 'questions' && formData.questions <= 0) {
        setError('Sessões de questões precisam registrar pelo menos 1 questão.');
        setLoading(false);
        return;
      }

      await studySessionsApi.create(formData);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao registrar sessão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Matéria
        </label>
        <select
          required
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tipo
        </label>
        <select
          className="input"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="study">Estudo</option>
          <option value="review">Revisão</option>
          <option value="questions">Questões</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Duração (minutos)
        </label>
        <input
          type="number"
          required
          min="1"
          className="input"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Questões resolvidas
          </label>
          <input
            type="number"
            required
            min="0"
            className="input"
            value={formData.questions}
            onChange={(e) => {
              const value = Math.max(0, parseInt(e.target.value, 10) || 0);
              setFormData((prev) => ({
                ...prev,
                questions: value,
                correctAnswers: Math.min(prev.correctAnswers, value),
              }));
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Acertos
          </label>
          <input
            type="number"
            required
            min="0"
            max={formData.questions}
            className="input"
            value={formData.correctAnswers}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              const value = Math.max(0, Math.min(parsed || 0, formData.questions));
              setFormData({ ...formData, correctAnswers: value });
            }}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use zero se não houver questões corretas.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Observações (opcional)
        </label>
        <textarea
          className="input"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Registrando...' : 'Registrar Sessão'}
        </button>
      </div>
    </form>
  );
}


