import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAvirato } from '@/hooks/useAvirato';

const Index = () => {
  const { isAuthenticated } = useAvirato();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/reservations');
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return null; // No necesita mostrar nada, solo redirige
};

export default Index;
