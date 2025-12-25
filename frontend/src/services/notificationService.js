/**
 * Serviço para gerenciar notificações do navegador usando Web Notifications API
 */

class NotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  /**
   * Verifica se o navegador suporta notificações
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Verifica o status atual da permissão
   */
  checkPermission() {
    if (!this.isSupported()) {
      this.permission = 'unsupported';
      return 'unsupported';
    }
    this.permission = Notification.permission;
    return this.permission;
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission() {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificações:', error);
      return 'denied';
    }
  }

  /**
   * Verifica se tem permissão para mostrar notificações
   */
  hasPermission() {
    return this.checkPermission() === 'granted';
  }

  /**
   * Mostra uma notificação
   */
  show(title, options = {}) {
    if (!this.hasPermission()) {
      console.warn('Permissão de notificações não concedida');
      return null;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'revision-reminder',
      requireInteraction: false,
      ...options,
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Fecha automaticamente após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
      return null;
    }
  }

  /**
   * Mostra notificação de revisão pendente
   */
  showRevisionReminder(revision) {
    const subjectName = revision.subject?.name || 'Matéria';
    const scheduledDate = new Date(revision.scheduledDate);
    const now = new Date();
    const diffHours = Math.floor((scheduledDate - now) / (1000 * 60 * 60));
    
    let message = '';
    if (diffHours < 0) {
      message = `Revisão de ${subjectName} está atrasada!`;
    } else if (diffHours === 0) {
      message = `Revisão de ${subjectName} é hoje!`;
    } else if (diffHours <= 24) {
      message = `Revisão de ${subjectName} em ${diffHours} horas`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      message = `Revisão de ${subjectName} em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    }

    return this.show('📚 Revisão Pendente', {
      body: message,
      icon: revision.subject?.color 
        ? `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="16" fill="${encodeURIComponent(revision.subject.color)}"/></svg>`
        : '/favicon.ico',
      data: {
        revisionId: revision.id,
        url: '/revisions',
      },
    });
  }

  /**
   * Mostra notificação de múltiplas revisões pendentes
   */
  showMultipleRevisions(count) {
    const message = count === 1 
      ? 'Você tem 1 revisão pendente'
      : `Você tem ${count} revisões pendentes`;

    return this.show('📚 Revisões Pendentes', {
      body: message,
      data: {
        url: '/revisions',
      },
    });
  }
}

// Exporta uma instância singleton
export const notificationService = new NotificationService();
export default notificationService;






