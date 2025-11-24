import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { safeDateFormatSimple } from "@/utils/dateHelpers";
import {
  RefreshCw,
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
  Plus,
  Minus,
  Phone,
  Settings2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAvirato } from "@/hooks/useAvirato";
import { useState, Fragment } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Helper function to get payment type icon
const getPaymentIcon = (paymentType: string) => {
  const type = paymentType?.toUpperCase() || "";

  if (type.includes("CARD") || type.includes("TARJETA")) {
    return (
      <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    );
  }
  if (type.includes("CASH") || type.includes("EFECTIVO")) {
    return <Banknote className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
  }
  if (type.includes("TRANSFER") || type.includes("TRANSFERENCIA")) {
    return (
      <ArrowRightLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    );
  }
  if (type.includes("ONLINE") || type.includes("WEB")) {
    return <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
  }
  if (type === "PENDIENTE" || type === "PENDING") {
    return <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
  }

  // Default icon for other payment types
  return (
    <CircleDollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
  );
};

// Helper function to copy text to clipboard
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log("Link copiado al portapapeles");
  } catch (err) {
    console.error("Error al copiar al portapapeles:", err);
  }
};

// Helper function to open WhatsApp with client phone
const openWhatsApp = (phone: string, message: string = "") => {
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  // Format WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  window.open(whatsappUrl, "_blank");
};

const Reservations = () => {
  const { isLoading, reservations, fetchReservations, logout } = useAvirato();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [tempDateRange, setTempDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    cliente: true,
    telefono: true,
    canal: true,
    tipoVilla: true,
    numeroVilla: true,
    checkIn: true,
    checkOut: true,
    regimen: true,
    huespedes: true,
    precio: true,
    estado: true,
    estadoPago: true,
    importePendiente: true,
    tipoPago: true,
    fechaPago: true,
    usuarioPago: true,
    linkPago: true,
    extras: true,
    observaciones: true,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDateRangeChange = (
    range: { from: Date | undefined; to: Date | undefined } | undefined,
  ) => {
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
    setExpandedRows((prev) => {
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
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };

  const filteredReservations = reservations.filter((reservation) => {
    if (searchTerm?.trim()) {
      const clientName =
        reservation.client?.name && reservation.client?.surname
          ? `${reservation.client.name} ${reservation.client.surname}`
          : reservation.client_name || reservation.client_id || "";

      const reservationId =
        (reservation.reservation_id || reservation.reservationId)?.toString() ||
        "";

      if (!clientName && !reservationId) return false;

      const safeClientName = (clientName || "").toString().toLowerCase();
      const safeReservationId = (reservationId || "").toString().toLowerCase();
      const safeSearchTerm = searchTerm.trim().toLowerCase();

      const matchesSearch =
        safeClientName.includes(safeSearchTerm) ||
        safeReservationId.includes(safeSearchTerm);

      if (!matchesSearch) return false;
    }

    if (dateRange.from && dateRange.to) {
      const rangeStart = new Date(
        dateRange.from.getFullYear(),
        dateRange.from.getMonth(),
        dateRange.from.getDate(),
      );
      const rangeEnd = new Date(
        dateRange.to.getFullYear(),
        dateRange.to.getMonth(),
        dateRange.to.getDate(),
      );

      const checkInStr = reservation.check_in_date || reservation.checkInDate;
      const checkOutStr =
        reservation.check_out_date || reservation.checkOutDate;

      const checkInDateStr = checkInStr.split(" ")[0];
      const checkOutDateStr = checkOutStr.split(" ")[0];

      const [cyear, cmonth, cday] = checkInDateStr.split("-").map(Number);
      const checkInDate = new Date(cyear, cmonth - 1, cday);

      const [oyear, omonth, oday] = checkOutDateStr.split("-").map(Number);
      const checkOutDate = new Date(oyear, omonth - 1, oday);

      const checkInInRange =
        checkInDate >= rangeStart && checkInDate <= rangeEnd;
      const checkOutInRange =
        checkOutDate >= rangeStart && checkOutDate <= rangeEnd;
      const isActive = checkInDate < rangeStart && checkOutDate > rangeEnd;

      return checkInInRange || checkOutInRange || isActive;
    }

    return true;
  });

  return (
    <div className="flex-1 flex-col space-y-4 pt-6">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal w-[280px]",
                !dateRange?.from && "text-muted-foreground",
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
          size="icon"
          variant="outline"
          title="Buscar Reservas"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>

        {searchExpanded ? (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de cliente o ID de reserva..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-8"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => {
                setSearchExpanded(false);
                setSearchTerm("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSearchExpanded(true)}
            title="Buscar"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Personalizar columnas">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={visibleColumns.id}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, id: checked })
                }
              >
                ID Reserva
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.cliente}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, cliente: checked })
                }
              >
                Cliente
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.telefono}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, telefono: checked })
                }
              >
                Teléfono
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.canal}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, canal: checked })
                }
              >
                Canal
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.tipoVilla}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, tipoVilla: checked })
                }
              >
                Tipo de Villa
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.numeroVilla}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, numeroVilla: checked })
                }
              >
                Número de Villa
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.checkIn}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, checkIn: checked })
                }
              >
                Check-in
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.checkOut}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, checkOut: checked })
                }
              >
                Check-out
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.regimen}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, regimen: checked })
                }
              >
                Régimen
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.huespedes}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, huespedes: checked })
                }
              >
                Huéspedes
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.precio}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, precio: checked })
                }
              >
                Precio
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.estado}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, estado: checked })
                }
              >
                Estado
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.estadoPago}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, estadoPago: checked })
                }
              >
                Estado de Pago
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.importePendiente}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, importePendiente: checked })
                }
              >
                Importe Pendiente
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.tipoPago}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, tipoPago: checked })
                }
              >
                Tipo de Pago
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.fechaPago}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, fechaPago: checked })
                }
              >
                Fecha de Pago
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.usuarioPago}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, usuarioPago: checked })
                }
              >
                Usuario de Pago
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.linkPago}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, linkPago: checked })
                }
              >
                Link de Pago
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.extras}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, extras: checked })
                }
              >
                Extras
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={visibleColumns.observaciones}
                onCheckedChange={(checked) =>
                  setVisibleColumns({ ...visibleColumns, observaciones: checked })
                }
              >
                Observaciones
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      <div className="rounded-md border">
        {filteredReservations.length === 0 && reservations.length > 0 ? (
          <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <Search className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No se encontraron reservas
              </h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                No hay reservas que coincidan con "{searchTerm}"
              </p>
              <Button
                onClick={() => setSearchTerm("")}
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
              <h3 className="mt-4 text-lg font-semibold">
                No hay reservas cargadas
              </h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Selecciona un rango de fechas y haz clic en "Buscar Reservas"
              </p>
              <Button
                onClick={handleFetchReservations}
                disabled={isLoading}
                size="sm"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Buscar Reservas
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.id && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      ID Reserva
                    </TableHead>
                  )}
                  {visibleColumns.cliente && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Cliente
                    </TableHead>
                  )}
                  {visibleColumns.telefono && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Teléfono
                    </TableHead>
                  )}
                  {visibleColumns.canal && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Canal
                    </TableHead>
                  )}
                  {visibleColumns.tipoVilla && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Tipo de Villa
                    </TableHead>
                  )}
                  {visibleColumns.numeroVilla && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Número de Villa
                    </TableHead>
                  )}
                  {visibleColumns.checkIn && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Check-in
                    </TableHead>
                  )}
                  {visibleColumns.checkOut && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Check-out
                    </TableHead>
                  )}
                  {visibleColumns.regimen && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Régimen
                    </TableHead>
                  )}
                  {visibleColumns.huespedes && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Huéspedes
                    </TableHead>
                  )}
                  {visibleColumns.precio && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Precio
                    </TableHead>
                  )}
                  {visibleColumns.estado && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Estado
                    </TableHead>
                  )}
                  {visibleColumns.estadoPago && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Estado de Pago
                    </TableHead>
                  )}
                  {visibleColumns.importePendiente && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Importe Pendiente
                    </TableHead>
                  )}
                  {visibleColumns.tipoPago && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Tipo de Pago
                    </TableHead>
                  )}
                  {visibleColumns.fechaPago && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Fecha de Pago
                    </TableHead>
                  )}
                  {visibleColumns.usuarioPago && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Usuario de Pago
                    </TableHead>
                  )}
                  {visibleColumns.linkPago && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Link de Pago
                    </TableHead>
                  )}
                  {visibleColumns.extras && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Extras
                    </TableHead>
                  )}
                  {visibleColumns.observaciones && (
                    <TableHead className="text-black font-bold whitespace-nowrap">
                      Observaciones
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => {
                  const clientName =
                    reservation.client?.name && reservation.client?.surname
                      ? `${reservation.client.name} ${reservation.client.surname}`
                      : reservation.client_name ||
                        reservation.client_id ||
                        "No disponible";
                  const operatorName =
                    reservation.operator_name || "No disponible";
                  const villaType =
                    reservation.space_type_name || "No disponible";
                  const status = reservation.status.replace(
                    "Reserva confirmada",
                    "Confirmada",
                  );
                  const paymentStatus =
                    reservation.is_fully_paid !== undefined
                      ? reservation.is_fully_paid
                        ? "Pagado"
                        : "Pago Pendiente"
                      : reservation.is_paid
                        ? "Pagado"
                        : "Pendiente";
                  const extras =
                    reservation.extras_text || "No tiene extras contratados";
                  const observations =
                    reservation.client?.observations ||
                    reservation.observations ||
                    "Sin observaciones";
                  const guestsText = `${reservation.adults} adultos${reservation.children > 0 ? `, ${reservation.children} niños` : ""}`;

                  // Determinar si tiene pago pendiente
                  const hasPaymentPending = !(reservation.is_fully_paid !==
                  undefined
                    ? reservation.is_fully_paid
                    : reservation.is_paid);

                  const reservationId =
                    reservation.reservation_id || reservation.reservationId;
                  const isExpanded = expandedRows.has(reservationId);
                  const hasBillingLines =
                    reservation.billing_lines &&
                    reservation.billing_lines.length > 0;

                  // Debug para reserva 1567
                  if (reservationId === 1567) {
                    console.log("🔍 Reservation 1567 render:", {
                      id: reservationId,
                      billing_lines: reservation.billing_lines,
                      hasBillingLines,
                      client: clientName,
                    });
                  }

                  return (
                    <Fragment key={reservationId}>
                      <TableRow
                        className={`h-9 ${hasPaymentPending ? "bg-yellow-500/10" : ""} ${hasBillingLines ? "cursor-pointer hover:bg-gray-50" : ""}`}
                        onClick={() =>
                          hasBillingLines && toggleRowExpansion(reservationId)
                        }
                      >
                        {visibleColumns.id && (
                          <TableCell
                            className="font-medium"
                            title={`${reservationId}`}
                          >
                            <div className="flex items-center gap-2">
                              {hasBillingLines ? (
                                isExpanded ? (
                                  <Minus className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Plus className="h-4 w-4 text-green-600" />
                                )
                              ) : (
                                <div className="w-4" />
                              )}
                              <span className="truncate block max-w-[60ch]">
                                {truncateText(`${reservationId}`)}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.cliente && (
                          <TableCell title={clientName}>
                            <span className="truncate block max-w-[60ch]">
                              {truncateText(clientName)}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.telefono && (
                          <TableCell
                            title={reservation.client?.phone || "No disponible"}
                          >
                            <div className="flex items-center gap-2">
                              {reservation.client?.phone &&
                                reservation.client.phone !== "No disponible" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openWhatsApp(
                                        reservation.client?.phone || "",
                                      );
                                    }}
                                    className="p-1 hover:bg-green-50 rounded transition-colors"
                                    title="Abrir WhatsApp"
                                  >
                                    <MessageCircle className="h-4 w-4 text-green-600" />
                                  </button>
                                )}
                              <span className="truncate block max-w-[60ch]">
                                {truncateText(
                                  reservation.client?.phone || "No disponible",
                                )}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.canal && (
                          <TableCell title={operatorName}>
                            <span className="truncate block max-w-[60ch]">
                              {truncateText(operatorName)}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.tipoVilla && (
                          <TableCell title={villaType}>
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate block max-w-[60ch]">
                                {truncateText(villaType)}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.numeroVilla && (
                          <TableCell
                            title={reservation.space_name || "No disponible"}
                          >
                            <span className="truncate block max-w-[60ch]">
                              {reservation.space_name || "No disponible"}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.checkIn && (
                          <TableCell
                            title={safeDateFormatSimple(
                              reservation.checkInDate ||
                                reservation.check_in_date,
                            )}
                          >
                            <span className="truncate block max-w-[60ch]">
                              {safeDateFormatSimple(
                                reservation.checkInDate ||
                                  reservation.check_in_date,
                              )}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.checkOut && (
                          <TableCell
                            title={safeDateFormatSimple(
                              reservation.checkOutDate ||
                                reservation.check_out_date,
                            )}
                          >
                            <span className="truncate block max-w-[60ch]">
                              {safeDateFormatSimple(
                                reservation.checkOutDate ||
                                  reservation.check_out_date,
                              )}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.regimen && (
                          <TableCell
                            title={reservation.regime_name || reservation.regime}
                          >
                            <span className="truncate block max-w-[60ch]">
                              {truncateText(
                                reservation.regime_name || reservation.regime,
                              )}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.huespedes && (
                          <TableCell title={guestsText}>
                            <span className="truncate block max-w-[60ch]">
                              {truncateText(guestsText)}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.precio && (
                          <TableCell
                            className="font-semibold"
                            title={`€${reservation.price}`}
                          >
                            <span className="truncate block max-w-[60ch]">
                              €{reservation.price}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.estado && (
                          <TableCell title={status}>
                            <div className="flex items-center gap-2">
                              {reservation.status
                                .toLowerCase()
                                .includes("confirmada") ? (
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className="truncate block max-w-[60ch]">
                                {truncateText(status)}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.estadoPago && (
                          <TableCell title={paymentStatus}>
                            {(
                              reservation.is_fully_paid !== undefined
                                ? reservation.is_fully_paid
                                : reservation.is_paid
                            ) ? (
                              <Badge
                                className="bg-green-50 text-green-700 border-green-500 font-normal"
                                style={{ borderRadius: "4px" }}
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
                        )}
                        {visibleColumns.importePendiente && (
                          <TableCell
                            className="font-semibold"
                            title={
                              reservation.billing_total !== undefined
                                ? `€${reservation.billing_total.toFixed(2)}`
                                : "€0.00"
                            }
                          >
                            <span
                              className={`truncate block max-w-[60ch] ${reservation.billing_total && reservation.billing_total > 0 ? "text-red-600" : ""}`}
                            >
                              {reservation.billing_total !== undefined
                                ? reservation.billing_total > 0
                                  ? `€${reservation.billing_total.toFixed(2)}`
                                  : "€0.00"
                                : "€0.00"}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.tipoPago && (
                          <TableCell
                            title={reservation.payment_method || "Pendiente"}
                          >
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
                                  {getPaymentIcon(
                                    reservation.payment_method || "",
                                  )}
                                  <span className="truncate block max-w-[60ch]">
                                    {truncateText(
                                      reservation.payment_method || "N/A",
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.fechaPago && (
                          <TableCell
                            title={reservation.payment_date || "Pendiente"}
                          >
                            <span
                              className={`truncate block max-w-[60ch] ${hasPaymentPending ? "text-muted-foreground" : ""}`}
                            >
                              {hasPaymentPending
                                ? "Pendiente"
                                : reservation.payment_date
                                  ? safeDateFormatSimple(reservation.payment_date)
                                  : "N/A"}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.usuarioPago && (
                          <TableCell
                            title={reservation.payment_user || "Pendiente"}
                          >
                            <span
                              className={`truncate block max-w-[60ch] ${hasPaymentPending ? "text-muted-foreground" : ""}`}
                            >
                              {hasPaymentPending
                                ? "Pendiente"
                                : truncateText(reservation.payment_user || "N/A")}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.linkPago && (
                          <TableCell
                            title={reservation.payment_link || "No disponible"}
                          >
                            <div className="flex items-center gap-1">
                              {reservation.payment_link ? (
                                <>
                                  <button
                                    onClick={() =>
                                      openWhatsApp(
                                        reservation.client?.phone || "",
                                        `Hola ${reservation.client?.name || ""}, aquí está tu link de pago: ${reservation.payment_link}`,
                                      )
                                    }
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Enviar por WhatsApp"
                                    disabled={!reservation.client?.phone}
                                  >
                                    <MessageCircle className="h-3 w-3 text-green-600" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        reservation.payment_link || "",
                                      )
                                    }
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Copiar link"
                                  >
                                    <Copy className="h-3 w-3 text-gray-600" />
                                  </button>
                                  <a
                                    href={reservation.payment_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-800 hover:underline flex items-center gap-1 text-sm truncate max-w-[200px]"
                                    title={reservation.payment_link}
                                  >
                                    <span className="truncate">Link de pago</span>
                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                  </a>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-sm whitespace-nowrap">
                                  No disponible
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.extras && (
                          <TableCell title={extras}>
                            <div className="flex items-center gap-2">
                              {extras === "No tiene extras contratados" ? (
                                <>
                                  <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                  <span className="truncate block max-w-[60ch] text-gray-300">
                                    {truncateText(extras)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  <span className="truncate block max-w-[60ch]">
                                    {truncateText(extras)}
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.observaciones && (
                          <TableCell title={observations}>
                            <span className="truncate block max-w-[60ch]">
                              {truncateText(observations)}
                            </span>
                          </TableCell>
                        )}
                      </TableRow>
                      {isExpanded && reservation.billing_lines && (
                        <>
                          {/* Encabezado de la tabla de facturación */}
                          <TableRow className="h-9 bg-green-200/60 border-l-4 border-l-green-500">
                            <TableCell className="pl-12 text-xs font-semibold text-gray-700">
                              CANT.
                            </TableCell>
                            <TableCell
                              colSpan={2}
                              className="text-xs font-semibold text-gray-700"
                            >
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
                              className="h-9 bg-green-50/50 border-l-4 border-l-green-400"
                            >
                              <TableCell className="pl-12 text-sm text-gray-600">
                                {billingLine.quantity}
                              </TableCell>
                              <TableCell
                                colSpan={2}
                                className="text-sm text-gray-600"
                              >
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
                          <TableRow className="h-9 bg-green-100/70 border-l-4 border-l-green-600">
                            <TableCell
                              colSpan={3}
                              className="pl-12 text-sm font-bold text-gray-800"
                            >
                              Total
                            </TableCell>
                            <TableCell className="text-sm text-gray-600"></TableCell>
                            <TableCell className="text-sm font-bold text-gray-800">
                              €
                              {reservation.billing_lines
                                .reduce((sum, line) => sum + line.total, 0)
                                .toFixed(2)}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservations;
