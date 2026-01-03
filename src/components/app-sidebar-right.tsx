import {
  Calendar as CalendarIcon,
  Euro,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAvirato } from "@/hooks/useAvirato";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AppSidebarRightProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppSidebarRight({ open, onOpenChange }: AppSidebarRightProps) {
  const { reservations } = useAvirato();

  // Calcular estadísticas
  const totalReservations = reservations.length;

  // Facturación total
  const totalBilling = reservations.reduce((sum, r) => {
    if (r.billing_lines) {
      return (
        sum + r.billing_lines.reduce((lineSum, line) => lineSum + line.total, 0)
      );
    }
    return sum + (r.price || 0);
  }, 0);

  // Reservas pendientes de pago
  const pendingPayment = reservations.filter(
    (r) => !r.is_fully_paid && !r.is_paid,
  ).length;

  // Extras contratados
  const extrasMap = new Map<string, number>();
  reservations.forEach((r) => {
    if (r.charges && Array.isArray(r.charges)) {
      r.charges.forEach((charge) => {
        if (charge.type === "extra" && charge.concept) {
          const current = extrasMap.get(charge.concept) || 0;
          extrasMap.set(charge.concept, current + (charge.quantity || 1));
        }
      });
    }
    if (r.predefinedCharges && Array.isArray(r.predefinedCharges)) {
      r.predefinedCharges.forEach((charge) => {
        if (charge.type === "extra" && charge.concept) {
          const current = extrasMap.get(charge.concept) || 0;
          extrasMap.set(charge.concept, current + (charge.quantity || 1));
        }
      });
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] overflow-y-auto"
      >
        <div className="gap-4 p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Estadísticas</h2>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-green-600" />
                  Reservas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReservations}</div>
                <CardDescription className="text-xs">
                  Total en fechas seleccionadas
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Euro className="h-4 w-4 text-green-600" />
                  Facturación Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{totalBilling.toFixed(2)}
                </div>
                <CardDescription className="text-xs">
                  Suma de todas las reservas
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Pendientes de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingPayment}</div>
                <CardDescription className="text-xs">
                  Reservas sin pagar
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {extrasMap.size > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Extras Contratados</h3>
              <div className="space-y-2">
                {Array.from(extrasMap.entries()).map(([extra, count]) => (
                  <Card key={extra}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-green-600" />
                        {extra}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{count}</div>
                      <CardDescription className="text-xs">
                        Unidades contratadas
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
