import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Search, FileText, Copy, Trash2, Eye, MoreHorizontal, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import type { Invoice, Client } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const { t } = useI18n();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/invoices/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/invoices"] }); queryClient.invalidateQueries({ queryKey: ["/api/invoices/next-number"] }); toast({ title: t("toast.invoiceDeleted") }); },
  });
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest("PUT", `/api/invoices/${id}`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/invoices"] }); toast({ title: t("toast.statusUpdated") }); },
  });

  const filtered = invoices.filter(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || (client?.name || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch && (statusFilter === "all" || inv.status === statusFilter);
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-48" />{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>;

  return (
    <div className="space-y-6" data-testid="invoices-page">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">{t("inv.title")}</h1><p className="text-sm text-muted-foreground">{invoices.length} {t("inv.total")}</p></div>
        <Link href="/invoices/new"><Button size="sm" data-testid="button-new-invoice"><Plus className="mr-1.5 h-4 w-4" /> {t("dash.newInvoice")}</Button></Link>
      </div>

      {invoices.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("inv.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" data-testid="input-search-invoices" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("inv.allStatuses")}</SelectItem>
              <SelectItem value="draft">{t("status.draft")}</SelectItem>
              <SelectItem value="sent">{t("status.sent")}</SelectItem>
              <SelectItem value="paid">{t("status.paid")}</SelectItem>
              <SelectItem value="overdue">{t("status.overdue")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {invoices.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">{t("inv.noInvoices")}</p>
          <Link href="/invoices/new"><Button size="sm" variant="outline" className="mt-4"><Plus className="mr-1.5 h-3.5 w-3.5" /> {t("dash.createInvoice")}</Button></Link>
        </CardContent></Card>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t("inv.noMatch")}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => {
            const client = clients.find(c => c.id === inv.clientId);
            const statusKey = `status.${inv.status}` as any;
            return (
              <Card key={inv.id} data-testid={`invoice-card-${inv.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted"><FileText className="h-4 w-4 text-muted-foreground" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{inv.invoiceNumber}</p>
                        <Badge variant="secondary" className={statusColors[inv.status]}>{t(statusKey)}</Badge>
                        {inv.isReverseCharge && <Badge variant="outline" className="text-xs">RC</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{client?.name || "—"} · {formatDate(inv.issueDate)} · {t("inv.due")} {formatDate(inv.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(inv.total, inv.currency)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-actions-${inv.id}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/invoices/${inv.id}`}><DropdownMenuItem><Eye className="mr-2 h-3.5 w-3.5" /> {t("inv.viewEdit")}</DropdownMenuItem></Link>
                        <Link href={`/invoices/${inv.id}/preview`}><DropdownMenuItem><Download className="mr-2 h-3.5 w-3.5" /> {t("inv.previewPdf")}</DropdownMenuItem></Link>
                        <Link href={`/invoices/new?duplicate=${inv.id}`}><DropdownMenuItem><Copy className="mr-2 h-3.5 w-3.5" /> {t("inv.duplicate")}</DropdownMenuItem></Link>
                        <DropdownMenuSeparator />
                        {inv.status === "draft" && <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inv.id, status: "sent" })}>{t("inv.markSent")}</DropdownMenuItem>}
                        {inv.status === "sent" && <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inv.id, status: "paid" })}>{t("inv.markPaid")}</DropdownMenuItem>}
                        {(inv.status === "sent" || inv.status === "draft") && <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inv.id, status: "overdue" })}>{t("inv.markOverdue")}</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-3.5 w-3.5" /> {t("common.delete")}</DropdownMenuItem></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>{t("common.delete")} {inv.invoiceNumber}?</AlertDialogTitle><AlertDialogDescription>{t("inv.deleteConfirm")}</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(inv.id)}>{t("common.delete")}</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
