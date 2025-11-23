import { Bell, Calendar as CalendarIcon, Inbox } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebarRight() {
  return (
    <Sidebar side="right" collapsible="none" className="border-l">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Notificaciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Bell />
                  <span>3 nuevas notificaciones</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Inbox />
                  <span>5 mensajes sin leer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Calendario</SidebarGroupLabel>
          <SidebarGroupContent>
            <Calendar
              mode="single"
              className="rounded-md border"
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Actividad Reciente</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="text-sm space-y-2 px-2">
              <div className="p-2 rounded-md bg-muted">
                <p className="font-medium">Nueva reserva</p>
                <p className="text-xs text-muted-foreground">Hace 5 minutos</p>
              </div>
              <div className="p-2 rounded-md bg-muted">
                <p className="font-medium">Pago recibido</p>
                <p className="text-xs text-muted-foreground">Hace 1 hora</p>
              </div>
              <div className="p-2 rounded-md bg-muted">
                <p className="font-medium">Check-in completado</p>
                <p className="text-xs text-muted-foreground">Hace 2 horas</p>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
