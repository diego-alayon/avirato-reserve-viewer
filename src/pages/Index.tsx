import { useAvirato } from '@/hooks/useAvirato';
import { AviratoAuth } from '@/components/AviratoAuth';
import { AviratoReservations } from '@/components/AviratoReservations';

const Index = () => {
  const { isAuthenticated } = useAvirato();

  if (!isAuthenticated) {
    return <AviratoAuth />;
  }

  return <AviratoReservations />;
};

export default Index;
