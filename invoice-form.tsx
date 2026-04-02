import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, todayISO, addDays } from "@/lib/utils";
import type { Client, Invoice, Supplier, ServiceTemplate, LineItem, InsertInvoice } from "@shared/schema";
import { EU_COUNTRIES, CURRENCIES } from "@shared/schema";
import { Link } from "wouter";

interface VatValidation { valid: boolean; name?: string; address?: string; note?: string; }
function emptyLine(): LineItem { return { description: "", quantity: 1, unit: "hrs", unitPrice: 0, total: 0 }; }

export default function InvoiceForm() {
  const params = useParams<{ id?: string }>();
  const isEdit = params.id && params.id !== "new";
  const isDuplicate = typeof window !== "undefined" && window.location.hash.includes("duplicate=");
  const duplicateId = isDuplicate ? new URLSearchParams(window.location.hash.split("?")[1] || "").get("duplicate") : null;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: supplier } = useQuery<Supplier | null>({ queryKey: ["/api/supplier"] });
  const { data: templates = [] } = useQuery<ServiceTemplate[]>({ queryKey: ["/api/service-templates"] });
  const { data: nextNumber } = useQuery<{ number: string }>({ queryKey: ["/api/invoices/next-number"] });
  const { data: existingInvoice, isLoading: loadingInvoice } = useQuery<Invoice>({ queryKey: ["/api/invoices", params.id], enabled: !!isEdit });
  const { data: duplicateInvoice } = useQuery<Invoice>({ queryKey: ["/api/invoices", duplicateId], enabled: !!duplicateId });

  const [clientId, setClientId] = useState<number | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [deliveryDate, setDeliveryDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 14));
  const [currency, setCurrency] = useState("EUR");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [vatRate, setVatRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);
  const [servicePeriod, setServicePeriod] = useState("");
  const [signatureBlockEnabled, setSignatureBlockEnabled] = useState(false);
  const [acceptanceClauseEnabled, setAcceptanceClauseEnabled] = useState(false);
  const [secondaryLanguageEnabled, setSecondaryLanguageEnabled] = useState(false);
  const [vatValidation, setVatValidation] = useState<VatValidation | null>(null);
  const [validatingVat, setValidatingVat] = useState(false);

  useEffect(() => {
    const inv = existingInvoice || duplicateInvoice;
    if (inv) {
      setClientId(inv.clientId);
      setInvoiceNumber(isDuplicate ? (nextNumber?.number || "") : inv.invoiceNumber);
      setIssueDate(isDuplicate ? todayISO() : inv.issueDate);
      setDeliveryDate(isDuplicate ? todayISO() : inv.deliveryDate);
      setDueDate(isDuplicate ? addDays(todayISO(), 14) : inv.dueDate);
      setCurrency(inv.currency);
      setExchangeRate(inv.exchangeRate || 1);
      setVatRate(inv.vatRate);
      setNotes(inv.notes || "");
      setServicePeriod(inv.servicePeriod || "");
      setSignatureBlockEnabled(inv.signatureBlockEnabled || false);
      setAcceptanceClauseEnabled(inv.acceptanceClauseEnabled || false);
      setSecondaryLanguageEnabled(inv.secondaryLanguageEnabled || false);
      try { const items = JSON.parse(inv.lineItems); setLineItems(items.length > 0 ? items : [emptyLine()]); } catch { setLineItems([emptyLine()]); }
    }
  }, [existingInvoice, duplicateInvoice, nextNumber]);

  useEffect(() => { if (!isEdit && !isDuplicate && nextNumber) setInvoiceNumber(nextNumber.number); }, [nextNumber, isEdit, isDuplicate]);

  const selectedClient = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId]);

  // Reverse charge logic — applies for identifikovaná osoba AND plátce DPH when client is EU B2B
  const isReverseCharge = useMemo(() => {
    if (!selectedClient || !supplier) return false;
    const clientCountry = selectedClient.country;
    const supplierCountry = supplier.country;
    const clientHasVat = !!selectedClient.vatNumber;
    const isEuClient = EU_COUNTRIES.some(c => c.code === clientCountry);
    const vatStatus = supplier.vatStatus;
    // RC for identifikovaná osoba or plátce, EU B2B, different countries
    return (vatStatus === "identifikovana" || vatStatus === "platce") && isEuClient && clientHasVat && clientCountry !== supplierCountry;
  }, [selectedClient, supplier]);

  // Is domestic Czech client?
  const isDomestic = useMemo(() => {
    return selectedClient?.country === supplier?.country;
  }, [selectedClient, supplier]);

  useEffect(() => {
    if (isReverseCharge) { setVatRate(0); }
    else if (supplier?.vatStatus === "platce" && isDomestic) { setVatRate(21); }
    else { setVatRate(0); }
  }, [isReverseCharge, supplier, isDomestic]);

  const updateLine = (idx: number, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      updated.total = updated.quantity * updated.unitPrice;
      return updated;
    }));
  };
  const addLine = () => setLineItems(prev => [...prev, emptyLine()]);
  const removeLine = (idx: number) => { if (lineItems.length > 1) setLineItems(prev => prev.filter((_, i) => i !== idx)); };
  const addFromTemplate = (template: ServiceTemplate) => {
    const newLine: LineItem = { description: template.description, quantity: 1, unit: template.unit, unitPrice: template.unitPrice, total: template.unitPrice };
    setLineItems(prev => {
      const last = prev[prev.length - 1];
      if (last && !last.description && last.unitPrice === 0) return [...prev.slice(0, -1), newLine];
      return [...prev, newLine];
    });
  };

  const subtotal = lineItems.reduce((s, item) => s + (item.quantity * item.unitPrice), 0);
  const vatAmount = isReverseCharge ? 0 : subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  const validateVat = async (vatNum: string) => {
    if (!vatNum || vatNum.length < 4) return;
    setValidatingVat(true);
    try { const res = await apiRequest("GET", `/api/validate-vat/${encodeURIComponent(vatNum)}`); setVatValidation(await res.json()); } catch { setVatValidation({ valid: false }); } finally { setValidatingVat(false); }
  };
  useEffect(() => { if (selectedClient?.vatNumber) validateVat(selectedClient.vatNumber); else setVatValidation(null); }, [selectedClient?.vatNumber]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertInvoice) => isEdit ? apiRequest("PUT", `/api/invoices/${params.id}`, data) : apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/next-number"] });
      toast({ title: isEdit ? t("toast.invoiceUpdated") : t("toast.invoiceCreated") });
      navigate("/invoices");
    },
    onError: (err: any) => toast({ title: t("toast.error"), description: err.message, variant: "destructive" }),
  });

  const handleSave = (status: string = "draft") => {
    if (!clientId || !supplier) { toast({ title: t("form.missingData"), description: t("form.missingDataDesc"), variant: "destructive" }); return; }
    saveMutation.mutate({
      invoiceNumber, status, clientId, supplierId: supplier.id, issueDate, deliveryDate, dueDate,
      currency, exchangeRate, subtotal, vatRate: isReverseCharge ? 0 : vatRate, vatAmount, total,
      isReverseCharge, notes, lineItems: JSON.stringify(lineItems),
      servicePeriod: servicePeriod || null,
      signatureBlockEnabled, acceptanceClauseEnabled, secondaryLanguageEnabled,
      createdAt: isEdit ? existingInvoice!.createdAt : new Date().toISOString(),
    });
  };

  if (isEdit && loadingInvoice) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  // Determine invoice VAT regime
  const clientIsEU = selectedClient ? EU_COUNTRIES.some(c => c.code === selectedClient.country) : false;
  const clientIsBusiness = !!selectedClient?.vatNumber;

  // VAT label for summary line
  const vatLabel = (() => {
    if (!supplier) return "";
    if (isReverseCharge) return t("vat.reverseChargeLine");
    if (supplier.vatStatus === "platce" && isDomestic) return `DPH ${vatRate}%`;
    return t("vat.noVatLine");
  })();

  // Explanatory note for summary panel
  const vatExplanation = (() => {
    if (!supplier || !selectedClient) return null;
    const vs = supplier.vatStatus;
    if (vs === "identifikovana") {
      if (isReverseCharge) return t("vat.identEuRcPdf");
      if (isDomestic) return t("vat.identDomesticPdf");
      return t("vat.identOtherPdf");
    }
    if (vs === "platce" && isReverseCharge) return t("vat.platceEuRcPdf");
    if (vs === "neplatce") return t("vat.neplatcePdf");
    return null;
  })();

  return (
    <div className="space-y-6 max-w-4xl" data-testid="invoice-form-page">
      <div className="flex items-center gap-3">
        <Link href="/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-xl font-bold">{isEdit ? t("form.editInvoice") : t("form.newInvoice")}</h1>
          <p className="text-sm text-muted-foreground">{invoiceNumber}</p>
        </div>
      </div>

      {!supplier && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div><p className="text-sm font-medium">{t("form.configureSupplier")}</p>
              <Link href="/settings"><span className="text-xs text-primary underline cursor-pointer">{t("form.goToSettings")}</span></Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("form.invoiceDetails")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>{t("form.invoiceNumber")} *</Label><Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} data-testid="input-invoice-number" /></div>
                <div className="grid gap-2"><Label>{t("form.currency")}</Label>
                  <Select value={currency} onValueChange={setCurrency}><SelectTrigger data-testid="select-currency"><SelectValue /></SelectTrigger><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2"><Label>{t("form.issueDate")} *</Label><Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} data-testid="input-issue-date" /></div>
                <div className="grid gap-2"><Label>{t("form.deliveryDate")} *</Label><Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} /></div>
                <div className="grid gap-2"><Label>{t("form.dueDate")} *</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
              </div>
              <div className="grid gap-2">
                <Label>Service Period</Label>
                <Input value={servicePeriod} onChange={e => setServicePeriod(e.target.value)} placeholder="e.g. 01.03.2026–31.03.2026" data-testid="input-service-period" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t("form.client")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={clientId?.toString() || ""} onValueChange={v => setClientId(Number(v))}>
                <SelectTrigger data-testid="select-client"><SelectValue placeholder={t("form.selectClient")} /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name} — {c.city}, {c.country}</SelectItem>)}</SelectContent>
              </Select>
              {selectedClient && (
                <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
                  <p className="font-medium">{selectedClient.name}</p>
                  <p className="text-muted-foreground">{selectedClient.address}, {selectedClient.zip} {selectedClient.city}</p>
                  <p className="text-muted-foreground">{EU_COUNTRIES.find(c => c.code === selectedClient.country)?.name || selectedClient.country}</p>
                  {selectedClient.vatNumber && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-mono text-xs">{selectedClient.vatNumber}</span>
                      {validatingVat && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                      {vatValidation && !validatingVat && (
                        <Tooltip><TooltipTrigger>
                          {vatValidation.valid && !vatValidation.note ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : vatValidation.valid && vatValidation.note ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                          )}
                        </TooltipTrigger>
                          <TooltipContent className="max-w-xs">{vatValidation.valid ? (vatValidation.note || t("form.vatVerified")) : (vatValidation.note || t("form.vatNotVerified"))}</TooltipContent></Tooltip>
                      )}
                    </div>
                  )}
                  {isReverseCharge && <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t("vat.reverseChargeApplies")}</Badge>}
                </div>
              )}
              {clients.length === 0 && <Link href="/clients"><span className="text-xs text-primary underline cursor-pointer">{t("form.addFirstClient")}</span></Link>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("form.lineItems")}</CardTitle>
              {templates.length > 0 && (
                <Select onValueChange={v => { const tpl = templates.find(t => t.id === Number(v)); if (tpl) addFromTemplate(tpl); }}>
                  <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder={t("form.addFromTemplate")} /></SelectTrigger>
                  <SelectContent>{templates.map(tpl => <SelectItem key={tpl.id} value={tpl.id.toString()}>{tpl.description} ({formatCurrency(tpl.unitPrice, tpl.currency)}/{tpl.unit})</SelectItem>)}</SelectContent>
                </Select>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="hidden sm:grid grid-cols-[1fr_70px_60px_100px_90px_32px] gap-2 text-xs text-muted-foreground font-medium px-1">
                <span>{t("form.description")}</span><span>{t("form.qty")}</span><span>{t("form.unit")}</span><span>{t("form.price")}</span><span className="text-right">{t("form.total")}</span><span></span>
              </div>
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_70px_60px_100px_90px_32px] gap-2 items-start" data-testid={`line-item-${idx}`}>
                  <Input placeholder={t("form.serviceDescription")} value={item.description} onChange={e => updateLine(idx, "description", e.target.value)} className="text-sm" data-testid={`input-line-desc-${idx}`} />
                  <Input type="number" min={0} step={0.5} value={item.quantity || ""} onChange={e => updateLine(idx, "quantity", parseFloat(e.target.value) || 0)} className="text-sm tabular-nums" data-testid={`input-line-qty-${idx}`} />
                  <Input value={item.unit} onChange={e => updateLine(idx, "unit", e.target.value)} className="text-sm" />
                  <Input type="number" min={0} step={0.01} value={item.unitPrice || ""} onChange={e => updateLine(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="text-sm tabular-nums" data-testid={`input-line-price-${idx}`} />
                  <p className="text-sm font-medium tabular-nums text-right self-center">{formatCurrency(item.quantity * item.unitPrice, currency)}</p>
                  <Button variant="ghost" size="icon" onClick={() => removeLine(idx)} disabled={lineItems.length <= 1} className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLine} className="w-full mt-2" data-testid="button-add-line"><Plus className="mr-1.5 h-3.5 w-3.5" /> {t("form.addLine")}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t("form.notes")}</CardTitle></CardHeader>
            <CardContent><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("form.notesPlaceholder")} rows={3} data-testid="input-notes" /></CardContent>
          </Card>

          {/* PDF options */}
          <Card>
            <CardHeader><CardTitle className="text-base">PDF Options</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Bilingual mode (EN + UA)</Label>
                  <p className="text-xs text-muted-foreground">Show Ukrainian labels alongside English on the invoice</p>
                </div>
                <Switch checked={secondaryLanguageEnabled} onCheckedChange={setSecondaryLanguageEnabled} data-testid="switch-bilingual" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Signature block</Label>
                  <p className="text-xs text-muted-foreground">Add signature line for Contractor</p>
                </div>
                <Switch checked={signatureBlockEnabled} onCheckedChange={setSignatureBlockEnabled} data-testid="switch-signature" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Acceptance clause</Label>
                  <p className="text-xs text-muted-foreground">Payment confirms full delivery and acceptance</p>
                </div>
                <Switch checked={acceptanceClauseEnabled} onCheckedChange={setAcceptanceClauseEnabled} data-testid="switch-acceptance" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader><CardTitle className="text-base">{t("form.summary")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("form.subtotal")}</span><span className="font-medium tabular-nums">{formatCurrency(subtotal, currency)}</span></div>
              {supplier?.vatStatus === "platce" && !isReverseCharge && (
                <div className="flex items-center gap-2"><Label className="text-sm text-muted-foreground">{t("form.vatPercent")}</Label>
                  <Input type="number" min={0} max={100} step={1} value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value) || 0)} className="w-20 h-8 text-sm tabular-nums" data-testid="input-vat-rate" />
                </div>
              )}
              {/* Only show VAT line if plátce DPH with actual VAT */}
              {supplier?.vatStatus === "platce" && !isReverseCharge && isDomestic && vatAmount > 0 && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{vatLabel}</span><span className="font-medium tabular-nums">{formatCurrency(vatAmount, currency)}</span></div>
              )}
              {/* For non-VAT cases show the regime label */}
              {!(supplier?.vatStatus === "platce" && !isReverseCharge && isDomestic && vatAmount > 0) && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{vatLabel}</span><span className="font-medium tabular-nums">{formatCurrency(0, currency)}</span></div>
              )}
              <Separator />
              <div className="flex justify-between"><span className="font-semibold">{t("form.total")}</span><span className="text-lg font-bold tabular-nums">{formatCurrency(total, currency)}</span></div>
              {vatExplanation && (
                <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 rounded p-2 whitespace-pre-line">
                  {vatExplanation}
                </p>
              )}
              <Separator />
              <div className="grid gap-2">
                <Button onClick={() => handleSave("draft")} variant="outline" disabled={saveMutation.isPending} className="w-full" data-testid="button-save-draft">
                  {saveMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} {t("form.saveDraft")}
                </Button>
                <Button onClick={() => handleSave("sent")} disabled={saveMutation.isPending || !clientId} className="w-full" data-testid="button-save-sent">{t("form.saveSent")}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
