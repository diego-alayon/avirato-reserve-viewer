import { useState, useEffect } from 'react';
import { useAvirato } from '@/hooks/useAvirato';
import { AviratoAuth } from '@/components/AviratoAuth';
import { AviratoReservations } from '@/components/AviratoReservations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, LogOut, ArrowLeft } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, logout, fetchReservations, isLoading } = useAvirato();
  const [showDashboard, setShowDashboard] = useState(false);

  // Cargar reservas automáticamente cuando se autentica
  useEffect(() => {
    if (isAuthenticated) {
      fetchReservations();
    }
  }, [isAuthenticated, fetchReservations]);

  if (!isAuthenticated) {
    return <AviratoAuth />;
  }

  if (showDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Dashboard Avirato</CardTitle>
            <CardDescription>
              Gestiona tus reservas de hotel de forma sencilla
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setShowDashboard(false)}
              className="w-full flex items-center gap-2"
              size="lg"
            >
              <Calendar className="h-5 w-5" />
              Ver todas las reservas
            </Button>
            
            <Button 
              variant="outline" 
              onClick={logout}
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Por defecto, mostrar las reservas después de autenticarse
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowDashboard(true)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="outline" onClick={logout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
        <AviratoReservations />
      </div>
    </div>
  );
};

export default Index;
