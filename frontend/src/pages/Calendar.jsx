import { useEffect, useState } from 'react';
import { tasksApi } from '../api/tasks';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TaskForm from '../components/TaskForm';

export default function Calendar() {
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // Todas as tarefas para o calendário
  const [tasksPagination, setTasksPagination] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [tasksPage, setTasksPage] = useState(1);
  const [tasksFilter, setTasksFilter] = useState({ completed: '' });

  useEffect(() => {
    loadTasks();
  }, [currentMonth]);

  useEffect(() => {
    loadTasksList();
  }, [tasksPage, tasksFilter, currentMonth]);

  const loadTasks = async () => {
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const tasksData = await tasksApi.getAll({
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
        limit: 100, // Limite maior para calendário mensal
      });
      
      // Compatibilidade com resposta paginada ou não paginada
      setAllTasks(tasksData.data || tasksData);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasksList = async () => {
    setTasksLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const params = {
        page: tasksPage,
        limit: 20,
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
        ...(tasksFilter.completed !== '' && { completed: tasksFilter.completed === 'true' }),
      };

      const tasksData = await tasksApi.getAll(params);
      
      if (tasksData.data && tasksData.pagination) {
        setTasks(tasksData.data);
        setTasksPagination(tasksData.pagination);
      } else {
        setTasks(tasksData);
        setTasksPagination(null);
      }
    } catch (error) {
      console.error('Erro ao carregar lista de tarefas:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (date) => {
    return allTasks.filter((task) => {
      const taskDate = new Date(task.date);
      return isSameDay(taskDate, date);
    });
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setSelectedTask(null);
    setShowTaskForm(true);
  };

  const handleTaskSuccess = () => {
    setShowTaskForm(false);
    setSelectedTask(null);
    setSelectedDate(null);
    loadTasks();
    loadTasksList();
  };

  const handleTaskDeleteClick = (taskId) => {
    setTaskToDelete(taskId);
    setShowDeleteTaskModal(true);
  };

  const handleTaskDelete = async () => {
    if (!taskToDelete) return;
    try {
      await tasksApi.delete(taskToDelete);
      loadTasks();
      loadTasksList();
      setTaskToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  const toggleTaskComplete = async (task) => {
    try {
      await tasksApi.update(task.id, { completed: !task.completed });
      loadTasks();
      loadTasksList();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  if (loading) return <Loading />;

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Calendário</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Acompanhe suas tarefas agendadas</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="btn btn-secondary"
          >
            ← Mês anterior
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="btn btn-secondary"
          >
            Hoje
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="btn btn-secondary"
          >
            Próximo mês →
          </button>
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setSelectedTask(null);
              setShowTaskForm(true);
            }}
            className="btn btn-primary"
          >
            + Nova Tarefa
          </button>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grid do calendário */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-32 border rounded-lg p-2 cursor-pointer transition-colors ${
                  isToday
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : isCurrentMonth
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
                }`}
                onClick={() => handleDayClick(day)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-400 dark:text-gray-600'
                } ${isToday ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer ${
                        task.completed
                          ? 'opacity-50 line-through'
                          : ''
                      }`}
                      style={{
                        backgroundColor: task.color ? `${task.color}20` : '#6366f120',
                        borderLeft: `3px solid ${task.color || '#6366f1'}`,
                        color: task.color || '#6366f1',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task);
                      }}
                      title={task.title}
                    >
                      {task.startTime && `${task.startTime} - `}
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayTasks.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de tarefas do mês */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Tarefas do Mês
          </h2>
          <select
            value={tasksFilter.completed}
            onChange={(e) => {
              setTasksFilter(prev => ({ ...prev, completed: e.target.value }));
              setTasksPage(1);
            }}
            className="input w-48"
          >
            <option value="">Todas</option>
            <option value="false">Pendentes</option>
            <option value="true">Concluídas</option>
          </select>
        </div>
        {tasksLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : tasks.length > 0 ? (
          <>
            <div className="space-y-2">
              {tasks
                .sort((a, b) => {
                  const dateA = new Date(a.date);
                  const dateB = new Date(b.date);
                  if (dateA.getTime() !== dateB.getTime()) {
                    return dateA - dateB;
                  }
                  return (a.startTime || '').localeCompare(b.startTime || '');
                })
                .map((task) => {
                const taskDate = new Date(task.date);
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      task.completed
                        ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        : 'bg-white dark:bg-gray-800'
                    } border-gray-200 dark:border-gray-700`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskComplete(task)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.color || '#6366f1' }}
                      />
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            task.completed
                              ? 'line-through text-gray-500 dark:text-gray-400'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(taskDate, "dd/MM/yyyy", { locale: ptBR })}
                          {task.startTime && ` às ${task.startTime}`}
                          {task.endTime && ` - ${task.endTime}`}
                        </p>
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      {task.priority && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'high'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          }`}
                        >
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTaskClick(task)}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleTaskDeleteClick(task.id)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {tasksPagination && (
              <Pagination pagination={tasksPagination} onPageChange={setTasksPage} className="mt-4" />
            )}
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa agendada para este mês</p>
        )}
      </div>

      {/* Modal de formulário de tarefa */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {selectedTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h2>
            <TaskForm
              task={selectedTask}
              initialDate={selectedDate}
              onSuccess={handleTaskSuccess}
              onCancel={() => {
                setShowTaskForm(false);
                setSelectedTask(null);
                setSelectedDate(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmação para deletar tarefa */}
      <ConfirmModal
        isOpen={showDeleteTaskModal}
        onClose={() => {
          setShowDeleteTaskModal(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleTaskDelete}
        title="Excluir Tarefa"
        message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}












