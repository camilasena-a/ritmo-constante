import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    // Redireciona para dashboard se já estiver autenticado
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}






