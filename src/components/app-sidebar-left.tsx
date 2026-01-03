import { Calendar, MessageSquare, Code, UtensilsCrossed, ChevronUp, User2 } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNavigate, useLocation } from "react-router-dom"

const menuItems = [
  {
    title: "Reservas",
    url: "/reservations",
    icon: Calendar,
  },
  {
    title: "Restaurante",
    url: "/restaurant",
    icon: UtensilsCrossed,
  },
  {
    title: "Códigos",
    url: "/codes",
    icon: Code,
  },
  {
    title: "Mensajería",
    url: "/messaging",
    icon: MessageSquare,
  },
]

export function AppSidebarLeft() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Serra Nature</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> Usuario
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
