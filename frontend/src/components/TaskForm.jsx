import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../api/tasks';
import { tagsApi } from '../api/tags';
import { format } from 'date-fns';
import useToastStore from '../store/toastStore';

export default function TaskForm({ task, initialDate, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    color: '#6366f1',
    priority: 'medium',
    completed: false,
    tagIds: [],
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const loadTags = useCallback(async () => {

  useEffect(() => {
    if (task) {
      const taskDate = new Date(task.date);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        date: format(taskDate, 'yyyy-MM-dd'),
        startTime: task.startTime || '',
        endTime: task.endTime || '',
        color: task.color || '#6366f1',
        priority: task.priority || 'medium',
        completed: task.completed || false,
        tagIds: task.tags ? task.tags.map(tag => tag.id) : [],
      });
    }
  }, [task]);

  const loadTags = async () => {
    try {
      setLoadingTags(true);
      const tags = await tagsApi.getAll();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    } finally {
      setLoadingTags(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const validateField = (field, value) => {
    const errors = { ...fieldErrors };
    
    switch (field) {
      case 'title':
        if (!value || !value.trim()) {
          errors.title = 'O título da tarefa é obrigatório';
        } else {
          delete errors.title;
        }
        break;
      case 'startTime':
      case 'endTime':
        if (formData.startTime && formData.endTime) {
          const [startHour, startMin] = formData.startTime.split(':').map(Number);
          const [endHour, endMin] = formData.endTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          
          if (endMinutes <= startMinutes) {
            errors.endTime = 'O horário de término deve ser posterior ao horário de início';
          } else {
            delete errors.endTime;
          }
        } else {
          delete errors.endTime;
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
    
    if (!formData.title || !formData.title.trim()) {
      errors.title = 'O título da tarefa é obrigatório';
    }
    
    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        errors.endTime = 'O horário de término deve ser posterior ao horário de início';
      }
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
      const taskData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
      };

      if (task) {
        await tasksApi.update(task.id, taskData);
        useToastStore.getState().success('Tarefa atualizada com sucesso!');
      } else {
        await tasksApi.create(taskData);
        useToastStore.getState().success('Tarefa criada com sucesso!');
      }
      
      if (onSuccess) onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao salvar tarefa';
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

  const colorOptions = [
    { value: '#6366f1', label: 'Azul' },
    { value: '#ef4444', label: 'Vermelho' },
    { value: '#10b981', label: 'Verde' },
    { value: '#f59e0b', label: 'Laranja' },
    { value: '#8b5cf6', label: 'Roxo' },
    { value: '#ec4899', label: 'Rosa' },
    { value: '#06b6d4', label: 'Ciano' },
    { value: '#84cc16', label: 'Lima' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Título *
        </label>
        <input
          type="text"
          required
          className={`input ${fieldErrors.title ? 'border-red-500 dark:border-red-500' : ''}`}
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value });
            validateField('title', e.target.value);
          }}
          onBlur={() => validateField('title', formData.title)}
          placeholder="Ex: Revisar matemática"
        />
        {fieldErrors.title && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descrição (opcional)
        </label>
        <textarea
          className="input"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Adicione detalhes sobre a tarefa..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Data *
        </label>
        <input
          type="date"
          required
          className="input"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Horário de início (opcional)
          </label>
          <input
            type="time"
            className={`input ${fieldErrors.startTime ? 'border-red-500 dark:border-red-500' : ''}`}
            value={formData.startTime}
            onChange={(e) => {
              setFormData({ ...formData, startTime: e.target.value });
              validateField('startTime', e.target.value);
            }}
            onBlur={() => validateField('startTime', formData.startTime)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Horário de término (opcional)
          </label>
          <input
            type="time"
            className={`input ${fieldErrors.endTime ? 'border-red-500 dark:border-red-500' : ''}`}
            value={formData.endTime}
            onChange={(e) => {
              setFormData({ ...formData, endTime: e.target.value });
              validateField('endTime', e.target.value);
            }}
            onBlur={() => validateField('endTime', formData.endTime)}
          />
          {fieldErrors.endTime && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.endTime}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags (opcional)
        </label>
        {loadingTags ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Carregando tags...</div>
        ) : availableTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = formData.tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setFormData({
                        ...formData,
                        tagIds: formData.tagIds.filter(id => id !== tag.id),
                      });
                    } else {
                      setFormData({
                        ...formData,
                        tagIds: [...formData.tagIds, tag.id],
                      });
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  style={isSelected ? { backgroundColor: tag.color || '#6366f1' } : {}}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhuma tag disponível. Crie tags nas configurações para organizar suas tarefas.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cor
          </label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, color: color.value })}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  formData.color === color.value
                    ? 'border-gray-900 dark:border-gray-100 scale-110'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prioridade
          </label>
          <select
            className="input"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>

      {task && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="completed"
            checked={formData.completed}
            onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <label htmlFor="completed" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Tarefa concluída
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Salvando...' : task ? 'Atualizar Tarefa' : 'Criar Tarefa'}
        </button>
      </div>
    </form>
  );
}











