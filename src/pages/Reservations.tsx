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
  Package,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Globe,
  CircleDollarSign,
  Clock,
  MessageCircle,
  Copy,
  ExternalLink,
  ShoppingBag,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAvirato } from '@/hooks/useAvirato';
import { useState, Fragment } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Helper function to get payment type icon
const getPaymentIcon = (paymentType: string) => {
  const type = paymentType?.toUpperCase() || '';

  if (type.includes('CARD') || type.includes('TARJETA')) {
    return <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
  }
  if (type.includes('CASH') || type.includes('EFECTIVO')) {
    return <Banknote className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
  }
  if (type.includes('TRANSFER') || type.includes('TRANSFERENCIA')) {
    return <ArrowRightLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
  }
  if (type.includes('ONLINE') || type.includes('WEB')) {
    return <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
  }
  if (type === 'PENDIENTE' || type === 'PENDING') {
    return <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
  }

  // Default icon for other payment types
  return <CircleDollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
};

// Helper function to copy text to clipboard
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log('Link copiado al portapapeles');
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
  }
};

// Helper function to open WhatsApp with client phone
const openWhatsApp = (phone: string, message: string = '') => {
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  // Format WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  window.open(whatsappUrl, '_blank');
};

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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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

  const toggleRowExpansion = (reservationId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reservationId)) {
        newSet.delete(reservationId);
      } else {
        newSet.add(reservationId);
      }
      return newSet;
    });
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
                <TableHead className="text-black font-bold whitespace-nowrap">ID Reserva</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Cliente</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Teléfono</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Canal</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Tipo de Villa</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Número de Villa</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Check-in</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Check-out</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Régimen</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Huéspedes</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Precio</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Estado</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Estado de Pago</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Importe Pendiente</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Tipo de Pago</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Fecha de Pago</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Usuario de Pago</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Link de Pago</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Extras</TableHead>
                <TableHead className="text-black font-bold whitespace-nowrap">Observaciones</TableHead>
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

                const reservationId = reservation.reservation_id || reservation.reservationId;
                const isExpanded = expandedRows.has(reservationId);
                const hasBillingLines = reservation.billing_lines && reservation.billing_lines.length > 0;

                // Debug para reserva 1567
                if (reservationId === 1567) {
                  console.log('🔍 Reservation 1567 render:', {
                    id: reservationId,
                    billing_lines: reservation.billing_lines,
                    hasBillingLines,
                    client: clientName
                  });
                }

                return (
                  <Fragment key={reservationId}>
                    <TableRow
                      className={`h-9 ${hasPaymentPending ? 'bg-yellow-500/10' : ''} ${hasBillingLines ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => hasBillingLines && toggleRowExpansion(reservationId)}
                    >
                      <TableCell className="font-medium" title={`${reservationId}`}>
                        <div className="flex items-center gap-2">
                          {hasBillingLines ? (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-blue-600" />
                            )
                          ) : (
                            <div className="w-4" />
                          )}
                          <span className="truncate block max-w-[60ch]">
                            {truncateText(`${reservationId}`)}
                          </span>
                        </div>
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
                    <TableCell title={reservation.space_name || 'No disponible'}>
                      <span className="truncate block max-w-[60ch]">
                        {reservation.space_name || 'No disponible'}
                      </span>
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
                      {(reservation.is_fully_paid !== undefined ? reservation.is_fully_paid : reservation.is_paid) ? (
                        <Badge
                          className="bg-green-50 text-green-700 border-green-500 font-normal"
                          style={{ borderRadius: '4px' }}
                          variant="outline"
                        >
                          Pagado
                        </Badge>
                      ) : (
                        <span className="text-red-600 font-normal animate-blink">
                          Pendiente
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold" title={reservation.billing_total !== undefined ? `€${reservation.billing_total.toFixed(2)}` : '€0.00'}>
                      <span className={`truncate block max-w-[60ch] ${reservation.billing_total && reservation.billing_total > 0 ? 'text-red-600' : ''}`}>
                        {reservation.billing_total !== undefined
                          ? (reservation.billing_total > 0 ? `€${reservation.billing_total.toFixed(2)}` : '€0.00')
                          : '€0.00'
                        }
                      </span>
                    </TableCell>
                    <TableCell title={reservation.payment_method || 'Pendiente'}>
                      <div className="flex items-center gap-2">
                        {hasPaymentPending ? (
                          <>
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate block max-w-[60ch] text-muted-foreground">
                              Pendiente
                            </span>
                          </>
                        ) : (
                          <>
                            {getPaymentIcon(reservation.payment_method || '')}
                            <span className="truncate block max-w-[60ch]">
                              {truncateText(reservation.payment_method || 'N/A')}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell title={reservation.payment_date || 'Pendiente'}>
                      <span className={`truncate block max-w-[60ch] ${hasPaymentPending ? 'text-muted-foreground' : ''}`}>
                        {hasPaymentPending
                          ? 'Pendiente'
                          : (reservation.payment_date ? safeDateFormatSimple(reservation.payment_date) : 'N/A')
                        }
                      </span>
                    </TableCell>
                    <TableCell title={reservation.payment_user || 'Pendiente'}>
                      <span className={`truncate block max-w-[60ch] ${hasPaymentPending ? 'text-muted-foreground' : ''}`}>
                        {hasPaymentPending
                          ? 'Pendiente'
                          : truncateText(reservation.payment_user || 'N/A')
                        }
                      </span>
                    </TableCell>
                    <TableCell title={reservation.payment_link || 'No disponible'}>
                      <div className="flex items-center gap-1">
                        {reservation.payment_link ? (
                          <>
                            <button
                              onClick={() => openWhatsApp(
                                reservation.client?.phone || '',
                                `Hola ${reservation.client?.name || ''}, aquí está tu link de pago: ${reservation.payment_link}`
                              )}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Enviar por WhatsApp"
                              disabled={!reservation.client?.phone}
                            >
                              <MessageCircle className="h-3 w-3 text-green-600" />
                            </button>
                            <button
                              onClick={() => copyToClipboard(reservation.payment_link || '')}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Copiar link"
                            >
                              <Copy className="h-3 w-3 text-gray-600" />
                            </button>
                            <a
                              href={reservation.payment_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm truncate max-w-[200px]"
                              title={reservation.payment_link}
                            >
                              <span className="truncate">Link de pago</span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm whitespace-nowrap">No disponible</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell title={extras}>
                      <div className="flex items-center gap-2">
                        {extras === 'No tiene extras contratados' ? (
                          <>
                            <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                            <span className="truncate block max-w-[60ch] text-gray-300">
                              {truncateText(extras)}
                            </span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="truncate block max-w-[60ch]">
                              {truncateText(extras)}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell title={observations}>
                      <span className="truncate block max-w-[60ch]">
                        {truncateText(observations)}
                      </span>
                    </TableCell>
                  </TableRow>
                  {isExpanded && reservation.billing_lines && (
                    <>
                      {/* Encabezado de la tabla de facturación */}
                      <TableRow className="h-9 bg-blue-200/60 border-l-4 border-l-blue-500">
                        <TableCell className="pl-12 text-xs font-semibold text-gray-700">
                          CANT.
                        </TableCell>
                        <TableCell colSpan={2} className="text-xs font-semibold text-gray-700">
                          CONCEPTO
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-700">
                          PRECIO UNIT.
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-gray-700">
                          TOTAL
                        </TableCell>
                        <TableCell colSpan={15}></TableCell>
                      </TableRow>
                      {/* Filas de datos */}
                      {reservation.billing_lines.map((billingLine) => (
                        <TableRow
                          key={billingLine.id}
                          className="h-9 bg-blue-50/50 border-l-4 border-l-blue-400"
                        >
                          <TableCell className="pl-12 text-sm text-gray-600">
                            {billingLine.quantity}
                          </TableCell>
                          <TableCell colSpan={2} className="text-sm text-gray-600">
                            {billingLine.concept}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            €{billingLine.unit_price.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">
                            €{billingLine.total.toFixed(2)}
                          </TableCell>
                          <TableCell colSpan={15}></TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="h-9 bg-blue-100/70 border-l-4 border-l-blue-600">
                        <TableCell colSpan={3} className="pl-12 text-sm font-bold text-gray-800">
                          Total
                        </TableCell>
                        <TableCell className="text-sm text-gray-600"></TableCell>
                        <TableCell className="text-sm font-bold text-gray-800">
                          €{reservation.billing_lines.reduce((sum, line) => sum + line.total, 0).toFixed(2)}
                        </TableCell>
                        <TableCell colSpan={15}></TableCell>
                      </TableRow>
                    </>
                  )}
                </Fragment>
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
