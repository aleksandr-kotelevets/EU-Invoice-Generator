import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import InvoicesPage from "@/pages/invoices";
import InvoiceForm from "@/pages/invoice-form";
import InvoicePreview from "@/pages/invoice-preview";
import ClientsPage from "@/pages/clients";
import SettingsPage from "@/pages/settings";
import ServiceTemplatesPage from "@/pages/service-templates";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function AppRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/invoices" component={InvoicesPage} />
        <Route path="/invoices/new" component={InvoiceForm} />
        <Route path="/invoices/:id/preview" component={InvoicePreview} />
        <Route path="/invoices/:id" component={InvoiceForm} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/templates" component={ServiceTemplatesPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <AppRouter />
            </Router>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
