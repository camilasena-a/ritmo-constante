import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foldersApi } from '../api/folders';
import useToastStore from '../store/toastStore';

// Chave de query para pastas
export const FOLDERS_QUERY_KEY = ['folders'];

/**
 * Hook para buscar todas as pastas com cache
 */
export function useFolders() {
  return useQuery({
    queryKey: FOLDERS_QUERY_KEY,
    queryFn: () => foldersApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar uma pasta específica por ID
 */
export function useFolder(id) {
  return useQuery({
    queryKey: ['folder', id],
    queryFn: () => foldersApi.getById(id),
    enabled: !!id, // Só executa se houver um ID
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para criar uma nova pasta
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  return useMutation({
    mutationFn: (data) => foldersApi.create(data),
    onSuccess: () => {
      // Invalidar cache de pastas para refazer fetch
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      success('Pasta criada com sucesso!');
      // Disparar evento para atualizar o Layout
      window.dispatchEvent(new Event('foldersUpdated'));
    },
    onError: (err) => {
      error('Erro ao criar pasta');
      console.error('Erro ao criar pasta:', err);
    },
  });
}

/**
 * Hook para atualizar uma pasta
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  return useMutation({
    mutationFn: ({ id, data }) => foldersApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar cache de pastas e da pasta específica
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['folder', variables.id] });
      success('Pasta atualizada com sucesso!');
      // Disparar evento para atualizar o Layout
      window.dispatchEvent(new Event('foldersUpdated'));
    },
    onError: (err) => {
      error('Erro ao atualizar pasta');
      console.error('Erro ao atualizar pasta:', err);
    },
  });
}

/**
 * Hook para deletar uma pasta
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  return useMutation({
    mutationFn: (id) => foldersApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidar cache de pastas e da pasta específica
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['folder', id] });
      success('Pasta deletada com sucesso!');
      // Disparar evento para atualizar o Layout
      window.dispatchEvent(new Event('foldersUpdated'));
    },
    onError: (err) => {
      error('Erro ao deletar pasta');
      console.error('Erro ao deletar pasta:', err);
    },
  });
}

