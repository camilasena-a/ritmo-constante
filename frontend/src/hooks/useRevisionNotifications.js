import { useEffect, useRef } from 'react';
import { revisionsApi } from '../api/revisions';
import { notificationService } from '../services/notificationService';

/**
 * Hook para verificar e mostrar notificações de revisões pendentes
 * 
 * @param {Object} options - Opções de configuração
 * @param {number} options.checkInterval - Intervalo em minutos para verificar revisões (padrão: 30)
 * @param {boolean} options.enabled - Se as notificações estão habilitadas (padrão: true)
 * @param {number} options.hoursAhead - Quantas horas à frente verificar revisões (padrão: 24)
 */
export default function useRevisionNotifications({
  checkInterval = 30,
  enabled = true,
  hoursAhead = 24,
} = {}) {
  const intervalRef = useRef(null);
  const lastCheckRef = useRef(null);
  const notifiedRevisionsRef = useRef(new Set());

  // Limpar notificações antigas do Set periodicamente
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      // Limpar IDs de revisões que já foram notificadas há mais de 24 horas
      notifiedRevisionsRef.current.clear();
    }, 24 * 60 * 60 * 1000); // A cada 24 horas

    return () => clearInterval(cleanupInterval);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Solicitar permissão de notificações quando o hook é montado
    const requestPermission = async () => {
      if (notificationService.isSupported()) {
        await notificationService.requestPermission();
      }
    };

    requestPermission();

    // Função para verificar revisões pendentes
    const checkPendingRevisions = async () => {
      try {
        // Calcular datas para a busca
        const now = new Date();
        const endDate = new Date(now);
        endDate.setHours(endDate.getHours() + hoursAhead);

        // Buscar revisões pendentes
        const response = await revisionsApi.getPending({
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
        });

        const revisions = response.data || [];
        
        if (revisions.length === 0) {
          return;
        }

        // Filtrar revisões que ainda não foram notificadas
        const newRevisions = revisions.filter(
          (revision) => !notifiedRevisionsRef.current.has(revision.id)
        );

        if (newRevisions.length === 0) {
          return;
        }

        // Se há apenas uma revisão, mostrar notificação individual
        if (newRevisions.length === 1) {
          const revision = newRevisions[0];
          notificationService.showRevisionReminder(revision);
          notifiedRevisionsRef.current.add(revision.id);
        } else {
          // Se há múltiplas revisões, mostrar notificação agregada
          notificationService.showMultipleRevisions(newRevisions.length);
          // Marcar todas como notificadas
          newRevisions.forEach((revision) => {
            notifiedRevisionsRef.current.add(revision.id);
          });
        }

        lastCheckRef.current = now;
      } catch (error) {
        // Silenciosamente falhar se houver erro (ex: API não disponível)
        console.warn('Erro ao verificar revisões pendentes:', error);
      }
    };

    // Verificar imediatamente na primeira vez
    checkPendingRevisions();

    // Configurar intervalo para verificar periodicamente
    const intervalMs = checkInterval * 60 * 1000; // Converter minutos para milissegundos
    intervalRef.current = setInterval(checkPendingRevisions, intervalMs);

    // Cleanup: limpar intervalo quando o componente desmontar ou quando enabled mudar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, checkInterval, hoursAhead]);
}
