export default function Loading({ fullScreen = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 z-50'
    : 'flex items-center justify-center min-h-[200px]';

  return (
    <div className={containerClasses}>
      <div className="relative">
        <div
          className={`animate-spin rounded-full border-b-2 border-primary-600 dark:border-primary-400 ${sizeClasses[size]}`}
        ></div>
        <div
          className={`absolute top-0 left-0 animate-spin rounded-full border-t-2 border-primary-400 dark:border-primary-600 opacity-50 ${sizeClasses[size]}`}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        ></div>
      </div>
    </div>
  );
}




