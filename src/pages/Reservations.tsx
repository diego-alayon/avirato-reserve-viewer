import { Button } from '@/components/ui/button';
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
  Search,
  Home,
  CheckCircle,
  XCircle,
  Package
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
      const expandedStart = new Date(dateRange.from);
      expandedStart.setDate(expandedStart.getDate() - 60);

      const expandedEnd = new Date(dateRange.to);
      expandedEnd.setDate(expandedEnd.getDate() + 60);

      fetchReservations(expandedStart, expandedEnd);
    } else {
      const defaultEnd = new Date();
      const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      fetchReservations(defaultStart, defaultEnd);
    }
  };

  // Helper function to truncate text and add tooltip
  const truncateText = (text: string, maxLength: number = 60) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };

  const filteredReservations = reservations.filter(reservation => {
    if (searchTerm?.trim()) {
      const clientName = reservation.client?.name && reservation.client?.surname
        ? `${reservation.client.name} ${reservation.client.surname}`
        : reservation.client_name || reservation.client_id || '';

      const reservationId = (reservation.reservation_id || reservation.reservationId)?.toString() || '';

      if (!clientName && !reservationId) return false;

      const safeClientName = (clientName || '').toString().toLowerCase();
      const safeReservationId = (reservationId || '').toString().toLowerCase();
      const safeSearchTerm = searchTerm.trim().toLowerCase();

      const matchesSearch = safeClientName.includes(safeSearchTerm) ||
                           safeReservationId.includes(safeSearchTerm);

      if (!matchesSearch) return false;
    }

    if (dateRange.from && dateRange.to) {
      const rangeStart = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
      const rangeEnd = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());

      const checkInStr = reservation.check_in_date || reservation.checkInDate;
      const checkOutStr = reservation.check_out_date || reservation.checkOutDate;

      const checkInDateStr = checkInStr.split(' ')[0];
      const checkOutDateStr = checkOutStr.split(' ')[0];

      const [cyear, cmonth, cday] = checkInDateStr.split('-').map(Number);
      const checkInDate = new Date(cyear, cmonth - 1, cday);

      const [oyear, omonth, oday] = checkOutDateStr.split('-').map(Number);
      const checkOutDate = new Date(oyear, omonth - 1, oday);

      const checkInInRange = checkInDate >= rangeStart && checkInDate <= rangeEnd;
      const checkOutInRange = checkOutDate >= rangeStart && checkOutDate <= rangeEnd;
      const isActive = checkInDate < rangeStart && checkOutDate > rangeEnd;

      return checkInInRange || checkOutInRange || isActive;
    }

    return true;
  });

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Avirato Dashboard</h2>
          <p className="text-muted-foreground">
            Gestión de reservas hoteleras
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de cliente o ID de reserva..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        {filteredReservations.length === 0 && reservations.length > 0 ? (
          <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <Search className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No se encontraron reservas</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                No hay reservas que coincidan con "{searchTerm}"
              </p>
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                size="sm"
              >
                Limpiar búsqueda
              </Button>
            </div>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <CalendarIcon className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay reservas cargadas</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Selecciona un rango de fechas y haz clic en "Buscar Reservas"
              </p>
              <Button
                onClick={handleFetchReservations}
                disabled={isLoading}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Buscar Reservas
              </Button>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Reserva</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Tipo de Villa</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Régimen</TableHead>
                <TableHead>Huéspedes</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Estado de Pago</TableHead>
                <TableHead>Importe Pendiente</TableHead>
                <TableHead>Extras</TableHead>
                <TableHead>Observaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations.map((reservation) => {
                const clientName = reservation.client?.name && reservation.client?.surname
                  ? `${reservation.client.name} ${reservation.client.surname}`
                  : reservation.client_name || reservation.client_id || "No disponible";
                const operatorName = reservation.operator_name || "No disponible";
                const villaType = reservation.space_type_name || "No disponible";
                const status = reservation.status.replace('Reserva confirmada', 'Confirmada');
                const paymentStatus = reservation.is_fully_paid !== undefined
                  ? (reservation.is_fully_paid ? 'Pagado' : 'Pago Pendiente')
                  : (reservation.is_paid ? 'Pagado' : 'Pendiente');
                const extras = reservation.extras_text || 'No tiene extras contratados';
                const observations = reservation.client?.observations || reservation.observations || "Sin observaciones";
                const guestsText = `${reservation.adults} adultos${reservation.children > 0 ? `, ${reservation.children} niños` : ''}`;

                // Determinar si tiene pago pendiente
                const hasPaymentPending = !(reservation.is_fully_paid !== undefined ? reservation.is_fully_paid : reservation.is_paid);

                return (
                  <TableRow
                    key={reservation.reservation_id || reservation.reservationId}
                    className={hasPaymentPending ? 'bg-yellow-500/10' : ''}
                  >
                    <TableCell className="font-medium" title={`${reservation.reservation_id || reservation.reservationId}`}>
                      <span className="truncate block max-w-[60ch]">
                        {truncateText(`${reservation.reservation_id || reservation.reservationId}`)}
                      </span>
                    </TableCell>
                    <TableCell title={clientName}>
                      <span className="truncate block max-w-[60ch]">
                        {truncateText(clientName)}
                      </span>
                    </TableCell>
                    <TableCell title={reservation.client?.phone || "No disponible"}>
                      <span className="truncate block max-w-[60ch]">
                        {truncateText(reservation.client?.phone || "No disponible")}
                      </span>
                    </TableCell>
                    <TableCell title={operatorName}>
                      <span className="truncate block max-w-[60ch]">
                        {truncateText(operatorName)}
                      </span>
                    </TableCell>
                    <TableCell title={villaType}>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate block max-w-[60ch]">
                          {truncateText(villaType)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell title={safeDateFormatSimple(reservation.checkInDate || reservation.check_in_date)}>
                      <span className="truncate block max-w-[60ch]">
                        {safeDateFormatSimple(reservation.checkInDate || reservation.check_in_date)}
                      </span>
                    </TableCell>
                    <TableCell title={safeDateFormatSimple(reservation.checkOutDate || reservation.check_out_date)}>
                      <span className="truncate block max-w-[60ch]">
                        {safeDateFormatSimple(reservation.checkOutDate || reservation.check_out_date)}
                      </span>
                    </TableCell>
                    <TableCell title={reservation.regime_name || reservation.regime}>
                      <span className="truncate block max-w-[60ch]">
                        {truncateText(reservation.regime_name || reservation.regime)}
                      </span>
                    </TableCell>
                    <TableCell title={guestsText}>
                      <span className="truncate block max-w-[60ch]">
                        {truncateText(guestsText)}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold" title={`€${reservation.price}`}>
                      <span className="truncate block max-w-[60ch]">
                        €{reservation.price}
                      </span>
                    </TableCell>
                    <TableCell title={status}>
                      <div className="flex items-center gap-2">
                        {reservation.status.toLowerCase().includes('confirmada') ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="truncate block max-w-[60ch]">
                          {truncateText(status)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell title={paymentStatus}>
                      <div className="flex items-center gap-2">
                        {(reservation.is_fully_paid !== undefined ? reservation.is_fully_paid : reservation.is_paid) ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        <span className="truncate block max-w-[60ch]">
                          {truncateText(paymentStatus)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold" title={reservation.billing_total !== undefined ? `€${reservation.billing_total.toFixed(2)}` : '€0.00'}>
                      <span className="truncate block max-w-[60ch]">
                        {reservation.billing_total !== undefined
                          ? (reservation.billing_total > 0 ? `€${reservation.billing_total.toFixed(2)}` : '€0.00')
                          : '€0.00'
                        }
                      </span>
                    </TableCell>
                    <TableCell title={extras}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className={`truncate block max-w-[60ch] ${extras === 'No tiene extras contratados' ? 'text-muted-foreground' : ''}`}>
                          {truncateText(extras)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell title={observations}>
                      <span className="truncate block max-w-[60ch]">
                        {truncateText(observations)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Reservations;
