import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Mail, Users, CreditCard } from 'lucide-react';
import { type AviratoReservation } from '@/services/avirato';

interface ReservationCardProps {
  reservation: AviratoReservation;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'confirmada':
      return 'bg-success text-success-foreground';
    case 'pending':
    case 'pendiente':
      return 'bg-yellow-500 text-white';
    case 'cancelled':
    case 'cancelada':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const ReservationCard = ({ reservation }: ReservationCardProps) => {
  const checkInDate = new Date(reservation.check_in_date).toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const checkOutDate = new Date(reservation.check_out_date).toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Card className="hover:shadow-elegant transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            {reservation.client_name}
          </CardTitle>
          <Badge className={getStatusColor(reservation.status)}>
            {reservation.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          {reservation.client_id}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="font-medium">Check-in:</span>
          <span>{checkInDate}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="font-medium">Check-out:</span>
          <span>{checkOutDate}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-medium">Huéspedes:</span>
          <span>
            {reservation.adults} adultos
            {reservation.children && reservation.children > 0 && `, ${reservation.children} niños`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="font-medium">Precio:</span>
          <span className="font-semibold text-lg">
            €{reservation.price}
          </span>
        </div>

        {reservation.regime && (
          <div className="text-sm">
            <span className="font-medium">Régimen:</span>
            <span className="ml-2">{reservation.regime}</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          ID: {reservation.reservation_id || reservation.reservationId} • Creada: {new Date(reservation.created_at || reservation.createdAt).toLocaleDateString('es-ES')}
        </div>
      </CardContent>
    </Card>
  );
};