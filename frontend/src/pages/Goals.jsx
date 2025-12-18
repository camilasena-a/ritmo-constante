import { useEffect, useState } from 'react';
import { goalsApi } from '../api/goals';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import useToastStore from '../store/toastStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    type: 'daily_hours',
    targetValue: 2,
    active: true,
    startDate: new Date().toISOString(),
    endDate: null,
  });
  const showToast = useToastStore((state) => state.showToast);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goalsData, progressData] = await Promise.all([
        goalsApi.getAll({ active: true }),
        goalsApi.getProgressOverview('week'),
      ]);
      setGoals(goalsData);
      setProgress(progressData.progress || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar metas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await goalsApi.update(editingGoal.id, formData);
        showToast('Meta atualizada com sucesso!', 'success');
      } else {
        await goalsApi.create(formData);
        showToast('Meta criada com sucesso!', 'success');
      }
      setShowForm(false);
      setEditingGoal(null);
      setFormData({
        type: 'daily_hours',
        targetValue: 2,
        active: true,
        startDate: new Date().toISOString(),
        endDate: null,
      });
      loadData();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      showToast('Erro ao salvar meta', 'error');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      type: goal.type,
      targetValue: goal.targetValue,
      active: goal.active,
      startDate: goal.startDate ? new Date(goal.startDate).toISOString() : new Date().toISOString(),
      endDate: goal.endDate ? new Date(goal.endDate).toISOString() : null,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;
    try {
      await goalsApi.delete(id);
      showToast('Meta excluída com sucesso!', 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      showToast('Erro ao excluir meta', 'error');
    }
  };

  const toggleActive = async (goal) => {
    try {
      await goalsApi.update(goal.id, { active: !goal.active });
      showToast(`Meta ${!goal.active ? 'ativada' : 'desativada'} com sucesso!`, 'success');
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      showToast('Erro ao atualizar meta', 'error');
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressInfo = (goalId) => {
    return progress.find((p) => p.goalId === goalId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Metas e Objetivos</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Defina e acompanhe suas metas de estudo</p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setFormData({
              type: 'daily_hours',
              targetValue: 2,
              active: true,
              startDate: new Date().toISOString(),
              endDate: null,
            });
            setShowForm(true);
          }}
          className="btn btn-primary"
        >
          + Nova Meta
        </button>
      </div>

      {loading ? (
        <>
          <Skeleton height="200px" />
          <SkeletonList items={3} />
        </>
      ) : (
        <>
          {/* Cards de progresso */}
          {progress.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {progress.map((prog) => {
                const goal = goals.find((g) => g.id === prog.goalId);
                if (!goal) return null;

                return (
                  <div key={prog.goalId} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {goal.type === 'daily_hours' ? 'Horas por Dia' : 'Questões por Semana'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Meta: {prog.targetValue} {prog.unit}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleActive(goal)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          goal.active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {goal.active ? 'Ativa' : 'Inativa'}
                      </button>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Progresso atual</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {prog.currentValue.toFixed(1)} {prog.unit.split('/')[0]}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all ${getProgressColor(prog.percentage)}`}
                          style={{ width: `${Math.min(prog.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {prog.percentage.toFixed(1)}% da meta
                        </span>
                        {prog.percentage >= 100 && (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            🎉 Meta alcançada!
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-4">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="flex-1 btn btn-secondary text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="btn btn-danger text-sm"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lista de todas as metas */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Todas as Metas</h2>
            {goals.length > 0 ? (
              <div className="space-y-3">
                {goals.map((goal) => {
                  const prog = getProgressInfo(goal.id);
                  return (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">
                            {goal.type === 'daily_hours' ? '⏱️' : '📝'}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {goal.type === 'daily_hours' ? 'Horas por Dia' : 'Questões por Semana'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Meta: {goal.targetValue} {goal.type === 'daily_hours' ? 'horas/dia' : 'questões/semana'}
                            </p>
                            {prog && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Atual: {prog.currentValue.toFixed(1)} ({prog.percentage.toFixed(1)}%)
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            goal.active
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {goal.active ? 'Ativa' : 'Inativa'}
                        </span>
                        <button
                          onClick={() => handleEdit(goal)}
                          className="btn btn-secondary text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="btn btn-danger text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhuma meta cadastrada. Clique em "Nova Meta" para começar!
              </p>
            )}
          </div>
        </>
      )}

      {/* Modal de formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Meta
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="daily_hours">Horas por Dia</option>
                  <option value="weekly_questions">Questões por Semana</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor da Meta
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
                  className="input w-full"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.type === 'daily_hours' ? 'Horas por dia' : 'Questões por semana'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Início
                </label>
                <input
                  type="datetime-local"
                  value={
                    formData.startDate
                      ? format(new Date(formData.startDate), "yyyy-MM-dd'T'HH:mm", { locale: ptBR })
                      : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDate: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString(),
                    })
                  }
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Término (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={
                    formData.endDate ? format(new Date(formData.endDate), "yyyy-MM-dd'T'HH:mm", { locale: ptBR }) : ''
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                  className="input w-full"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
                  Meta ativa
                </label>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingGoal ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

