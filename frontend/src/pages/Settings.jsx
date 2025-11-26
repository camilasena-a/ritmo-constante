import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { subjectsApi } from '../api/subjects';
import { foldersApi } from '../api/folders';
import Loading from '../components/Loading';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedFolderId = searchParams.get('folder');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ 
    name: '', 
    color: '#6366f1', 
    description: '',
    folderId: null,
  });
  const [folderForm, setFolderForm] = useState({ 
    name: '', 
    color: '#6366f1', 
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subjectsData, foldersData] = await Promise.all([
        subjectsApi.getAll(),
        foldersApi.getAll(),
      ]);
      setSubjects(subjectsData);
      setFolders(foldersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async () => {
    try {
      if (editingSubject) {
        await subjectsApi.update(editingSubject.id, subjectForm);
      } else {
        await subjectsApi.create(subjectForm);
      }
      await loadData();
      setShowSubjectModal(false);
      setEditingSubject(null);
      setSubjectForm({ name: '', color: '#6366f1', description: '', folderId: null });
      // Disparar evento para atualizar o Layout
      window.dispatchEvent(new Event('subjectsUpdated'));
    } catch (error) {
      console.error('Erro ao salvar matéria:', error);
      alert(error.response?.data?.error || 'Erro ao salvar matéria');
    }
  };

  const handleCreateFolder = async () => {
    try {
      if (editingFolder) {
        await foldersApi.update(editingFolder.id, folderForm);
      } else {
        await foldersApi.create(folderForm);
      }
      await loadData();
      setShowFolderModal(false);
      setEditingFolder(null);
      setFolderForm({ name: '', color: '#6366f1', description: '' });
      // Disparar evento para atualizar o Layout
      window.dispatchEvent(new Event('foldersUpdated'));
    } catch (error) {
      console.error('Erro ao salvar pasta:', error);
      alert(error.response?.data?.error || 'Erro ao salvar pasta');
    }
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name,
      color: subject.color || '#6366f1',
      description: subject.description || '',
      folderId: subject.folderId || null,
    });
    setShowSubjectModal(true);
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name,
      color: folder.color || '#6366f1',
      description: folder.description || '',
    });
    setShowFolderModal(true);
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta matéria?')) {
      try {
        await subjectsApi.delete(id);
        await loadData();
        // Disparar evento para atualizar o Layout
        window.dispatchEvent(new Event('subjectsUpdated'));
      } catch (error) {
        console.error('Erro ao deletar matéria:', error);
      }
    }
  };

  const handleDeleteFolder = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta pasta? As matérias dentro dela não serão deletadas, mas ficarão sem pasta.')) {
      try {
        await foldersApi.delete(id);
        await loadData();
        // Disparar evento para atualizar o Layout
        window.dispatchEvent(new Event('foldersUpdated'));
      } catch (error) {
        console.error('Erro ao deletar pasta:', error);
        alert(error.response?.data?.error || 'Erro ao deletar pasta');
      }
    }
  };

  const handleMoveSubject = async (subjectId, newFolderId) => {
    try {
      await subjectsApi.update(subjectId, { folderId: newFolderId || null });
      await loadData();
      // Disparar evento para atualizar o Layout
      window.dispatchEvent(new Event('subjectsUpdated'));
    } catch (error) {
      console.error('Erro ao mover matéria:', error);
    }
  };

  const getSubjectsByFolder = () => {
    const grouped = {};
    
    // Se uma pasta específica foi selecionada, mostrar apenas ela
    if (selectedFolderId) {
      if (selectedFolderId === 'null') {
        // Mostrar apenas matérias sem pasta
        const noFolder = subjects.filter(s => !s.folderId);
        if (noFolder.length > 0) {
          grouped['null'] = { name: 'Sem pasta', subjects: noFolder, color: '#9ca3af' };
        }
      } else {
        // Mostrar apenas matérias da pasta selecionada
        const folder = folders.find(f => f.id === selectedFolderId);
        if (folder) {
          const folderSubjects = subjects.filter(s => s.folderId === folder.id);
          grouped[folder.id] = {
            name: folder.name,
            subjects: folderSubjects,
            color: folder.color || '#6366f1',
            folder: folder,
          };
        }
      }
    } else {
      // Mostrar todas agrupadas por pasta
      // Subjects sem pasta
      const noFolder = subjects.filter(s => !s.folderId);
      if (noFolder.length > 0) {
        grouped['null'] = { name: 'Sem pasta', subjects: noFolder, color: '#9ca3af' };
      }

      // Subjects por pasta
      folders.forEach(folder => {
        const folderSubjects = subjects.filter(s => s.folderId === folder.id);
        if (folderSubjects.length > 0) {
          grouped[folder.id] = {
            name: folder.name,
            subjects: folderSubjects,
            color: folder.color || '#6366f1',
            folder: folder,
          };
        }
      });
    }

    return grouped;
  };

  if (loading) return <Loading />;

  const groupedSubjects = getSubjectsByFolder();
  const selectedFolderName = selectedFolderId 
    ? selectedFolderId === 'null' 
      ? 'Sem pasta' 
      : folders.find(f => f.id === selectedFolderId)?.name || 'Configurações'
    : 'Configurações';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {selectedFolderId ? selectedFolderName : 'Configurações'}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {selectedFolderId 
            ? `Matérias da pasta "${selectedFolderName}"`
            : 'Organize seus estudos em pastas e gerencie suas matérias'}
        </p>
        {selectedFolderId && (
          <button
            onClick={() => setSearchParams({})}
            className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            ← Ver todas as pastas
          </button>
        )}
      </div>

      {/* Pastas - só mostra quando não há pasta selecionada */}
      {!selectedFolderId && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Pastas</h2>
            <button
              onClick={() => {
                setEditingFolder(null);
                setFolderForm({ name: '', color: '#6366f1', description: '' });
                setShowFolderModal(true);
              }}
              className="btn btn-primary"
            >
              + Nova Pasta
            </button>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-2"
              style={{ borderColor: folder.color || '#6366f1' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: folder.color || '#6366f1' }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{folder.name}</p>
                    {folder.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{folder.description}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {subjects.filter(s => s.folderId === folder.id).length} matéria(s)
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditFolder(folder)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
          {folders.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 col-span-full">
              Nenhuma pasta criada. Crie pastas para organizar suas matérias por concurso ou projeto.
            </p>
          )}
        </div>
        </div>
      )}

      {/* Matérias organizadas por pasta */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Matérias</h2>
          <button
            onClick={() => {
              setEditingSubject(null);
              setSubjectForm({ 
                name: '', 
                color: '#6366f1', 
                description: '', 
                folderId: selectedFolderId && selectedFolderId !== 'null' ? selectedFolderId : null 
              });
              setShowSubjectModal(true);
            }}
            className="btn btn-primary"
          >
            + Nova Matéria
          </button>
        </div>

        {Object.keys(groupedSubjects).length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Nenhuma matéria cadastrada</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSubjects).map(([folderId, group]) => (
              <div key={folderId} className="space-y-2">
                <div className="flex items-center space-x-2 mb-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {group.name}
                  </h3>
                </div>
                <div className="space-y-2 pl-6">
                  {group.subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{subject.name}</p>
                          {subject.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{subject.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={subject.folderId || ''}
                          onChange={(e) => handleMoveSubject(subject.id, e.target.value || null)}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">Sem pasta</option>
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleEditSubject(subject)}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          Deletar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de criação/edição de matéria */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingSubject ? 'Editar Matéria' : 'Nova Matéria'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pasta
                </label>
                <select
                  className="input"
                  value={subjectForm.folderId || ''}
                  onChange={(e) => setSubjectForm({ ...subjectForm, folderId: e.target.value || null })}
                >
                  <option value="">Sem pasta</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  setEditingSubject(null);
                  setSubjectForm({ name: '', color: '#6366f1', description: '', folderId: null });
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleCreateSubject} className="btn btn-primary">
                {editingSubject ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de criação/edição de pasta */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {editingFolder ? 'Editar Pasta' : 'Nova Pasta'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  className="input"
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  placeholder="Ex: Concurso A, Concurso B, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cor
                </label>
                <input
                  type="color"
                  className="w-full h-10 rounded"
                  value={folderForm.color}
                  onChange={(e) => setFolderForm({ ...folderForm, color: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={folderForm.description}
                  onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                  placeholder="Ex: Concurso da Polícia Federal 2024"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowFolderModal(false);
                  setEditingFolder(null);
                  setFolderForm({ name: '', color: '#6366f1', description: '' });
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleCreateFolder} className="btn btn-primary">
                {editingFolder ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
