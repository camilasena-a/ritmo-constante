import { useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmar ação', 
  message = 'Tem certeza que deseja realizar esta ação?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger' // 'danger' para ações destrutivas, 'warning' para avisos
}) {
  const modalRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start space-x-4">
          {type === 'danger' && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          {type === 'warning' && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <h3 id="modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
            <p id="modal-description" className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 sm:space-x-0">
              <button
                onClick={onClose}
                className="btn btn-secondary w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                aria-label={cancelText}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`btn w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 focus:ring-red-500' 
                    : 'btn-primary focus:ring-primary-500'
                }`}
                aria-label={confirmText}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
















