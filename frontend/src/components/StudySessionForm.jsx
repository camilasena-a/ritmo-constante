import { useState, useEffect } from 'react';
import { studySessionsApi } from '../api/studySessions';
import { useSubjects } from '../hooks/useSubjects';
import { useFolders } from '../hooks/useFolders';
import useToastStore from '../store/toastStore';

export default function StudySessionForm({ onSuccess, onCancel }) {
  // Hooks de cache para matérias e pastas
  const { data: subjects = [] } = useSubjects();
  const { data: folders = [] } = useFolders();
  
  const [selectedFolderId, setSelectedFolderId] = useState('');
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
  const [fieldErrors, setFieldErrors] = useState({});

  const getFilteredSubjects = () => {
    if (!selectedFolderId) {
      return subjects;
    }
    if (selectedFolderId === 'null') {
      return subjects.filter(s => !s.folderId);
    }
    return subjects.filter(s => s.folderId === selectedFolderId);
  };

  useEffect(() => {
    // Selecionar primeira matéria quando dados carregarem
    if (subjects.length > 0 && !formData.subjectId) {
      setFormData(prev => ({ ...prev, subjectId: subjects[0].id }));
    }
  }, [subjects]);

  useEffect(() => {
    // Resetar matéria selecionada quando a pasta mudar
    const filteredSubjects = getFilteredSubjects();
    if (filteredSubjects.length > 0) {
      const currentSubjectExists = filteredSubjects.find(s => s.id === formData.subjectId);
      if (!currentSubjectExists) {
        setFormData(prev => ({ ...prev, subjectId: filteredSubjects[0].id }));
      }
    } else {
      setFormData(prev => ({ ...prev, subjectId: '' }));
    }
  }, [selectedFolderId, subjects]);

  const validateField = (field, value) => {
    const errors = { ...fieldErrors };
    
    switch (field) {
      case 'duration':
        if (!value || value < 1) {
          errors.duration = 'Duração deve ser pelo menos 1 minuto';
        } else {
          delete errors.duration;
        }
        break;
      case 'questions':
        if (value < 0) {
          errors.questions = 'Questões não podem ser negativas';
        } else if (formData.type === 'questions' && value === 0) {
          errors.questions = 'Sessões de questões precisam ter pelo menos 1 questão';
        } else {
          delete errors.questions;
        }
        // Validar acertos quando questões mudarem
        if (formData.correctAnswers > value) {
          errors.correctAnswers = 'Acertos não podem ser maiores que as questões resolvidas';
        }
        break;
      case 'correctAnswers':
        if (value < 0) {
          errors.correctAnswers = 'Acertos não podem ser negativos';
        } else if (value > formData.questions) {
          errors.correctAnswers = 'Acertos não podem ser maiores que as questões resolvidas';
        } else {
          delete errors.correctAnswers;
        }
        break;
      case 'subjectId':
        if (!value) {
          errors.subjectId = 'Selecione uma matéria';
        } else {
          delete errors.subjectId;
        }
        break;
      default:
        break;
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.subjectId) {
      errors.subjectId = 'Selecione uma matéria';
    }
    if (!formData.duration || formData.duration < 1) {
      errors.duration = 'Duração deve ser pelo menos 1 minuto';
    }
    if (formData.questions < 0) {
      errors.questions = 'Questões não podem ser negativas';
    }
    if (formData.type === 'questions' && formData.questions === 0) {
      errors.questions = 'Sessões de questões precisam ter pelo menos 1 questão';
    }
    if (formData.correctAnswers < 0) {
      errors.correctAnswers = 'Acertos não podem ser negativos';
    }
    if (formData.correctAnswers > formData.questions) {
      errors.correctAnswers = 'Acertos não podem ser maiores que as questões resolvidas';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await studySessionsApi.create(formData);
      useToastStore.getState().success('Sessão de estudo registrada com sucesso!');
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao registrar sessão';
      setError(errorMessage);
      
      // Se houver erros de campo específicos do backend
      if (err.response?.data?.details && Array.isArray(err.response.data.details)) {
        const backendErrors = {};
        err.response.data.details.forEach((detail) => {
          if (detail.field) {
            backendErrors[detail.field] = detail.message;
          }
        });
        setFieldErrors({ ...fieldErrors, ...backendErrors });
      }
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
          Pasta (opcional)
        </label>
        <select
          className="input"
          value={selectedFolderId}
          onChange={(e) => setSelectedFolderId(e.target.value)}
        >
          <option value="">Todas as pastas</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
          <option value="null">Sem pasta</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Matéria
        </label>
        <select
          required
          className={`input ${fieldErrors.subjectId ? 'border-red-500 dark:border-red-500' : ''}`}
          value={formData.subjectId}
          onChange={(e) => {
            setFormData({ ...formData, subjectId: e.target.value });
            validateField('subjectId', e.target.value);
          }}
          onBlur={() => validateField('subjectId', formData.subjectId)}
          disabled={getFilteredSubjects().length === 0}
        >
          <option value="">
            {getFilteredSubjects().length === 0 
              ? 'Nenhuma matéria disponível nesta pasta' 
              : 'Selecione uma matéria'}
          </option>
          {getFilteredSubjects().map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
              {subject.folder && ` (${subject.folder.name})`}
            </option>
          ))}
        </select>
        {fieldErrors.subjectId && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.subjectId}</p>
        )}
        {selectedFolderId && getFilteredSubjects().length === 0 && !fieldErrors.subjectId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Esta pasta não possui matérias cadastradas.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tipo
        </label>
        <select
          className="input"
          value={formData.type}
          onChange={(e) => {
            setFormData({ ...formData, type: e.target.value });
            // Revalidar questões quando o tipo mudar
            if (e.target.value === 'questions') {
              validateField('questions', formData.questions);
            }
          }}
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
          className={`input ${fieldErrors.duration ? 'border-red-500 dark:border-red-500' : ''}`}
          value={formData.duration}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            setFormData({ ...formData, duration: value });
            validateField('duration', value);
          }}
          onBlur={() => validateField('duration', formData.duration)}
        />
        {fieldErrors.duration && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.duration}</p>
        )}
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
            className={`input ${fieldErrors.questions ? 'border-red-500 dark:border-red-500' : ''}`}
            value={formData.questions}
            onChange={(e) => {
              const value = Math.max(0, parseInt(e.target.value, 10) || 0);
              setFormData((prev) => ({
                ...prev,
                questions: value,
                correctAnswers: Math.min(prev.correctAnswers, value),
              }));
              validateField('questions', value);
            }}
            onBlur={() => validateField('questions', formData.questions)}
          />
          {fieldErrors.questions && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.questions}</p>
          )}
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
            className={`input ${fieldErrors.correctAnswers ? 'border-red-500 dark:border-red-500' : ''}`}
            value={formData.correctAnswers}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              const value = Math.max(0, Math.min(parsed || 0, formData.questions));
              setFormData({ ...formData, correctAnswers: value });
              validateField('correctAnswers', value);
            }}
            onBlur={() => validateField('correctAnswers', formData.correctAnswers)}
          />
          {fieldErrors.correctAnswers ? (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.correctAnswers}</p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Use zero se não houver questões corretas.
            </p>
          )}
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


