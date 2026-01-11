/**
 * Settings Page
 *
 * Shows Last.app API configuration status from environment variables
 * Provides instructions for secure configuration
 */

import { useState, useEffect } from 'react';
import { lastAppService } from '@/services/lastapp';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Settings2, CheckCircle2, XCircle, Loader2, Shield, FileCode, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  // Check configuration on mount
  useEffect(() => {
    const token = lastAppService.getToken();
    const orgId = lastAppService.getOrganizationId();
    const locId = lastAppService.getLocationId();

    setHasToken(!!token);
    setHasOrganization(!!orgId);
    setHasLocation(!!locId);
  }, []);

  const handleValidateConnection = async () => {
    setIsLoading(true);
    try {
      await lastAppService.validateConnection();
      setIsValidated(true);
      toast({
        title: 'Conexión exitosa',
        description: 'Las credenciales de Last.app son válidas',
      });
    } catch (error: any) {
      setIsValidated(false);
      toast({
        title: 'Error de conexión',
        description: error.message || 'No se pudo validar la conexión',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const configStatus = hasToken && hasOrganization && hasLocation;

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-full p-3">
          <Settings2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración de Last.app</h1>
          <p className="text-muted-foreground mt-1">
            Configuración segura mediante variables de entorno
          </p>
        </div>
      </div>

      {/* Security Alert */}
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-400">Configuración Segura</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-500">
          Las credenciales de Last.app se configuran mediante variables de entorno en el archivo <code className="font-mono text-xs px-1 py-0.5 bg-green-100 dark:bg-green-900 rounded">.env.local</code>,
          que nunca se sube al repositorio. Esto previene la exposición accidental de tokens.
        </AlertDescription>
      </Alert>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estado de Configuración</CardTitle>
              <CardDescription>
                Variables de entorno cargadas desde .env.local
              </CardDescription>
            </div>
            {configStatus ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Incompleto
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono">VITE_LASTAPP_TOKEN</code>
            </div>
            {hasToken ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-600">
                <XCircle className="h-3 w-3 mr-1" />
                No configurado
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono">VITE_LASTAPP_ORGANIZATION_ID</code>
            </div>
            {hasOrganization ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Opcional
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono">VITE_LASTAPP_LOCATION_ID</code>
            </div>
            {hasLocation ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Opcional
              </Badge>
            )}
          </div>

          <div className="pt-4">
            <Button
              onClick={handleValidateConnection}
              disabled={!hasToken || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Validando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Validar Conexión
                </>
              )}
            </Button>
          </div>

          {isValidated && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-500">
                Token validado correctamente. La conexión con Last.app funciona.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Cómo Configurar
          </CardTitle>
          <CardDescription>
            Pasos para configurar las credenciales de Last.app de forma segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Abre el archivo .env.local</p>
                <p className="text-sm text-muted-foreground">
                  En la raíz del proyecto, abre (o crea) el archivo <code className="font-mono text-xs px-1 py-0.5 bg-muted rounded">.env.local</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Obtén tu token de Last.app</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Accede al panel de desarrolladores de Last.app y genera un Bearer Token
                </p>
                <a
                  href="https://developers.last.app/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  → developers.last.app/docs
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Configura las variables</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Agrega las siguientes líneas al archivo .env.local:
                </p>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`VITE_LASTAPP_TOKEN=tu_token_aqui
VITE_LASTAPP_ORGANIZATION_ID=tu_org_id
VITE_LASTAPP_LOCATION_ID=tu_loc_id`}
                </pre>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Reinicia el servidor de desarrollo</p>
                <p className="text-sm text-muted-foreground">
                  Detén el servidor (Ctrl+C) y vuelve a ejecutar <code className="font-mono text-xs px-1 py-0.5 bg-muted rounded">npm run dev</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                5
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">Valida la conexión</p>
                <p className="text-sm text-muted-foreground">
                  Usa el botón "Validar Conexión" arriba para verificar que todo funciona correctamente
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notes */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Notas de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>No compartas .env.local:</strong> Este archivo nunca debe subirse al repositorio (está en .gitignore)
            </li>
            <li>
              <strong>Variables de entorno:</strong> Las credenciales solo existen en tu máquina local y en el servidor de producción
            </li>
            <li>
              <strong>Más seguro que localStorage:</strong> Los tokens no son accesibles desde el navegador ni vulnerables a XSS
            </li>
            <li>
              <strong>Para producción:</strong> Configura estas mismas variables en tu servidor de deployment (Vercel, Netlify, etc.)
            </li>
            <li>
              <strong>Rotación de tokens:</strong> Si crees que tu token fue comprometido, genera uno nuevo en Last.app y actualiza .env.local
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
