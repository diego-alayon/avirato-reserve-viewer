import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, 
  LogOut, 
  Calendar, 
  TrendingUp, 
  Users, 
  CreditCard,
  Hotel
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAvirato } from '@/hooks/useAvirato';

const Reservations = () => {
  const { isLoading, reservations, fetchReservations, logout } = useAvirato();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalReservations = reservations.length;
  const totalRevenue = reservations.reduce((sum, res) => sum + (res.price || 0), 0);
  const confirmedReservations = reservations.filter(res => 
    res.status.toLowerCase().includes('confirmada') || res.status.toLowerCase().includes('confirmed')
  ).length;

  const stats = [
    {
      title: "Total Reservas",
      value: totalReservations,
      icon: Calendar,
      color: "text-primary"
    },
    {
      title: "Confirmadas",
      value: confirmedReservations,
      icon: TrendingUp,
      color: "text-success"
    },
    {
      title: "Huéspedes",
      value: reservations.reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0),
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Ingresos Totales",
      value: `€${totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: "text-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary-glow/5">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary rounded-full p-2 shadow-glow">
                <Hotel className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Avirato Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Gestión de reservas hoteleras
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={fetchReservations}
                disabled={isLoading}
                variant="gradient"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Cargando...' : 'Cargar Reservas'}
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-elegant hover:shadow-glow transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reservations Section */}
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">
                  Reservas Recientes
                </CardTitle>
                <CardDescription>
                  Lista completa de reservas de Avirato
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                {totalReservations} reservas
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {reservations.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No hay reservas cargadas
                </h3>
                <p className="text-muted-foreground mb-4">
                  Haz clic en "Cargar Reservas" para ver las reservas de Avirato
                </p>
                <Button 
                  onClick={fetchReservations}
                  disabled={isLoading}
                  variant="hero"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Cargar Reservas
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Reserva</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Régimen</TableHead>
                    <TableHead>Huéspedes</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Estado de Pago</TableHead>
                    <TableHead>Importe Pendiente</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((reservation) => (
                    <TableRow key={reservation.reservation_id}>
                      <TableCell className="font-medium">
                        #{reservation.reservation_id}
                      </TableCell>
                      <TableCell>
                        {reservation.client?.name && reservation.client?.surname 
                          ? `${reservation.client.name} ${reservation.client.surname}`
                          : reservation.client_name || reservation.client_id || 'No disponible'
                        }
                      </TableCell>
                      <TableCell>
                        {reservation.client?.phone || 'No disponible'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {reservation.origin || 'No disponible'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(reservation.check_in_date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        {new Date(reservation.check_out_date).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        {reservation.regime_name || reservation.regime}
                      </TableCell>
                      <TableCell>
                        {reservation.adults} adultos
                        {reservation.children > 0 && `, ${reservation.children} niños`}
                      </TableCell>
                      <TableCell className="font-semibold">
                        €{reservation.price}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            reservation.status.toLowerCase().includes('confirmada') 
                              ? 'default' 
                              : 'secondary'
                          }
                        >
                          {reservation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={reservation.is_fully_paid !== undefined 
                            ? (reservation.is_fully_paid ? 'default' : 'destructive')
                            : (reservation.is_paid ? 'default' : 'destructive')
                          }
                        >
                          {reservation.is_fully_paid !== undefined 
                            ? (reservation.is_fully_paid ? 'Pagado' : 'Pago Pendiente')
                            : (reservation.is_paid ? 'Pagado' : 'Pendiente')
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {reservation.billing_total !== undefined 
                          ? (reservation.billing_total > 0 ? `€${reservation.billing_total.toFixed(2)}` : '€0.00')
                          : '€0.00'
                        }
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {reservation.client?.observations || reservation.observations || 'Sin observaciones'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reservations;