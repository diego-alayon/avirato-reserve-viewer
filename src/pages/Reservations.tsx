import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { safeDateFormatSimple } from '@/utils/dateHelpers';
import { 
  RefreshCw, 
  LogOut, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Users, 
  CreditCard,
  Hotel,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAvirato } from '@/hooks/useAvirato';
import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const Reservations = () => {
  const { isLoading, reservations, fetchReservations, logout } = useAvirato();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [tempDateRange, setTempDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDateRangeChange = (range: {from: Date | undefined, to: Date | undefined} | undefined) => {
    if (range) {
      setTempDateRange(range);
    }
  };

  const handleAcceptDateRange = () => {
    if (tempDateRange.from && tempDateRange.to) {
      setDateRange(tempDateRange);
    }
  };

  const handleClearDateRange = () => {
    setTempDateRange({ from: undefined, to: undefined });
    setDateRange({ from: undefined, to: undefined });
  };

  const handleFetchReservations = () => {
    if (dateRange.from && dateRange.to) {
      fetchReservations(dateRange.from, dateRange.to);
    } else {
      // Si no hay fechas seleccionadas, usar valores por defecto (últimos 30 días)
      const defaultEnd = new Date();
      const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      fetchReservations(defaultStart, defaultEnd);
    }
  };

  // Filtrar reservas por término de búsqueda
  console.log('Total reservations loaded:', reservations.length);
  console.log('Search term:', searchTerm);
  const filteredReservations = reservations.filter(reservation => {
    if (!searchTerm) return true;
    
    const clientName = reservation.client?.name && reservation.client?.surname 
      ? `${reservation.client.name} ${reservation.client.surname}`
      : reservation.client_name || reservation.client_id || '';
    
    const reservationId = (reservation.reservation_id || reservation.reservationId)?.toString() || '';
    
    // Asegurar que clientName y searchTerm no sean undefined antes de usar toLowerCase
    const safeClientName = clientName || '';
    const safeSearchTerm = searchTerm || '';
    
    return safeClientName.toLowerCase().includes(safeSearchTerm.toLowerCase()) ||
           reservationId.includes(safeSearchTerm);
  });
  console.log('Filtered reservations count:', filteredReservations.length);

  const totalReservations = filteredReservations.length;
  const totalRevenue = filteredReservations.reduce((sum, res) => sum + (res.price || 0), 0);
  const confirmedReservations = filteredReservations.filter(res => 
    res.status.toLowerCase().includes('confirmada') || res.status.toLowerCase().includes('confirmed')
  ).length;

  const stats = [
    {
      title: "Total Reservas",
      value: totalReservations,
      icon: CalendarIcon,
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
      value: filteredReservations.reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0),
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
              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal w-[280px]",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: es })
                      )
                    ) : (
                      <span>Seleccionar rango de fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={tempDateRange?.from || new Date()}
                    selected={tempDateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto")}
                  />
                  <div className="flex justify-between gap-2 p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearDateRange}
                    >
                      Limpiar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAcceptDateRange}
                      disabled={!tempDateRange?.from || !tempDateRange?.to}
                    >
                      Aceptar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button 
                onClick={handleFetchReservations}
                disabled={isLoading}
                variant="gradient"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Cargando...' : 'Buscar Reservas'}
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
                  Reservas {searchTerm && `(${totalReservations} de ${reservations.length})`}
                </CardTitle>
                <CardDescription>
                  {searchTerm ? `Mostrando resultados para "${searchTerm}"` : 'Lista completa de reservas de Avirato'}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                {totalReservations} {searchTerm ? 'encontradas' : 'reservas'}
              </Badge>
            </div>
            
            {/* Buscador */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de cliente o ID de reserva..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredReservations.length === 0 && reservations.length > 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No se encontraron reservas
                </h3>
                <p className="text-muted-foreground mb-4">
                  No hay reservas que coincidan con "{searchTerm}"
                </p>
                <Button 
                  onClick={() => setSearchTerm('')}
                  variant="outline"
                >
                  Limpiar búsqueda
                </Button>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No hay reservas cargadas
                </h3>
                <p className="text-muted-foreground mb-4">
                  Selecciona un rango de fechas y haz clic en "Buscar Reservas"
                </p>
                <Button 
                  onClick={handleFetchReservations}
                  disabled={isLoading}
                  variant="hero"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Buscar Reservas
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-10 px-2">ID Reserva</TableHead>
                    <TableHead className="h-10 px-2">Cliente</TableHead>
                    <TableHead className="h-10 px-2">Teléfono</TableHead>
                    <TableHead className="h-10 px-2">Canal</TableHead>
                    <TableHead className="h-10 px-2">Check-in</TableHead>
                    <TableHead className="h-10 px-2">Check-out</TableHead>
                    <TableHead className="h-10 px-2">Régimen</TableHead>
                    <TableHead className="h-10 px-2">Huéspedes</TableHead>
                    <TableHead className="h-10 px-2">Precio</TableHead>
                    <TableHead className="h-10 px-2">Estado</TableHead>
                    <TableHead className="h-10 px-2">Estado de Pago</TableHead>
                    <TableHead className="h-10 px-2">Importe Pendiente</TableHead>
                    <TableHead className="h-10 px-2">Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.reservation_id || reservation.reservationId} className="h-12 px-0">
                      <TableCell className="font-medium py-2 px-2">
                        {reservation.reservation_id || reservation.reservationId}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2 px-2">
                        {reservation.client?.name && reservation.client?.surname 
                          ? `${reservation.client.name} ${reservation.client.surname}`
                          : reservation.client_name || reservation.client_id || "No disponible"
                        }
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2 px-2">
                        {reservation.client?.phone || "No disponible"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2 px-2">
                        <Badge variant="outline">
                          {reservation.operator_name || "No disponible"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2 px-2">
                        {safeDateFormatSimple(reservation.checkInDate || reservation.check_in_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2 px-2">
                        {safeDateFormatSimple(reservation.checkOutDate || reservation.check_out_date)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2 px-2">
                        {reservation.regime_name || reservation.regime}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2 px-2">
                        {reservation.adults} adultos
                        {reservation.children > 0 && `, ${reservation.children} niños`}
                      </TableCell>
                      <TableCell className="font-semibold py-2 px-2">
                        €{reservation.price}
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <Badge 
                          variant={
                            reservation.status.toLowerCase().includes('confirmada') 
                              ? 'confirmada' 
                              : 'secondary'
                          }
                        >
                          {reservation.status.replace('Reserva confirmada', 'Confirmada')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <Badge 
                          variant={reservation.is_fully_paid !== undefined 
                            ? (reservation.is_fully_paid ? 'pagado' : 'destructive')
                            : (reservation.is_paid ? 'pagado' : 'destructive')
                          }
                        >
                          {reservation.is_fully_paid !== undefined 
                            ? (reservation.is_fully_paid ? 'Pagado' : 'Pago Pendiente')
                            : (reservation.is_paid ? 'Pagado' : 'Pendiente')
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold py-2 px-2">
                        {reservation.billing_total !== undefined 
                          ? (reservation.billing_total > 0 ? `€${reservation.billing_total.toFixed(2)}` : '€0.00')
                          : '€0.00'
                        }
                      </TableCell>
                      <TableCell className="max-w-xs truncate whitespace-nowrap py-2 px-2">
                        {reservation.client?.observations || reservation.observations || "Sin observaciones"}
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