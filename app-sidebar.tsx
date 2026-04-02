import { Link, useLocation } from "wouter";
import { FileText, Users, Settings, LayoutDashboard, Sun, Moon, BookTemplate, Globe } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const langLabels: Record<Lang, string> = { en: "EN", cs: "CZ", uk: "UA" };

export function AppSidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: t("nav.dashboard") },
    { href: "/invoices", icon: FileText, label: t("nav.invoices") },
    { href: "/clients", icon: Users, label: t("nav.clients") },
    { href: "/templates", icon: BookTemplate, label: t("nav.services") },
    { href: "/settings", icon: Settings, label: t("nav.settings") },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/" || location === "";
    return location.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-[220px] flex-col border-r border-sidebar-border bg-sidebar" data-testid="sidebar">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="Faktura logo">
          <rect x="2" y="2" width="24" height="24" rx="5" stroke="currentColor" strokeWidth="2" className="text-primary" />
          <path d="M8 9h12M8 13h8M8 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary" />
          <circle cx="20" cy="19" r="3" fill="currentColor" className="text-primary" />
          <path d="M19 19l1 1 2-2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-base font-bold tracking-tight text-foreground">Faktura</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                isActive(item.href)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
              data-testid={`nav-${item.href === "/" ? "dashboard" : item.href.slice(1)}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-1">
        {/* Language selector */}
        <div className="flex items-center gap-2 px-1">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
            <SelectTrigger className="h-8 flex-1 text-xs" data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="cs">Čeština</SelectItem>
              <SelectItem value="uk">Українська</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-2 text-muted-foreground"
          data-testid="button-theme-toggle"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === "light" ? t("nav.darkMode") : t("nav.lightMode")}
        </Button>
      </div>
    </aside>
  );
}
