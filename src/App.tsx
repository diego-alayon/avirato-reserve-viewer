import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/dashboard-layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Reservations from "./pages/Reservations";
import Restaurant from "./pages/Restaurant";
import Codes from "./pages/Codes";
import Messaging from "./pages/Messaging";
import Sync from "./pages/Sync";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reservations" element={<DashboardLayout><Reservations /></DashboardLayout>} />
          <Route path="/restaurant" element={<DashboardLayout><Restaurant /></DashboardLayout>} />
          <Route path="/codes" element={<DashboardLayout><Codes /></DashboardLayout>} />
          <Route path="/messaging" element={<DashboardLayout><Messaging /></DashboardLayout>} />
          <Route path="/sync" element={<DashboardLayout><Sync /></DashboardLayout>} />
          <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
