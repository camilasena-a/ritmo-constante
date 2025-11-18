import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await subjectsApi.getAll();
      setSubjects(data);
      if (data.length > 0) {
        setFormData({ ...formData, subjectId: data[0].id });
      }
    } catch (error) {
      console.error('Erro ao carregar matérias:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
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

      {(formData.type === 'questions' || formData.type === 'study') && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Questões resolvidas
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={formData.questions}
              onChange={(e) => setFormData({ ...formData, questions: parseInt(e.target.value) || 0 })}
            />
          </div>

          {formData.questions > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acertos
              </label>
              <input
                type="number"
                min="0"
                max={formData.questions}
                className="input"
                value={formData.correctAnswers}
                onChange={(e) => setFormData({ ...formData, correctAnswers: parseInt(e.target.value) || 0 })}
              />
            </div>
          )}
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
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

