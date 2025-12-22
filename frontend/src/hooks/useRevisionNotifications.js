import { useEffect, useRef } from 'react';
import { revisionsApi } from '../api/revisions';
import notificationService from '../services/notificationService';
import { useAuthStore } from '../store/authStore';

/**
 * Hook para gerenciar notificações de revisões pendentes
 * 
 * @param {Object} options - Opções de configuração
 * @param {number} options.checkInterval - Intervalo em minutos para verificar revisões (padrão: 30)
 * @param {boolean} options.enabled - Se as notificações estão habilitadas (padrão: true)
 * @param {number} options.hoursAhead - Quantas horas à frente verificar revisões (padrão: 24)
 */
export function useRevisionNotifications(options = {}) {
  const {
    checkInterval = 30, // minutos
    enabled = true,
    hoursAhead = 24,
  } = options;

  const { isAuthenticated } = useAuthStore();
  const intervalRef = useRef(null);
  const lastNotificationRef = useRef(new Set()); // IDs das revisões que já foram notificadas
  const permissionRequestedRef = useRef(false);

  // Solicita permissão quando o hook é montado
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    if (!permissionRequestedRef.current && notificationService.isSupported()) {
      // Aguarda um pouco antes de solicitar permissão para melhor UX
      const timer = setTimeout(async () => {
        await notificationService.requestPermission();
        permissionRequestedRef.current = true;
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [enabled, isAuthenticated]);

  // Verifica revisões pendentes
  const checkPendingRevisions = async () => {
    if (!enabled || !isAuthenticated) return;
    if (!notificationService.hasPermission()) return;

    try {
      // Busca revisões pendentes para as próximas horas
      const endDate = new Date();
      endDate.setHours(endDate.getHours() + hoursAhead);
      
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0); // Início do dia

      const revisions = await revisionsApi.getPending({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Processa resposta paginada ou não paginada
      const revisionsList = Array.isArray(revisions) ? revisions : (revisions?.data || []);
      
      if (revisionsList.length === 0) {
        // Limpa IDs notificados se não há revisões
        lastNotificationRef.current.clear();
        return;
      }

      // Filtra revisões que ainda não foram notificadas
      const newRevisions = revisionsList.filter(
        (rev) => !lastNotificationRef.current.has(rev.id)
      );

      if (newRevisions.length === 0) return;

      // Notifica revisões individuais se houver poucas
      if (newRevisions.length <= 3) {
        newRevisions.forEach((revision) => {
          const scheduledDate = new Date(revision.scheduledDate);
          const now = new Date();
          const diffHours = (scheduledDate - now) / (1000 * 60 * 60);

          // Notifica se a revisão está próxima (próximas 24h) ou atrasada
          if (diffHours <= 24 || diffHours < 0) {
            notificationService.showRevisionReminder(revision);
            lastNotificationRef.current.add(revision.id);
          }
        });
      } else {
        // Se houver muitas revisões, mostra uma notificação resumida
        notificationService.showMultipleRevisions(newRevisions.length);
        newRevisions.forEach((rev) => lastNotificationRef.current.add(rev.id));
      }

      // Limpa IDs antigos (mais de 7 dias) para evitar acúmulo
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      revisionsList.forEach((rev) => {
        const scheduledDate = new Date(rev.scheduledDate).getTime();
        if (scheduledDate < sevenDaysAgo) {
          lastNotificationRef.current.delete(rev.id);
        }
      });
    } catch (error) {
      console.error('Erro ao verificar revisões pendentes:', error);
    }
  };

  // Configura verificação periódica
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Verifica imediatamente ao montar
    checkPendingRevisions();

    // Configura intervalo periódico
    const intervalMs = checkInterval * 60 * 1000;
    intervalRef.current = setInterval(checkPendingRevisions, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isAuthenticated, checkInterval, hoursAhead]);

  // Limpa intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    checkPermission: () => notificationService.requestPermission(),
    hasPermission: () => notificationService.hasPermission(),
    isSupported: () => notificationService.isSupported(),
    checkNow: checkPendingRevisions,
  };
}

export default useRevisionNotifications;


