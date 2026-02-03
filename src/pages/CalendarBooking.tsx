/**
 * CalendarBooking Page - Isolated calendar component
 * This page is completely separate from Reservations page to avoid conflicts
 */

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  addDays,
  startOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isWithinInterval,
  parseISO,
  subMonths,
  addMonths,
  isToday,
  getDay,
  endOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/hooks/useCalendar";
import type { CalendarSpace, CalendarReservation, CalendarRate } from "@/services/calendar.service";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Day names in Spanish (abbreviated)
const DAY_NAMES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

// Month names in Spanish
const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

interface ReservationBlock {
  id: number;
  clientName: string;
  checkIn: Date;
  checkOut: Date;
  price: number;
  spaceId: number;
  channel: string;
}

const CalendarBooking = () => {
  const {
    spaces,
    reservations,
    rates,
    isLoadingSpaces,
    isLoadingReservations,
    isLoadingRates,
    isAuthenticated,
    error,
    loadSpaces,
    loadRates,
    loadReservationsForDateRange,
    clearError,
  } = useCalendar();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Track if initial load has happened
  const initialLoadDone = useRef(false);

  // Calculate view dates
  const viewStartDate = useMemo(() => {
    const firstOfMonth = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    return addDays(firstOfMonth, -2);
  }, [selectedMonth, selectedYear]);

  const viewEndDate = useMemo(() => {
    const lastOfMonth = endOfMonth(new Date(selectedYear, selectedMonth, 1));
    return addDays(lastOfMonth, 5);
  }, [selectedMonth, selectedYear]);

  const daysToDisplay = useMemo(() => {
    return eachDayOfInterval({ start: viewStartDate, end: viewEndDate });
  }, [viewStartDate, viewEndDate]);

  // Load spaces on mount (only once)
  useEffect(() => {
    if (isAuthenticated && spaces.length === 0 && !isLoadingSpaces) {
      loadSpaces();
    }
  }, [isAuthenticated]); // Minimal dependencies - only run when auth changes

  // Load rates on mount (only once)
  useEffect(() => {
    if (isAuthenticated && rates.length === 0 && !isLoadingRates) {
      loadRates();
    }
  }, [isAuthenticated]); // Minimal dependencies - only run when auth changes

  // Load reservations when month/year changes
  useEffect(() => {
    if (!isAuthenticated) return;

    // Calculate fetch dates based on current selection
    const firstOfMonth = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const lastOfMonth = endOfMonth(new Date(selectedYear, selectedMonth, 1));
    const fetchStart = addDays(firstOfMonth, -32);
    const fetchEnd = addDays(lastOfMonth, 35);

    loadReservationsForDateRange(fetchStart, fetchEnd);
  }, [selectedMonth, selectedYear, isAuthenticated]); // Only these dependencies

  // Process reservations into blocks mapped by space_id
  const reservationsBySpaceId = useMemo(() => {
    const map = new Map<number, ReservationBlock[]>();

    spaces.forEach((space) => {
      map.set(space.space_id, []);
    });

    reservations.forEach((reservation: CalendarReservation) => {
      if (!reservation.check_in_date || !reservation.check_out_date || !reservation.space_id) {
        return;
      }

      const checkIn = parseISO(reservation.check_in_date.split(" ")[0]);
      const checkOut = parseISO(reservation.check_out_date.split(" ")[0]);

      const block: ReservationBlock = {
        id: reservation.reservation_id,
        clientName: reservation.client_name,
        checkIn,
        checkOut,
        price: reservation.price,
        spaceId: reservation.space_id,
        channel: reservation.operator_name,
      };

      const existing = map.get(reservation.space_id) || [];
      existing.push(block);
      map.set(reservation.space_id, existing);
    });

    return map;
  }, [reservations, spaces]);

  // Navigation handlers - simple state updates only
  const goToPreviousMonth = useCallback(() => {
    const newDate = subMonths(new Date(selectedYear, selectedMonth, 1), 1);
    setSelectedMonth(newDate.getMonth());
    setSelectedYear(newDate.getFullYear());
  }, [selectedMonth, selectedYear]);

  const goToNextMonth = useCallback(() => {
    const newDate = addMonths(new Date(selectedYear, selectedMonth, 1), 1);
    setSelectedMonth(newDate.getMonth());
    setSelectedYear(newDate.getFullYear());
  }, [selectedMonth, selectedYear]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
  }, []);

  const handleMonthSelect = useCallback((value: string) => {
    const [year, month] = value.split("-").map(Number);
    setSelectedYear(year);
    setSelectedMonth(month);
  }, []);

  // Get reservation for a specific space and day
  const getReservationForDay = useCallback(
    (spaceId: number, day: Date): ReservationBlock | null => {
      const spaceReservations = reservationsBySpaceId.get(spaceId) || [];
      return (
        spaceReservations.find((res) =>
          isWithinInterval(day, { start: res.checkIn, end: addDays(res.checkOut, -1) })
        ) || null
      );
    },
    [reservationsBySpaceId]
  );

  const isReservationStart = useCallback(
    (reservation: ReservationBlock, day: Date): boolean => {
      return isSameDay(reservation.checkIn, day);
    },
    []
  );

  const getReservationSpan = useCallback(
    (reservation: ReservationBlock, day: Date): number => {
      const endDay = addDays(reservation.checkOut, -1);
      let span = 0;
      let currentDay = day;

      while (currentDay <= endDay && currentDay <= viewEndDate) {
        span++;
        currentDay = addDays(currentDay, 1);
      }

      return span;
    },
    [viewEndDate]
  );

  // Create a map of rates by space_subtype_id for quick lookup
  const ratesBySubtype = useMemo(() => {
    const map = new Map<number, CalendarRate>();
    rates.forEach((rate) => {
      if (rate.space_subtype_id) {
        map.set(rate.space_subtype_id, rate);
      }
    });
    return map;
  }, [rates]);

  // Create a map of space_id to space_subtype_id
  const spaceSubtypeMap = useMemo(() => {
    const map = new Map<number, number>();
    spaces.forEach((space) => {
      map.set(space.space_id, space.space_subtype_id);
    });
    return map;
  }, [spaces]);

  const getDayPrice = useCallback((spaceId: number, day: Date): string => {
    // Get the space's subtype
    const subtypeId = spaceSubtypeMap.get(spaceId);
    if (!subtypeId) return '-';

    // Get the rate for this subtype
    const rate = ratesBySubtype.get(subtypeId);
    if (!rate || !rate.prices || rate.prices.length === 0) return '-';

    // Format the day as YYYY-MM-DD to match API format
    const dayStr = format(day, 'yyyy-MM-dd');

    // Find the price for this specific day
    const dayPrice = rate.prices.find((p) => p.date === dayStr);
    if (dayPrice && dayPrice.price > 0) {
      return `${dayPrice.price}€`;
    }

    return '-';
  }, [spaceSubtypeMap, ratesBySubtype]);

  const getChannelBadge = useCallback((channel: string): string => {
    const lowerChannel = channel.toLowerCase();
    if (lowerChannel.includes("booking")) return "B";
    if (lowerChannel.includes("expedia")) return "E";
    if (lowerChannel.includes("airbnb")) return "A";
    if (lowerChannel.includes("motor")) return "M";
    if (lowerChannel.includes("vrbo")) return "V";
    return "D";
  }, []);

  const handleRefresh = useCallback(() => {
    clearError();
    // Force reload by updating the fetch
    const firstOfMonth = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const lastOfMonth = endOfMonth(new Date(selectedYear, selectedMonth, 1));
    const fetchStart = addDays(firstOfMonth, -32);
    const fetchEnd = addDays(lastOfMonth, 35);
    loadReservationsForDateRange(fetchStart, fetchEnd);
  }, [clearError, selectedMonth, selectedYear, loadReservationsForDateRange]);

  const isLoading = isLoadingSpaces || isLoadingReservations || isLoadingRates;

  const monthOptions = useMemo(() => {
    return [-2, -1, 0, 1, 2, 3, 4, 5].map((offset) => {
      const date = addMonths(new Date(), offset);
      return {
        month: date.getMonth(),
        year: date.getFullYear(),
        value: `${date.getFullYear()}-${date.getMonth()}`,
        label: `${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`,
      };
    });
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No estás autenticado. Por favor, inicia sesión para ver el calendario.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 flex-col space-y-4 pt-6">
      {/* Header with navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-9 w-9"
          disabled={isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Select
          value={`${selectedYear}-${selectedMonth}`}
          onValueChange={handleMonthSelect}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue>
              {MONTH_NAMES[selectedMonth]} de {selectedYear}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          className="h-9 w-9"
          disabled={isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          onClick={goToToday}
          className="h-9"
          disabled={isLoading}
        >
          Hoy
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-9 w-9 ml-2"
          title="Actualizar calendario"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>

        {isLoading && (
          <span className="text-sm text-muted-foreground ml-2">Cargando...</span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Calendar grid */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 bg-muted/50 w-28 p-2 text-left font-medium border-r border-b border-border z-10">
                Villa
              </th>
              {daysToDisplay.map((day, index) => {
                const dayName = DAY_NAMES[getDay(day)];
                const dayNumber = format(day, "d");
                const monthAbbr = format(day, "MMM", { locale: es });
                const isCurrentDay = isToday(day);
                const isCurrentMonth = day.getMonth() === selectedMonth;

                return (
                  <th
                    key={index}
                    className={cn(
                      "p-1 text-center border-r border-b border-border min-w-[60px]",
                      isCurrentDay && "bg-gray-800 text-white",
                      !isCurrentMonth && !isCurrentDay && "text-muted-foreground bg-muted/30"
                    )}
                  >
                    <div className="text-[10px] font-normal">{dayName}</div>
                    <div className={cn("text-sm font-bold", isCurrentDay && "text-white")}>
                      {dayNumber}
                    </div>
                    <div className="text-[10px] font-normal">{monthAbbr}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {spaces.length === 0 ? (
              <tr>
                <td
                  colSpan={daysToDisplay.length + 1}
                  className="text-center py-12 text-muted-foreground"
                >
                  {isLoadingSpaces ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Cargando villas...</span>
                    </div>
                  ) : (
                    "No se encontraron villas. Verifica la conexión con Avirato."
                  )}
                </td>
              </tr>
            ) : (
              spaces.map((space, spaceIndex) => (
                <CalendarRow
                  key={space.space_id}
                  space={space}
                  spaceIndex={spaceIndex}
                  daysToDisplay={daysToDisplay}
                  getReservationForDay={getReservationForDay}
                  isReservationStart={isReservationStart}
                  getReservationSpan={getReservationSpan}
                  getDayPrice={getDayPrice}
                  getChannelBadge={getChannelBadge}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        {spaces.length > 0 && (
          <span>
            {spaces.length} villas · {reservations.length} reservas cargadas
          </span>
        )}
      </div>
    </div>
  );
};

// Separate row component for better performance
interface CalendarRowProps {
  space: CalendarSpace;
  spaceIndex: number;
  daysToDisplay: Date[];
  getReservationForDay: (spaceId: number, day: Date) => ReservationBlock | null;
  isReservationStart: (reservation: ReservationBlock, day: Date) => boolean;
  getReservationSpan: (reservation: ReservationBlock, day: Date) => number;
  getDayPrice: (spaceId: number, day: Date) => string;
  getChannelBadge: (channel: string) => string;
}

const CalendarRow = ({
  space,
  spaceIndex,
  daysToDisplay,
  getReservationForDay,
  isReservationStart,
  getReservationSpan,
  getDayPrice,
  getChannelBadge,
}: CalendarRowProps) => {
  const cells: React.ReactNode[] = [];
  let skipUntil = -1;

  daysToDisplay.forEach((day, dayIndex) => {
    if (dayIndex < skipUntil) return;

    const reservation = getReservationForDay(space.space_id, day);

    if (reservation && isReservationStart(reservation, day)) {
      const span = getReservationSpan(reservation, day);
      skipUntil = dayIndex + span;

      const truncatedName =
        reservation.clientName.length > 16
          ? reservation.clientName.substring(0, 16) + "..."
          : reservation.clientName;

      const channelBadge = getChannelBadge(reservation.channel);

      cells.push(
        <td
          key={`${space.space_id}-${dayIndex}`}
          colSpan={span}
          className="relative p-0 h-10 border-r border-b border-border"
        >
          <div
            className="absolute inset-y-1 left-0.5 right-0.5 bg-blue-500 rounded flex items-center px-1.5 text-white text-xs font-medium overflow-hidden cursor-pointer hover:bg-blue-600 transition-colors"
            title={`${reservation.clientName}\n${format(reservation.checkIn, "dd/MM/yyyy")} - ${format(reservation.checkOut, "dd/MM/yyyy")}\n€${reservation.price}\nCanal: ${reservation.channel || 'Directo'}`}
          >
            <span className="bg-blue-700 text-white text-[10px] font-bold rounded px-1 mr-1 flex-shrink-0">
              {channelBadge}
            </span>
            <span className="truncate">{truncatedName}</span>
          </div>
        </td>
      );
    } else if (reservation && !isReservationStart(reservation, day)) {
      // Skip - handled by colSpan from the start day
    } else {
      // Empty cell with price
      cells.push(
        <td
          key={`${space.space_id}-${dayIndex}`}
          className="text-center p-1 h-10 border-r border-b border-border text-xs text-muted-foreground"
        >
          {getDayPrice(space.space_id, day)}
        </td>
      );
    }
  });

  return (
    <tr className="hover:bg-muted/20">
      <td className="sticky left-0 bg-background w-28 p-2 font-medium border-r border-b border-border z-10 text-sm whitespace-nowrap">
        ({spaceIndex + 1}) {space.space_name}
      </td>
      {cells}
    </tr>
  );
};

export default CalendarBooking;
