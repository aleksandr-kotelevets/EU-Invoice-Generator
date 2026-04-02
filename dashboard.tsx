import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Users, TrendingUp, Clock, Plus, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import type { Invoice, Client, Supplier } from "@shared/schema";
import { EU_COUNTRIES } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

function StatCard({ label, value, icon: Icon, subtitle }: {
  label: string; value: string | number; icon: any; subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface ExchangeRateData {
  source: string;
  date: string;
  rates: Record<string, number>;
  baseIsEUR?: boolean;
  updatedAt: string;
}

export default function Dashboard() {
  const { t } = useI18n();
  const [displayCurrency, setDisplayCurrency] = useState("EUR");

  const { data: invoices = [], isLoading: loadingInv } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });
  const { data: clients = [], isLoading: loadingCli } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });
  const { data: supplier } = useQuery<Supplier | null>({
    queryKey: ["/api/supplier"],
  });
  const { data: ratesData, isLoading: loadingRates } = useQuery<ExchangeRateData>({
    queryKey: ["/api/exchange-rates"],
  });

  const isLoading = loadingInv || loadingCli;

  // --- Currency conversion ---
  // CNB rates: 1 unit of foreign currency = X CZK
  // So EUR rate = 24.52 means 1 EUR = 24.52 CZK
  const convertToDisplay = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === displayCurrency) return amount;
    if (!ratesData?.rates) return amount; // no rates available, return as-is

    const rates = ratesData.rates;

    if (ratesData.baseIsEUR) {
      // Frankfurter: rates are "1 EUR = X currency"
      // Convert from -> EUR -> displayCurrency
      let inEUR = amount;
      if (fromCurrency !== "EUR" && rates[fromCurrency]) {
        inEUR = amount / rates[fromCurrency];
      }
      if (displayCurrency === "EUR") return inEUR;
      if (rates[displayCurrency]) return inEUR * rates[displayCurrency];
      return inEUR;
    } else {
      // CNB: rates are "1 unit = X CZK"
      // Convert from -> CZK -> displayCurrency
      let inCZK = amount;
      if (fromCurrency === "CZK") {
        inCZK = amount;
      } else if (rates[fromCurrency]) {
        inCZK = amount * rates[fromCurrency]; // amount units * (CZK per unit)
      }
      if (displayCurrency === "CZK") return inCZK;
      if (rates[displayCurrency]) return inCZK / rates[displayCurrency];
      return inCZK;
    }
  };

  const sumInvoices = (list: Invoice[]) => list.reduce((s, i) => s + convertToDisplay(i.total, i.currency), 0);

  const totalRevenue = sumInvoices(invoices.filter(i => i.status === "paid"));
  const pendingAmount = sumInvoices(invoices.filter(i => i.status === "sent"));
  const overdueCount = invoices.filter(i => i.status === "overdue").length;
  const thisMonth = invoices.filter(i => {
    const d = new Date(i.issueDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthRevenue = sumInvoices(thisMonth.filter(i => i.status === "paid"));

  // Check if there are EU invoices this month (for souhrnné hlášení reminder)
  const hasEuInvoicesThisMonth = thisMonth.some(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    if (!client || !supplier) return false;
    const isEu = EU_COUNTRIES.some(c => c.code === client.country);
    return isEu && client.country !== supplier.country && !!client.vatNumber;
  });
  const isIdentifikovana = supplier?.vatStatus === "identifikovana" || supplier?.vatStatus === "platce";

  // Format exchange rate display
  const showRates = ratesData?.rates;
  const rateEntries = showRates ? (() => {
    if (ratesData.baseIsEUR) {
      return [
        { code: "CZK", rate: showRates["CZK"] },
        { code: "USD", rate: showRates["USD"] },
        { code: "GBP", rate: showRates["GBP"] },
        { code: "PLN", rate: showRates["PLN"] },
      ].filter(r => r.rate);
    }
    return [
      { code: "EUR", rate: showRates["EUR"] },
      { code: "USD", rate: showRates["USD"] },
      { code: "GBP", rate: showRates["GBP"] },
      { code: "PLN", rate: showRates["PLN"] },
    ].filter(r => r.rate);
  })() : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t("dash.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("dash.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
            <SelectTrigger className="w-[90px] h-9" data-testid="select-display-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="CZK">CZK</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/invoices/new">
            <Button size="sm" data-testid="button-new-invoice">
              <Plus className="mr-1.5 h-4 w-4" />
              {t("dash.newInvoice")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Souhrnné hlášení reminder */}
      {isIdentifikovana && hasEuInvoicesThisMonth && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">{t("dash.souhrnneReminder")}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("dash.totalRevenue")} value={formatCurrency(totalRevenue, displayCurrency)} icon={TrendingUp} subtitle={`${t("dash.thisMonth")}: ${formatCurrency(monthRevenue, displayCurrency)}`} />
        <StatCard label={t("dash.pending")} value={formatCurrency(pendingAmount, displayCurrency)} icon={Clock} subtitle={`${invoices.filter(i => i.status === "sent").length} ${t("dash.nInvoices")}`} />
        <StatCard label={t("dash.invoices")} value={invoices.length} icon={FileText} subtitle={overdueCount > 0 ? `${overdueCount} ${t("dash.overdue")}` : t("dash.allOnTrack")} />
        <StatCard label={t("dash.clients")} value={clients.length} icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Recent invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">{t("dash.recentInvoices")}</CardTitle>
            <Link href="/invoices">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                {t("dash.viewAll")} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{t("dash.noInvoices")}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{t("dash.noInvoicesDesc")}</p>
                <Link href="/invoices/new">
                  <Button size="sm" variant="outline" className="mt-4">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("dash.createInvoice")}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {invoices.slice(0, 5).map((inv) => {
                  const client = clients.find(c => c.id === inv.clientId);
                  const statusKey = `status.${inv.status}` as any;
                  return (
                    <Link key={inv.id} href={`/invoices/${inv.id}`}>
                      <div className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors cursor-pointer" data-testid={`invoice-row-${inv.id}`}>
                        <div>
                          <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">{client?.name || "—"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className={statusColors[inv.status]}>
                            {t(statusKey)}
                          </Badge>
                          <span className="text-sm font-semibold tabular-nums w-28 text-right">
                            {formatCurrency(inv.total, inv.currency)}
                          </span>
                          <span className="text-xs text-muted-foreground w-20 text-right">
                            {formatDate(inv.issueDate)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exchange rates widget */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {t("dash.exchangeRates")}
            </CardTitle>
            {ratesData && (
              <p className="text-xs text-muted-foreground">
                {t("dash.ratesSource")}: {ratesData.source} · {ratesData.date}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {loadingRates ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-8" />)}</div>
            ) : rateEntries.length > 0 ? (
              <div className="space-y-2">
                {ratesData?.baseIsEUR ? (
                  rateEntries.map(({ code, rate }) => (
                    <div key={code} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{code}</span>
                      <span className="text-sm font-medium tabular-nums">{rate?.toFixed(code === "CZK" ? 3 : 4)}</span>
                    </div>
                  ))
                ) : (
                  rateEntries.map(({ code, rate }) => (
                    <div key={code} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-xs font-bold bg-muted px-1.5 py-0.5 rounded">{code}</span>
                      <span className="text-sm font-medium tabular-nums">{rate?.toFixed(3)} CZK</span>
                    </div>
                  ))
                )}
                <p className="text-[10px] text-muted-foreground/60 pt-1">
                  {ratesData?.baseIsEUR ? "1 EUR =" : "1 unit ="}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">{t("common.noData")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
