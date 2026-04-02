import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import type { Invoice, Client, Supplier, LineItem } from "@shared/schema";
import { EU_COUNTRIES } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvoicePreview() {
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useI18n();

  const { data: invoice, isLoading: loadingInv } = useQuery<Invoice>({ queryKey: ["/api/invoices", id] });
  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const { data: supplier } = useQuery<Supplier | null>({ queryKey: ["/api/supplier"] });

  const client = clients.find(c => c.id === invoice?.clientId);
  let lineItems: LineItem[] = [];
  try { lineItems = invoice ? JSON.parse(invoice.lineItems) : []; } catch { lineItems = []; }

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoice?.invoiceNumber || "Invoice"}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;line-height:1.5}@page{size:A4;margin:20mm}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${el.innerHTML}</body></html>`);
    pw.document.close();
    setTimeout(() => pw.print(), 300);
  };

  if (loadingInv) return <Skeleton className="h-[600px]" />;
  if (!invoice || !supplier) return <p className="text-sm text-muted-foreground">Invoice not found or supplier not configured.</p>;

  // --- Bilingual helper ---
  const bi = invoice.secondaryLanguageEnabled;
  const L = (en: string, uk: string) => bi ? `${en} / ${uk}` : en;

  const supplierCountryName = EU_COUNTRIES.find(c => c.code === supplier.country)?.name || supplier.country;
  const clientCountryName = client ? (EU_COUNTRIES.find(c => c.code === client.country)?.name || client.country) : "";

  // --- Determine VAT regime ---
  const clientIsEU = client ? EU_COUNTRIES.some(c => c.code === client.country) : false;
  const clientIsCZ = client?.country === supplier.country;
  const clientIsBusiness = !!client?.vatNumber;
  const vs = supplier.vatStatus;

  const getVatNoteText = (): string | null => {
    if (vs === "identifikovana") {
      if (invoice.isReverseCharge && clientIsEU && clientIsBusiness && !clientIsCZ) return t("vat.identEuRcPdf");
      if (clientIsCZ) return t("vat.identDomesticPdf");
      return t("vat.identOtherPdf");
    }
    if (vs === "platce" && invoice.isReverseCharge) return t("vat.platceEuRcPdf");
    if (vs === "neplatce") return t("vat.neplatcePdf");
    return null;
  };
  const vatNoteText = getVatNoteText();

  const vatLineLabel = (() => {
    if (invoice.isReverseCharge) return t("vat.reverseChargeLine");
    if (vs === "platce" && clientIsCZ && invoice.vatRate > 0) return `DPH (${invoice.vatRate}%)`;
    return t("vat.noVatLine");
  })();

  const supplierStatusLine = (() => {
    if (vs === "identifikovana") return t("vat.identSupplierLine");
    if (vs === "neplatce") return lang === "cs" ? "Neplátce DPH" : "Not a VAT payer";
    return null;
  })();

  const fmtDate = (d: string) => {
    const parts = d.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return formatDate(d);
  };

  // --- Label constants ---
  const thStyle = { textAlign: "left" as const, padding: "10px 8px", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.5px", color: "#888", fontWeight: "600" as const };

  // Acceptance clause texts
  const acceptanceEN = "Payment of this invoice confirms that the services have been delivered in full scope, accepted by the Customer, and that the Parties have no mutual claims related to this invoice. No additional acceptance documents are required.";
  const acceptanceUK = "Оплата цього інвойсу підтверджує, що послуги надані в повному обсязі, прийняті Замовником, і що Сторони не мають взаємних претензій щодо цього інвойсу. Додаткові акти приймання не потрібні.";

  return (
    <div className="space-y-4" data-testid="invoice-preview-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-xl font-bold">{t("pdf.preview")}: {invoice.invoiceNumber}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print"><Printer className="mr-1.5 h-4 w-4" /> {t("pdf.print")}</Button>
          <Button size="sm" onClick={handlePrint} data-testid="button-export-pdf"><Download className="mr-1.5 h-4 w-4" /> {t("pdf.exportPdf")}</Button>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] rounded-lg border bg-white shadow-sm overflow-hidden">
        <div ref={printRef}>
          <div style={{ padding: "48px", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#1a1a1a", lineHeight: "1.5", fontSize: "13px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
              <div>
                <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#01696F", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
                  {bi ? "INVOICE / ІНВОЙС" : "INVOICE"}
                </h1>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#555" }}>{invoice.invoiceNumber}</p>
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", color: "#666" }}>
                <p><strong>Issue Date:</strong> {fmtDate(invoice.issueDate)}</p>
                <p><strong>Delivery Date (DUZP):</strong> {fmtDate(invoice.deliveryDate)}</p>
                <p><strong>Due Date:</strong> {fmtDate(invoice.dueDate)}</p>
                {invoice.servicePeriod && (
                  <p><strong>{L("Service period", "Період надання послуг")}:</strong> {invoice.servicePeriod}</p>
                )}
              </div>
            </div>

            {/* Supplier & Client */}
            <div style={{ display: "flex", gap: "40px", marginBottom: "36px" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: "8px", fontWeight: "600" }}>
                  {L("CONTRACTOR", "ПІДРЯДНИК")}
                </p>
                <p style={{ fontWeight: "700", fontSize: "14px" }}>{supplier.name}</p>
                <p>{supplier.address}</p>
                <p>{supplier.zip} {supplier.city}</p>
                <p>{supplierCountryName}</p>
                <p style={{ marginTop: "6px" }}><strong>IČO:</strong> {supplier.ico}</p>
                {supplier.dic && <p><strong>DIČ:</strong> {supplier.dic}</p>}
                {supplierStatusLine && (
                  <p style={{ color: "#666", fontStyle: "italic", fontSize: "11px", marginTop: "4px" }}>{supplierStatusLine}</p>
                )}
                {supplier.email && <p style={{ marginTop: "4px" }}>{supplier.email}</p>}
              </div>
              {client && (
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: "8px", fontWeight: "600" }}>
                    {L("CUSTOMER", "ЗАМОВНИК")}
                  </p>
                  <p style={{ fontWeight: "700", fontSize: "14px" }}>{client.name}</p>
                  <p>{client.address}</p>
                  <p>{client.zip} {client.city}</p>
                  <p>{clientCountryName}</p>
                  {client.vatNumber && <p style={{ marginTop: "6px" }}><strong>VAT:</strong> {client.vatNumber}</p>}
                  {client.registrationNumber && <p><strong>Reg:</strong> {client.registrationNumber}</p>}
                  {client.contactPerson && <p style={{ marginTop: "4px" }}>{client.contactPerson}</p>}
                </div>
              )}
            </div>

            {/* Line items table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e5e5" }}>
                  <th style={thStyle}>{L("DESCRIPTION", "ОПИС")}</th>
                  <th style={{ ...thStyle, textAlign: "right", width: "70px" }}>{L("QTY", "К-ТЬ")}</th>
                  <th style={{ ...thStyle, textAlign: "center", width: "50px" }}>{L("UNIT", "ОД")}</th>
                  <th style={{ ...thStyle, textAlign: "right", width: "100px" }}>{L("PRICE", "ЦІНА")}</th>
                  <th style={{ ...thStyle, textAlign: "right", width: "110px" }}>{L("AMOUNT", "СУМА")}</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 8px" }}>{item.description}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{item.quantity}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>{item.unit}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: "600", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(item.quantity * item.unitPrice, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "280px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px" }}>
                  <span style={{ color: "#666" }}>{L("Subtotal", "Проміжний підсумок")}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {vs === "platce" && !invoice.isReverseCharge && clientIsCZ && invoice.vatAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px" }}>
                    <span style={{ color: "#666" }}>{vatLineLabel}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(invoice.vatAmount, invoice.currency)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 6px 0", borderTop: "2px solid #1a1a1a", fontSize: "16px", fontWeight: "700" }}>
                  <span>{L("Total", "Усього")}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#888", textAlign: "right" }}>
                  {L("Currency", "Валюта")}: {invoice.currency}
                </div>
              </div>
            </div>

            {/* VAT regime notice */}
            {vatNoteText && (
              <div style={{ marginTop: "24px", padding: "12px 16px", background: "#f0f7f8", borderRadius: "6px", fontSize: "12px", color: "#555", lineHeight: "1.6", whiteSpace: "pre-line" }}>
                {vatNoteText}
              </div>
            )}

            {/* Acceptance clause */}
            {invoice.acceptanceClauseEnabled && (
              <div style={{ marginTop: "24px", padding: "12px 16px", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "12px", color: "#444", lineHeight: "1.6" }}>
                <p>{acceptanceEN}</p>
                {bi && <p style={{ marginTop: "8px", color: "#666" }}>{acceptanceUK}</p>}
              </div>
            )}

            {/* Bank details */}
            {(supplier.iban || supplier.bankName) && (
              <div style={{ marginTop: "24px", fontSize: "12px", color: "#666" }}>
                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: "6px", fontWeight: "600" }}>
                  {L("PAYMENT DETAILS", "ПЛАТІЖНІ РЕКВІЗИТИ")}
                </p>
                {supplier.bankName && <p><strong>{L("Bank", "Банк")}:</strong> {supplier.bankName}</p>}
                {supplier.iban && <p><strong>IBAN:</strong> {supplier.iban}</p>}
                {supplier.swift && <p><strong>SWIFT:</strong> {supplier.swift}</p>}
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#999", marginBottom: "6px", fontWeight: "600" }}>
                  {L("NOTES", "ПРИМІТКИ")}
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}>{invoice.notes}</p>
              </div>
            )}

            {/* Signature block — contractor only */}
            {invoice.signatureBlockEnabled && (
              <div style={{ marginTop: "48px", fontSize: "12px", color: "#444", maxWidth: "320px" }}>
                <p style={{ marginBottom: "40px", fontWeight: "600" }}>{L("Contractor", "Підрядник")}:</p>
                <div style={{ borderBottom: "1px solid #999", marginBottom: "6px" }}></div>
                <p style={{ fontSize: "11px" }}>Oleksandr Kotelevets</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
