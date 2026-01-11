/**
 * Sync Page
 *
 * Customer synchronization dashboard
 * Allows manual and automatic sync of customers from Avirato to Last.app
 */

import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, RefreshCw, Settings, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function Sync() {
  const {
    isSyncing,
    syncProgress,
    syncMessage,
    syncStats,
    syncLogs,
    isAutoSyncEnabled,
    syncInterval,
    lastSyncTime,
    startSync,
    configureSyncInterval,
    toggleAutoSync,
    refreshLogs,
    clearLogs
  } = useSync();

  // Local states for date picker
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [intervalMinutes, setIntervalMinutes] = useState(syncInterval / 60000);

  const handleSync = async () => {
    // Validate dates before syncing
    if (!startDate || !endDate) {
      return;
    }
    if (startDate > endDate) {
      return;
    }
    await startSync(startDate, endDate);
  };

  const handleIntervalChange = (minutes: number) => {
    if (minutes < 1 || minutes > 1440) return;
    setIntervalMinutes(minutes);
    configureSyncInterval(minutes * 60000);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sincronización de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Sincroniza clientes de Avirato con Last.app para asociar reservas de restaurante con huéspedes del hotel
          </p>
        </div>
        <Button onClick={refreshLogs} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procesados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {syncStats?.itemsProcessed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes únicos encontrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exitosos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {syncStats?.itemsSucceeded || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes sincronizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {syncStats?.itemsFailed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Errores durante sync
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Sync</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {lastSyncTime ? format(lastSyncTime, 'dd/MM/yyyy HH:mm', { locale: es }) : 'Nunca'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Última sincronización
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Sync */}
      <Card>
        <CardHeader>
          <CardTitle>Sincronización Manual</CardTitle>
          <CardDescription>
            Selecciona el rango de fechas para sincronizar clientes de reservas de Avirato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            {/* Start Date */}
            <div className="flex-1">
              <Label>Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'PPP', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="flex-1">
              <Label>Fecha Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'PPP', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Sync Button */}
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="min-w-[140px]"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isSyncing && (
            <div className="space-y-2">
              <Progress value={syncProgress} />
              <p className="text-sm text-muted-foreground">{syncMessage}</p>
            </div>
          )}

          {/* Duration */}
          {syncStats?.duration && (
            <p className="text-sm text-muted-foreground">
              Duración: {(syncStats.duration / 1000).toFixed(2)}s
            </p>
          )}
        </CardContent>
      </Card>

      {/* Auto Sync Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sincronización Automática
          </CardTitle>
          <CardDescription>
            Configura la sincronización periódica automática de clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activar sincronización automática</Label>
              <p className="text-sm text-muted-foreground">
                Sincroniza automáticamente clientes cada cierto tiempo
              </p>
            </div>
            <Switch
              checked={isAutoSyncEnabled}
              onCheckedChange={toggleAutoSync}
            />
          </div>

          {isAutoSyncEnabled && (
            <div className="space-y-2">
              <Label>Intervalo (minutos)</Label>
              <Input
                type="number"
                min="1"
                max="1440"
                value={intervalMinutes}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Sincronización cada {intervalMinutes} minuto{intervalMinutes !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Historial de Sincronización</CardTitle>
              <CardDescription>
                Últimas 100 operaciones de sincronización
              </CardDescription>
            </div>
            <Button
              onClick={clearLogs}
              variant="outline"
              size="sm"
              disabled={syncLogs.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead className="text-right">Duración</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      No hay logs de sincronización
                    </TableCell>
                  </TableRow>
                ) : (
                  syncLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                      </TableCell>
                      <TableCell>{log.operation}</TableCell>
                      <TableCell>
                        <Badge variant={log.level === 'error' ? 'destructive' : 'default'}>
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{log.message}</TableCell>
                      <TableCell className="text-right">
                        {log.duration ? `${(log.duration / 1000).toFixed(2)}s` : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
