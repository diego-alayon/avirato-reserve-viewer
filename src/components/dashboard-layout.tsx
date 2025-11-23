import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
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

interface DashboardLayoutProps {
  children: React.ReactNode
}

const getBreadcrumbs = (pathname: string) => {
  const routes: Record<string, string> = {
    "/reservations": "Reservas",
    "/restaurant": "Restaurante",
    "/codes": "Códigos",
    "/messaging": "Mensajería",
  }
  return routes[pathname] || "Dashboard"
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation()
  const currentPage = getBreadcrumbs(location.pathname)

  return (
    <SidebarProvider>
      <AppSidebarLeft />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
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
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
      <AppSidebarRight />
    </SidebarProvider>
  )
}
