import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import type { ServiceTemplate, InsertServiceTemplate } from "@shared/schema";
import { CURRENCIES } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function ServiceTemplatesPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InsertServiceTemplate>({ description: "", unitPrice: 0, unit: "hrs", currency: "EUR" });

  const { data: templates = [], isLoading } = useQuery<ServiceTemplate[]>({ queryKey: ["/api/service-templates"] });

  const createMutation = useMutation({
    mutationFn: (data: InsertServiceTemplate) => apiRequest("POST", "/api/service-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-templates"] });
      setOpen(false);
      setForm({ description: "", unitPrice: 0, unit: "hrs", currency: "EUR" });
      toast({ title: t("tpl.saved") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/service-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-templates"] });
      toast({ title: t("tpl.deleted") });
    },
  });

  if (isLoading) {
    return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-16" />)}</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl" data-testid="templates-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{t("tpl.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("tpl.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-add-template">
              <Plus className="mr-1.5 h-4 w-4" /> {t("tpl.addService")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("tpl.newTemplate")}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>{t("tpl.description")} *</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="UI/UX Design" data-testid="input-template-desc" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>{t("tpl.unitPrice")} *</Label>
                  <Input type="number" min={0} step={0.01} value={form.unitPrice || ""} onChange={e => setForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))} data-testid="input-template-price" />
                </div>
                <div className="grid gap-2">
                  <Label>{t("tpl.unit")}</Label>
                  <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="hrs" data-testid="input-template-unit" />
                </div>
                <div className="grid gap-2">
                  <Label>{t("tpl.currency")}</Label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger data-testid="select-template-currency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">{t("common.cancel")}</Button></DialogClose>
                <Button
                  onClick={() => createMutation.mutate(form)}
                  disabled={!form.description || form.unitPrice <= 0}
                  data-testid="button-save-template"
                >
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{t("tpl.noTemplates")}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t("tpl.noTemplatesDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {templates.map(tpl => (
            <Card key={tpl.id} data-testid={`template-${tpl.id}`}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{tpl.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(tpl.unitPrice, tpl.currency)} / {tpl.unit}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(tpl.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
