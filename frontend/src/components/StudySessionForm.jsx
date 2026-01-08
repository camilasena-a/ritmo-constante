import { useState, useEffect } from 'react';
import { studySessionsApi } from '../api/studySessions';
import { subjectsApi } from '../api/subjects';
import { useEventEmitter } from '../hooks/useEventEmitter';

export default function StudySessionForm({ onSuccess, onCancel }) {
  const { emit } = useEventEmitter();
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

      const session = await studySessionsApi.create(formData);
      
      // Emitir evento para sincronizar outros componentes
      emit('studySession:created', { session, formData });
      
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao registrar sessão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulário de registro de sessão de estudo">
      {error && (
        <div 
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Matéria
        </label>
        <select
          id="subject-select"
          name="subject"
          required
          className="input"
          value={formData.subjectId}
          onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
          aria-required="true"
          aria-describedby="subject-description"
        >
          <option value="">Selecione uma matéria</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <span id="subject-description" className="sr-only">Selecione a matéria estudada nesta sessão</span>
      </div>

      <div>
        <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tipo
        </label>
        <select
          id="type-select"
          name="type"
          className="input"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          aria-describedby="type-description"
        >
          <option value="study">Estudo</option>
          <option value="review">Revisão</option>
          <option value="questions">Questões</option>
        </select>
        <span id="type-description" className="sr-only">Tipo de sessão de estudo</span>
      </div>

      <div>
        <label htmlFor="duration-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Duração (minutos)
        </label>
        <input
          id="duration-input"
          name="duration"
          type="number"
          required
          min="1"
          className="input"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
          aria-required="true"
          aria-describedby="duration-description"
        />
        <span id="duration-description" className="sr-only">Duração da sessão em minutos</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="questions-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Questões resolvidas
          </label>
          <input
            id="questions-input"
            name="questions"
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
            aria-required="true"
            aria-describedby="questions-description"
          />
          <span id="questions-description" className="sr-only">Número total de questões resolvidas</span>
        </div>

        <div>
          <label htmlFor="correct-answers-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Acertos
          </label>
          <input
            id="correct-answers-input"
            name="correctAnswers"
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
            aria-required="true"
            aria-describedby="correct-answers-description"
            aria-valuemax={formData.questions}
          />
          <p id="correct-answers-description" className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Use zero se não houver questões corretas.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="notes-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Observações (opcional)
        </label>
        <textarea
          id="notes-textarea"
          name="notes"
          className="input"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          aria-describedby="notes-description"
        />
        <span id="notes-description" className="sr-only">Observações adicionais sobre a sessão de estudo</span>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn btn-secondary"
            aria-label="Cancelar registro de sessão"
          >
            Cancelar
          </button>
        )}
        <button 
          type="submit" 
          disabled={loading} 
          className="btn btn-primary"
          aria-label={loading ? 'Registrando sessão de estudo' : 'Registrar sessão de estudo'}
          aria-busy={loading}
        >
          {loading ? 'Registrando...' : 'Registrar Sessão'}
        </button>
      </div>
    </form>
  );
}


