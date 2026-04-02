import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Building, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import type { Supplier, InsertSupplier, VatStatus } from "@shared/schema";
import { EU_COUNTRIES } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const { t } = useI18n();
  const { data: supplier, isLoading } = useQuery<Supplier | null>({ queryKey: ["/api/supplier"] });

  const [form, setForm] = useState<InsertSupplier>({
    name: "", address: "", city: "", zip: "", country: "CZ",
    ico: "", dic: "", vatStatus: "neplatce",
    bankName: "", iban: "", swift: "", email: "", phone: "",
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name, address: supplier.address, city: supplier.city,
        zip: supplier.zip, country: supplier.country, ico: supplier.ico,
        dic: supplier.dic || "", vatStatus: supplier.vatStatus as VatStatus,
        bankName: supplier.bankName || "", iban: supplier.iban || "",
        swift: supplier.swift || "", email: supplier.email || "", phone: supplier.phone || "",
      });
    }
  }, [supplier]);

  const mutation = useMutation({
    mutationFn: (data: InsertSupplier) => apiRequest("POST", "/api/supplier", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier"] });
      toast({ title: t("settings.saved") });
    },
    onError: () => toast({ title: t("settings.error"), variant: "destructive" }),
  });

  const set = (key: keyof InsertSupplier, val: any) => setForm(f => ({ ...f, [key]: val }));

  if (isLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl" data-testid="settings-page">
      <div>
        <h1 className="text-xl font-bold">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-4 w-4" /> {t("settings.companyDetails")}
          </CardTitle>
          <CardDescription>{t("settings.companyDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("settings.companyName")} *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jan Novák" data-testid="input-supplier-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("settings.ico")} *</Label>
              <Input value={form.ico} onChange={e => set("ico", e.target.value)} placeholder="12345678" data-testid="input-supplier-ico" />
            </div>
            <div className="grid gap-2">
              <Label>{t("settings.country")} *</Label>
              <Select value={form.country} onValueChange={v => set("country", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EU_COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>{t("settings.address")} *</Label>
            <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Vinohradská 12" data-testid="input-supplier-address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("settings.city")} *</Label>
              <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Praha" />
            </div>
            <div className="grid gap-2">
              <Label>{t("settings.zip")} *</Label>
              <Input value={form.zip} onChange={e => set("zip", e.target.value)} placeholder="12000" />
            </div>
          </div>
          {/* DIČ always visible */}
          <div className="grid gap-2">
            <Label>{t("settings.dic")}</Label>
            <Input value={form.dic || ""} onChange={e => set("dic", e.target.value)} placeholder="CZ12345678" data-testid="input-supplier-dic" />
          </div>
        </CardContent>
      </Card>

      {/* VAT Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> {t("settings.vatStatus")}
          </CardTitle>
          <CardDescription>{t("settings.vatStatusDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={form.vatStatus}
            onValueChange={(v) => set("vatStatus", v)}
            className="space-y-4"
            data-testid="radio-vat-status"
          >
            <div className="flex items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-muted/40 transition-colors">
              <RadioGroupItem value="neplatce" id="neplatce" className="mt-0.5" />
              <div>
                <Label htmlFor="neplatce" className="font-medium cursor-pointer">{t("settings.neplatce")}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t("settings.neplatceDesc")}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rounded-md border border-primary/30 bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-colors">
              <RadioGroupItem value="identifikovana" id="identifikovana" className="mt-0.5" />
              <div>
                <Label htmlFor="identifikovana" className="font-medium cursor-pointer">{t("settings.identifikovana")}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t("settings.identifikovanaDesc")}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rounded-md border p-4 cursor-pointer hover:bg-muted/40 transition-colors">
              <RadioGroupItem value="platce" id="platce" className="mt-0.5" />
              <div>
                <Label htmlFor="platce" className="font-medium cursor-pointer">{t("settings.platce")}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{t("settings.platceDesc")}</p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.bankDetails")}</CardTitle>
          <CardDescription>{t("settings.bankDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>{t("settings.bankName")}</Label>
            <Input value={form.bankName || ""} onChange={e => set("bankName", e.target.value)} placeholder="Fio banka" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("settings.iban")}</Label>
              <Input value={form.iban || ""} onChange={e => set("iban", e.target.value)} placeholder="CZ65..." data-testid="input-supplier-iban" />
            </div>
            <div className="grid gap-2">
              <Label>{t("settings.swift")}</Label>
              <Input value={form.swift || ""} onChange={e => set("swift", e.target.value)} placeholder="FIOBCZPP" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.contact")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>{t("settings.email")}</Label>
              <Input type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t("settings.phone")}</Label>
              <Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => mutation.mutate(form)}
        disabled={!form.name || !form.ico || !form.address || !form.city || !form.zip || mutation.isPending}
        className="w-full sm:w-auto"
        data-testid="button-save-settings"
      >
        <Save className="mr-1.5 h-4 w-4" />
        {mutation.isPending ? t("settings.saving") : t("settings.saveSettings")}
      </Button>
    </div>
  );
}
