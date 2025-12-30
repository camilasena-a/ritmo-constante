import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../api/subjects';
import useToastStore from '../store/toastStore';

// Chave de query para matérias
export const SUBJECTS_QUERY_KEY = ['subjects'];

/**
 * Hook para buscar todas as matérias com cache
 */
export function useSubjects(params = {}) {
  return useQuery({
    queryKey: [...SUBJECTS_QUERY_KEY, params],
    queryFn: () => subjectsApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar uma matéria específica por ID
 */
export function useSubject(id) {
  return useQuery({
    queryKey: ['subject', id],
    queryFn: () => subjectsApi.getById(id),
    enabled: !!id, // Só executa se houver um ID
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para criar uma nova matéria
 */
export function useCreateSubject() {
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  return useMutation({
    mutationFn: (data) => subjectsApi.create(data),
    onSuccess: () => {
      // Invalidar cache de matérias para refazer fetch
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
      success('Matéria criada com sucesso!');
      // Disparar evento para atualizar o Layout
      window.dispatchEvent(new Event('subjectsUpdated'));
    },
    onError: (err) => {
      error('Erro ao criar matéria');
      console.error('Erro ao criar matéria:', err);
    },
  });
}

/**
 * Hook para atualizar uma matéria
 */
export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  return useMutation({
    mutationFn: ({ id, data }) => subjectsApi.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar cache de matérias e da matéria específica
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['subject', variables.id] });
      success('Matéria atualizada com sucesso!');
      // Disparar evento para atualizar o Layout
      window.dispatchEvent(new Event('subjectsUpdated'));
    },
    onError: (err) => {
      error('Erro ao atualizar matéria');
      console.error('Erro ao atualizar matéria:', err);
    },
  });
}

/**
 * Hook para deletar uma matéria
 */
export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const { success, error } = useToastStore();

  return useMutation({
    mutationFn: (id) => subjectsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidar cache de matérias e da matéria específica
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['subject', id] });
      success('Matéria deletada com sucesso!');
      // Disparar evento para atualizar o Layout
      window.dispatchEvent(new Event('subjectsUpdated'));
    },
    onError: (err) => {
      error('Erro ao deletar matéria');
      console.error('Erro ao deletar matéria:', err);
    },
  });
}

