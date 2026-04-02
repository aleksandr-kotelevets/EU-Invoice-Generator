import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import type { Client, InsertClient } from "@shared/schema";
import { EU_COUNTRIES } from "@shared/schema";

function ClientForm({ initial, onSubmit, submitLabel, t }: {
  initial?: Client; onSubmit: (data: InsertClient) => void; submitLabel: string; t: (k: any) => string;
}) {
  const [form, setForm] = useState<InsertClient>({
    name: initial?.name || "", address: initial?.address || "", city: initial?.city || "",
    zip: initial?.zip || "", country: initial?.country || "", vatNumber: initial?.vatNumber || "",
    registrationNumber: initial?.registrationNumber || "", email: initial?.email || "", contactPerson: initial?.contactPerson || "",
  });
  const set = (key: keyof InsertClient, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label>{t("clients.companyName")} *</Label>
        <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Acme GmbH" data-testid="input-client-name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>{t("clients.country")} *</Label>
          <Select value={form.country} onValueChange={v => set("country", v)}>
            <SelectTrigger data-testid="select-client-country"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {EU_COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="UA">Ukraine</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t("clients.vatNumber")}</Label>
          <Input value={form.vatNumber || ""} onChange={e => set("vatNumber", e.target.value)} placeholder="DE123456789" data-testid="input-client-vat" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>{t("clients.address")} *</Label>
        <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Hauptstraße 1" data-testid="input-client-address" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>{t("clients.city")} *</Label>
          <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Berlin" />
        </div>
        <div className="grid gap-2">
          <Label>{t("clients.zip")} *</Label>
          <Input value={form.zip} onChange={e => set("zip", e.target.value)} placeholder="10115" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>{t("clients.regNo")}</Label>
          <Input value={form.registrationNumber || ""} onChange={e => set("registrationNumber", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>{t("clients.email")}</Label>
          <Input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>{t("clients.contactPerson")}</Label>
        <Input value={form.contactPerson || ""} onChange={e => set("contactPerson", e.target.value)} />
      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
        <Button onClick={() => onSubmit(form)} disabled={!form.name || !form.address || !form.city || !form.zip || !form.country} data-testid="button-save-client">
          {submitLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const { data: clients = [], isLoading } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const createMutation = useMutation({
    mutationFn: (data: InsertClient) => apiRequest("POST", "/api/clients", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/clients"] }); setCreateOpen(false); toast({ title: t("clients.created") }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InsertClient }) => apiRequest("PUT", `/api/clients/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/clients"] }); setEditingClient(null); toast({ title: t("clients.updated") }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/clients/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/clients"] }); toast({ title: t("clients.deleted") }); },
  });

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.vatNumber || "").toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-48" />{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6" data-testid="clients-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t("clients.title")}</h1>
          <p className="text-sm text-muted-foreground">{clients.length} {clients.length === 1 ? "client" : "clients"}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm" data-testid="button-add-client"><Plus className="mr-1.5 h-4 w-4" /> {t("clients.addClient")}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{t("clients.newClient")}</DialogTitle></DialogHeader>
            <ClientForm onSubmit={(data) => createMutation.mutate(data)} submitLabel={t("common.create")} t={t} />
          </DialogContent>
        </Dialog>
      </div>

      {clients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("clients.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-xs" data-testid="input-search-clients" />
        </div>
      )}

      {filtered.length === 0 && clients.length > 0 && <p className="text-sm text-muted-foreground py-8 text-center">{t("clients.noMatch")}</p>}

      {clients.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">{t("clients.noClients")}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{t("clients.noClientsDesc")}</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(client => {
            const country = EU_COUNTRIES.find(c => c.code === client.country);
            return (
              <Card key={client.id} data-testid={`card-client-${client.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-sm font-bold text-muted-foreground">{client.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.city}, {country?.name || client.country}{client.vatNumber && <> · <span className="font-mono">{client.vatNumber}</span></>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {client.vatNumber && <Badge variant="secondary" className="text-xs mr-2">VAT</Badge>}
                    <Dialog open={editingClient?.id === client.id} onOpenChange={open => !open && setEditingClient(null)}>
                      <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingClient(client)} data-testid={`button-edit-client-${client.id}`}><Pencil className="h-3.5 w-3.5" /></Button></DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>{t("clients.editClient")}</DialogTitle></DialogHeader>
                        {editingClient && <ClientForm initial={editingClient} onSubmit={(data) => updateMutation.mutate({ id: editingClient.id, data })} submitLabel={t("common.save")} t={t} />}
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" data-testid={`button-delete-client-${client.id}`}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("clients.deleteConfirm")} {client.name}?</AlertDialogTitle>
                          <AlertDialogDescription>{t("inv.deleteConfirm")}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(client.id)}>{t("common.delete")}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
