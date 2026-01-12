import { useEffect } from 'react';
import useLoadingStore from '../store/loadingStore';
import Loading from './Loading';

export default function GlobalLoading() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  // Evitar scroll quando loading está ativo
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return <Loading fullScreen={true} size="lg" />;
}






















