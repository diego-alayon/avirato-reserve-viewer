import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { PanelLeft, PanelRight } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AppSidebarLeft } from "@/components/app-sidebar-left"
import { AppSidebarRight } from "@/components/app-sidebar-right"
import { useLocation } from "react-router-dom"
import { useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const getBreadcrumbs = (pathname: string) => {
  const routes: Record<string, string> = {
    "/reservations": "Reservas",
    "/restaurant": "Restaurante",
    "/codes": "Códigos",
    "/messaging": "Mensajería",
    "/sync": "Sincronización",
    "/settings": "Configuración",
  }
  return routes[pathname] || "Dashboard"
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation()
  const currentPage = getBreadcrumbs(location.pathname)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)

  return (
    <SidebarProvider open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
      <AppSidebarLeft />
      <SidebarInset className="overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="-ml-1"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/">
                      Serra Nature
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentPage}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-1 ml-auto"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-auto">
          {children}
        </div>
      </SidebarInset>
      <AppSidebarRight open={rightSidebarOpen} onOpenChange={setRightSidebarOpen} />
    </SidebarProvider>
  )
}
