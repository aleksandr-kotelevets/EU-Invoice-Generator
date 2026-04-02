import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "cs" | "uk";

const translations = {
  // === COMMON ===
  "common.cancel": { en: "Cancel", cs: "Zrušit", uk: "Скасувати" },
  "common.save": { en: "Save", cs: "Uložit", uk: "Зберегти" },
  "common.delete": { en: "Delete", cs: "Smazat", uk: "Видалити" },
  "common.edit": { en: "Edit", cs: "Upravit", uk: "Редагувати" },
  "common.create": { en: "Create", cs: "Vytvořit", uk: "Створити" },
  "common.search": { en: "Search", cs: "Hledat", uk: "Пошук" },
  "common.actions": { en: "Actions", cs: "Akce", uk: "Дії" },
  "common.back": { en: "Back", cs: "Zpět", uk: "Назад" },
  "common.yes": { en: "Yes", cs: "Ano", uk: "Так" },
  "common.no": { en: "No", cs: "Ne", uk: "Ні" },
  "common.loading": { en: "Loading...", cs: "Načítání...", uk: "Завантаження..." },
  "common.noData": { en: "No data", cs: "Žádná data", uk: "Немає даних" },
  "common.confirm": { en: "Confirm", cs: "Potvrdit", uk: "Підтвердити" },
  "common.language": { en: "Language", cs: "Jazyk", uk: "Мова" },

  // === NAV ===
  "nav.dashboard": { en: "Dashboard", cs: "Přehled", uk: "Панель" },
  "nav.invoices": { en: "Invoices", cs: "Faktury", uk: "Інвойси" },
  "nav.clients": { en: "Clients", cs: "Klienti", uk: "Клієнти" },
  "nav.services": { en: "Services", cs: "Služby", uk: "Послуги" },
  "nav.settings": { en: "Settings", cs: "Nastavení", uk: "Налаштування" },
  "nav.darkMode": { en: "Dark mode", cs: "Tmavý režim", uk: "Темна тема" },
  "nav.lightMode": { en: "Light mode", cs: "Světlý režim", uk: "Світла тема" },

  // === DASHBOARD ===
  "dash.title": { en: "Dashboard", cs: "Přehled", uk: "Панель" },
  "dash.subtitle": { en: "Overview of your invoicing activity", cs: "Přehled vaší fakturační činnosti", uk: "Огляд вашої інвойсної активності" },
  "dash.totalRevenue": { en: "Total Revenue", cs: "Celkový příjem", uk: "Загальний дохід" },
  "dash.pending": { en: "Pending", cs: "Čeká na platbu", uk: "Очікує оплати" },
  "dash.invoices": { en: "Invoices", cs: "Faktury", uk: "Інвойси" },
  "dash.clients": { en: "Clients", cs: "Klienti", uk: "Клієнти" },
  "dash.thisMonth": { en: "This month", cs: "Tento měsíc", uk: "Цей місяць" },
  "dash.allOnTrack": { en: "All on track", cs: "Vše v pořádku", uk: "Все в порядку" },
  "dash.overdue": { en: "overdue", cs: "po splatnosti", uk: "прострочено" },
  "dash.recentInvoices": { en: "Recent Invoices", cs: "Poslední faktury", uk: "Останні інвойси" },
  "dash.viewAll": { en: "View all", cs: "Zobrazit vše", uk: "Переглянути всі" },
  "dash.noInvoices": { en: "No invoices yet", cs: "Zatím žádné faktury", uk: "Інвойсів поки немає" },
  "dash.noInvoicesDesc": { en: "Create your first invoice to get started", cs: "Vytvořte svou první fakturu", uk: "Створіть свій перший інвойс" },
  "dash.createInvoice": { en: "Create Invoice", cs: "Vytvořit fakturu", uk: "Створити інвойс" },
  "dash.newInvoice": { en: "New Invoice", cs: "Nová faktura", uk: "Новий інвойс" },
  "dash.exchangeRates": { en: "Exchange Rates", cs: "Kurzy měn", uk: "Курси валют" },
  "dash.ratesSource": { en: "Source: CNB", cs: "Zdroj: ČNB", uk: "Джерело: ЧНБ" },
  "dash.ratesUpdated": { en: "Updated", cs: "Aktualizováno", uk: "Оновлено" },
  "dash.souhrnneReminder": { en: "Souhrnné hlášení due by 25th for EU invoices this month", cs: "Souhrnné hlášení — odevzdat do 25. za EU faktury tohoto měsíce", uk: "Souhrnné hlášení — подати до 25-го за ЄС інвойси цього місяця" },
  "dash.nInvoices": { en: "invoices", cs: "faktur", uk: "інвойсів" },

  // === INVOICES LIST ===
  "inv.title": { en: "Invoices", cs: "Faktury", uk: "Інвойси" },
  "inv.total": { en: "total", cs: "celkem", uk: "всього" },
  "inv.searchPlaceholder": { en: "Search invoices...", cs: "Hledat faktury...", uk: "Пошук інвойсів..." },
  "inv.allStatuses": { en: "All statuses", cs: "Všechny stavy", uk: "Всі статуси" },
  "inv.noInvoices": { en: "No invoices yet", cs: "Zatím žádné faktury", uk: "Інвойсів поки немає" },
  "inv.noMatch": { en: "No invoices match your search", cs: "Žádné faktury neodpovídají vyhledávání", uk: "Жоден інвойс не відповідає пошуку" },
  "inv.viewEdit": { en: "View / Edit", cs: "Zobrazit / Upravit", uk: "Переглянути / Редагувати" },
  "inv.previewPdf": { en: "Preview PDF", cs: "Náhled PDF", uk: "Попередній перегляд PDF" },
  "inv.duplicate": { en: "Duplicate", cs: "Duplikovat", uk: "Дублювати" },
  "inv.markSent": { en: "Mark as Sent", cs: "Označit jako odeslanou", uk: "Позначити як надіслано" },
  "inv.markPaid": { en: "Mark as Paid", cs: "Označit jako zaplacenou", uk: "Позначити як оплачено" },
  "inv.markOverdue": { en: "Mark as Overdue", cs: "Označit jako po splatnosti", uk: "Позначити як прострочено" },
  "inv.deleteConfirm": { en: "This action cannot be undone.", cs: "Tato akce je nevratná.", uk: "Цю дію неможливо скасувати." },
  "inv.due": { en: "Due", cs: "Splatnost", uk: "Термін" },

  // === STATUSES ===
  "status.draft": { en: "Draft", cs: "Koncept", uk: "Чернетка" },
  "status.sent": { en: "Sent", cs: "Odesláno", uk: "Надіслано" },
  "status.paid": { en: "Paid", cs: "Zaplaceno", uk: "Оплачено" },
  "status.overdue": { en: "Overdue", cs: "Po splatnosti", uk: "Прострочено" },

  // === INVOICE FORM ===
  "form.newInvoice": { en: "New Invoice", cs: "Nová faktura", uk: "Новий інвойс" },
  "form.editInvoice": { en: "Edit Invoice", cs: "Upravit fakturu", uk: "Редагувати інвойс" },
  "form.invoiceDetails": { en: "Invoice Details", cs: "Detaily faktury", uk: "Деталі інвойсу" },
  "form.invoiceNumber": { en: "Invoice Number", cs: "Číslo faktury", uk: "Номер інвойсу" },
  "form.currency": { en: "Currency", cs: "Měna", uk: "Валюта" },
  "form.issueDate": { en: "Issue Date", cs: "Datum vystavení", uk: "Дата виставлення" },
  "form.deliveryDate": { en: "Delivery Date", cs: "Datum dodání", uk: "Дата постачання" },
  "form.dueDate": { en: "Due Date", cs: "Datum splatnosti", uk: "Дата оплати" },
  "form.exchangeRate": { en: "Exchange Rate", cs: "Kurz", uk: "Курс" },
  "form.client": { en: "Client", cs: "Klient", uk: "Клієнт" },
  "form.selectClient": { en: "Select client", cs: "Vyberte klienta", uk: "Оберіть клієнта" },
  "form.addFirstClient": { en: "Add your first client", cs: "Přidejte svého prvního klienta", uk: "Додайте свого першого клієнта" },
  "form.lineItems": { en: "Line Items", cs: "Položky", uk: "Рядки послуг" },
  "form.addFromTemplate": { en: "Add from template", cs: "Přidat ze šablony", uk: "Додати з шаблону" },
  "form.description": { en: "Description", cs: "Popis", uk: "Опис" },
  "form.qty": { en: "Qty", cs: "Množství", uk: "Кількість" },
  "form.unit": { en: "Unit", cs: "Jednotka", uk: "Одиниця" },
  "form.price": { en: "Price", cs: "Cena", uk: "Ціна" },
  "form.total": { en: "Total", cs: "Celkem", uk: "Всього" },
  "form.addLine": { en: "Add Line", cs: "Přidat řádek", uk: "Додати рядок" },
  "form.notes": { en: "Notes", cs: "Poznámky", uk: "Примітки" },
  "form.notesPlaceholder": { en: "Payment terms, additional info...", cs: "Platební podmínky, další informace...", uk: "Умови оплати, додаткова інформація..." },
  "form.summary": { en: "Summary", cs: "Souhrn", uk: "Підсумок" },
  "form.subtotal": { en: "Subtotal", cs: "Mezisoučet", uk: "Проміжний підсумок" },
  "form.vatPercent": { en: "VAT %", cs: "DPH %", uk: "ПДВ %" },
  "form.saveDraft": { en: "Save as Draft", cs: "Uložit jako koncept", uk: "Зберегти як чернетку" },
  "form.saveSent": { en: "Save & Mark Sent", cs: "Uložit a označit jako odeslanou", uk: "Зберегти і надіслати" },
  "form.configureSupplier": { en: "Configure your supplier info first", cs: "Nejprve nastavte údaje dodavatele", uk: "Спочатку налаштуйте дані постачальника" },
  "form.goToSettings": { en: "Go to Settings", cs: "Přejít do nastavení", uk: "Перейти до налаштувань" },
  "form.reverseChargeApplies": { en: "Reverse Charge applies", cs: "Přenesená daňová povinnost", uk: "Зворотне нарахування ПДВ" },
  "form.serviceDescription": { en: "Service description", cs: "Popis služby", uk: "Опис послуги" },
  "form.vatVerified": { en: "VAT number verified via VIES", cs: "DIČ ověřeno přes VIES", uk: "ПДВ номер перевірено через VIES" },
  "form.vatNotVerified": { en: "Could not verify VAT number", cs: "Nelze ověřit DIČ", uk: "Не вдалося перевірити ПДВ номер" },
  "form.missingData": { en: "Missing data", cs: "Chybějící údaje", uk: "Відсутні дані" },
  "form.missingDataDesc": { en: "Select a client and configure your supplier settings first", cs: "Vyberte klienta a nastavte údaje dodavatele", uk: "Оберіть клієнта та налаштуйте дані постачальника" },

  // === VAT TEXTS ===
  // Summary line labels
  "vat.reverseChargeLine": { en: "VAT Reverse Charge", cs: "Přenesená daňová povinnost", uk: "Reverse Charge" },
  "vat.noVatLine": { en: "VAT: not applicable", cs: "DPH: neuplatňuje se", uk: "ПДВ: не застосовується" },
  // Badge on client card
  "vat.reverseChargeApplies": { en: "Reverse Charge applies", cs: "Přenesená daňová povinnost", uk: "Зворотне нарахування ПДВ" },

  // --- Regime A: Czech domestic client (identifikovaná osoba) ---
  "vat.identDomesticPdf": {
    en: "The supplier is an identifikovaná osoba k DPH in the Czech Republic (not a full VAT payer).\nThe invoiced supply is not subject to Czech VAT.",
    cs: "Dodavatel je identifikovanou osobou k DPH podle českého zákona o DPH, není plátcem DPH.\nFakturované plnění nepodléhá české DPH.",
    uk: "Постачальник є identifikovaná osoba k DPH у Чеській Республіці (не повний платник ПДВ).\nЦе постачання не підлягає чеському ПДВ.",
  },
  // --- Regime B: EU B2B Reverse Charge (identifikovaná osoba) ---
  "vat.identEuRcPdf": {
    en: "VAT Reverse Charge applies.\nPlace of supply: client's country, according to Article 44 of Council Directive 2006/112/EC.\nVAT is to be accounted for by the customer in the country of receipt of the service.\nThe supplier is an identifikovaná osoba k DPH in the Czech Republic (not a full VAT payer).",
    cs: "Uplatňuje se režim přenesené daňové povinnosti (Reverse Charge).\nMísto plnění: země příjemce služby, podle článku 44 směrnice Rady 2006/112/ES.\nDaň je povinen přiznat a odvést příjemce služby v zemi přijetí.\nDodavatel je identifikovanou osobou k DPH dle §6i zákona č. 235/2004 Sb.",
    uk: "Застосовується механізм Reverse Charge.\nМісце постачання: країна клієнта, відповідно до статті 44 Директиви Ради 2006/112/ЄС.\nПДВ сплачує отримувач послуги в країні отримання.\nПостачальник є identifikovaná osoba k DPH у Чехії (не повний платник ПДВ).",
  },
  // --- Regime C: Non-EU or EU B2C ---
  "vat.identOtherPdf": {
    en: "The supplier is an identifikovaná osoba k DPH in the Czech Republic (not a full VAT payer).\nNo VAT is charged according to applicable VAT rules.",
    cs: "Dodavatel je identifikovanou osobou k DPH dle §6i zákona č. 235/2004 Sb. (není plátcem DPH).\nDPH není účtována dle platných předpisů.",
    uk: "Постачальник є identifikovaná osoba k DPH у Чехії (не повний платник ПДВ).\nПДВ не нараховано відповідно до чинних правил.",
  },
  // --- Plátce DPH: EU B2B RC ---
  "vat.platceEuRcPdf": {
    en: "VAT is not charged on this invoice. The customer is liable for VAT in their country of residence pursuant to EU Council Directive 2006/112/EC.",
    cs: "DPH není na této faktuře účtována. Zákazník je povinen přiznat a odvést DPH ve své zemi podle směrnice Rady EU 2006/112/ES.",
    uk: "ПДВ не нараховано на цьому інвойсі. Клієнт зобов'язаний сплатити ПДВ у своїй країні відповідно до Директиви Ради ЄС 2006/112/ЄС.",
  },
  // --- Supplier line on PDF (identifikovaná osoba) ---
  "vat.identSupplierLine": {
    en: "Identifikovaná osoba k DPH (not a full VAT payer)",
    cs: "Identifikovaná osoba k DPH (není plátce DPH)",
    uk: "Identifikovaná osoba k DPH (не повний платник ПДВ)",
  },
  // --- Neplátce DPH: generic ---
  "vat.neplatcePdf": {
    en: "The supplier is not registered for VAT. No VAT is charged.",
    cs: "Dodavatel není plátcem DPH. DPH není účtována.",
    uk: "Постачальник не зареєстрований як платник ПДВ. ПДВ не нараховано.",
  },

  // === SETTINGS ===
  "settings.title": { en: "Settings", cs: "Nastavení", uk: "Налаштування" },
  "settings.subtitle": { en: "Your supplier (OSVČ) information for invoices", cs: "Vaše údaje dodavatele (OSVČ) pro faktury", uk: "Ваші дані постачальника (ОСВЧ) для інвойсів" },
  "settings.companyDetails": { en: "Company Details", cs: "Údaje o firmě", uk: "Дані компанії" },
  "settings.companyDesc": { en: "This information appears on every invoice", cs: "Tyto údaje se zobrazí na každé faktuře", uk: "Ця інформація з'являється на кожному інвойсі" },
  "settings.companyName": { en: "Company / Full Name", cs: "Firma / Celé jméno", uk: "Компанія / Повне ім'я" },
  "settings.ico": { en: "IČO", cs: "IČO", uk: "IČO" },
  "settings.country": { en: "Country", cs: "Země", uk: "Країна" },
  "settings.address": { en: "Address", cs: "Adresa", uk: "Адреса" },
  "settings.city": { en: "City", cs: "Město", uk: "Місто" },
  "settings.zip": { en: "ZIP", cs: "PSČ", uk: "Поштовий індекс" },
  "settings.vatStatus": { en: "VAT Status", cs: "Status DPH", uk: "Статус ПДВ" },
  "settings.vatStatusDesc": { en: "Your VAT registration type", cs: "Typ vaší registrace k DPH", uk: "Тип вашої реєстрації ПДВ" },
  "settings.neplatce": { en: "Non-VAT payer (neplátce DPH)", cs: "Neplátce DPH", uk: "Неплатник ПДВ" },
  "settings.neplatceDesc": { en: "No VAT obligations. For EU B2B, invoices show 'VAT exempt'.", cs: "Bez povinností DPH. Pro EU B2B se na faktuře uvede 'bez DPH'.", uk: "Без зобов'язань з ПДВ. Для ЄС B2B на інвойсі буде 'без ПДВ'." },
  "settings.identifikovana": { en: "Identified person (identifikovaná osoba)", cs: "Identifikovaná osoba", uk: "Ідентифікована особа" },
  "settings.identifikovanaDesc": { en: "Per §6i Czech VAT Act. Not a full VAT payer domestically. For EU B2B, reverse charge applies. Must file Souhrnné hlášení monthly by the 25th.", cs: "Dle §6i zákona o DPH. V tuzemsku neplátce. Pro EU B2B se uplatní přenesená daňová povinnost. Povinnost podávat souhrnné hlášení měsíčně do 25.", uk: "За §6i Закону про ПДВ ЧР. Не є повним платником ПДВ всередині країни. Для ЄС B2B — зворотне нарахування. Потрібно подавати Souhrnné hlášení щомісяця до 25-го." },
  "settings.platce": { en: "Full VAT payer (plátce DPH)", cs: "Plátce DPH", uk: "Платник ПДВ" },
  "settings.platceDesc": { en: "Standard 21% VAT on domestic invoices. Reverse charge for EU B2B. Can deduct input VAT.", cs: "Standardní 21% DPH na tuzemské faktury. Přenesená daňová povinnost pro EU B2B. Nárok na odpočet DPH.", uk: "Стандартний 21% ПДВ на внутрішні інвойси. Зворотне нарахування для ЄС B2B. Можна відраховувати вхідний ПДВ." },
  "settings.dic": { en: "DIČ / VAT Number", cs: "DIČ", uk: "DIČ / ПДВ номер" },
  "settings.bankDetails": { en: "Bank Details", cs: "Bankovní údaje", uk: "Банківські реквізити" },
  "settings.bankDesc": { en: "Payment information shown on invoices", cs: "Platební údaje zobrazené na fakturách", uk: "Платіжна інформація на інвойсах" },
  "settings.bankName": { en: "Bank Name", cs: "Název banky", uk: "Назва банку" },
  "settings.iban": { en: "IBAN", cs: "IBAN", uk: "IBAN" },
  "settings.swift": { en: "SWIFT / BIC", cs: "SWIFT / BIC", uk: "SWIFT / BIC" },
  "settings.contact": { en: "Contact", cs: "Kontakt", uk: "Контакт" },
  "settings.email": { en: "Email", cs: "Email", uk: "Електронна пошта" },
  "settings.phone": { en: "Phone", cs: "Telefon", uk: "Телефон" },
  "settings.saved": { en: "Settings saved", cs: "Nastavení uložena", uk: "Налаштування збережено" },
  "settings.saveSettings": { en: "Save Settings", cs: "Uložit nastavení", uk: "Зберегти налаштування" },
  "settings.saving": { en: "Saving...", cs: "Ukládám...", uk: "Збереження..." },
  "settings.error": { en: "Error saving settings", cs: "Chyba při ukládání nastavení", uk: "Помилка збереження налаштувань" },

  // === CLIENTS ===
  "clients.title": { en: "Clients", cs: "Klienti", uk: "Клієнти" },
  "clients.addClient": { en: "Add Client", cs: "Přidat klienta", uk: "Додати клієнта" },
  "clients.newClient": { en: "New Client", cs: "Nový klient", uk: "Новий клієнт" },
  "clients.editClient": { en: "Edit Client", cs: "Upravit klienta", uk: "Редагувати клієнта" },
  "clients.searchPlaceholder": { en: "Search clients...", cs: "Hledat klienty...", uk: "Пошук клієнтів..." },
  "clients.noClients": { en: "No clients yet", cs: "Zatím žádní klienti", uk: "Клієнтів поки немає" },
  "clients.noClientsDesc": { en: "Add your first client to start creating invoices", cs: "Přidejte svého prvního klienta", uk: "Додайте свого першого клієнта" },
  "clients.noMatch": { en: "No clients match your search", cs: "Žádní klienti neodpovídají vyhledávání", uk: "Жоден клієнт не відповідає пошуку" },
  "clients.companyName": { en: "Company Name", cs: "Název firmy", uk: "Назва компанії" },
  "clients.country": { en: "Country", cs: "Země", uk: "Країна" },
  "clients.vatNumber": { en: "VAT Number", cs: "DIČ", uk: "ПДВ номер" },
  "clients.address": { en: "Address", cs: "Adresa", uk: "Адреса" },
  "clients.city": { en: "City", cs: "Město", uk: "Місто" },
  "clients.zip": { en: "ZIP", cs: "PSČ", uk: "Індекс" },
  "clients.regNo": { en: "Registration No.", cs: "IČ", uk: "Реєстр. номер" },
  "clients.email": { en: "Email", cs: "Email", uk: "Пошта" },
  "clients.contactPerson": { en: "Contact Person", cs: "Kontaktní osoba", uk: "Контактна особа" },
  "clients.created": { en: "Client created", cs: "Klient vytvořen", uk: "Клієнта створено" },
  "clients.updated": { en: "Client updated", cs: "Klient upraven", uk: "Клієнта оновлено" },
  "clients.deleted": { en: "Client deleted", cs: "Klient smazán", uk: "Клієнта видалено" },
  "clients.deleteConfirm": { en: "Delete", cs: "Smazat", uk: "Видалити" },

  // === TEMPLATES ===
  "tpl.title": { en: "Service Templates", cs: "Šablony služeb", uk: "Шаблони послуг" },
  "tpl.subtitle": { en: "Preset services for quick invoice filling", cs: "Přednastavené služby pro rychlé vyplnění faktur", uk: "Пресети послуг для швидкого заповнення інвойсів" },
  "tpl.addService": { en: "Add Service", cs: "Přidat službu", uk: "Додати послугу" },
  "tpl.newTemplate": { en: "New Service Template", cs: "Nová šablona služby", uk: "Новий шаблон послуги" },
  "tpl.description": { en: "Description", cs: "Popis", uk: "Опис" },
  "tpl.unitPrice": { en: "Unit Price", cs: "Cena za jednotku", uk: "Ціна за одиницю" },
  "tpl.unit": { en: "Unit", cs: "Jednotka", uk: "Одиниця" },
  "tpl.currency": { en: "Currency", cs: "Měna", uk: "Валюта" },
  "tpl.noTemplates": { en: "No service templates", cs: "Žádné šablony služeb", uk: "Немає шаблонів послуг" },
  "tpl.noTemplatesDesc": { en: "Create presets for your commonly offered services", cs: "Vytvořte předvolby pro vaše nejčastější služby", uk: "Створіть пресети для ваших типових послуг" },
  "tpl.saved": { en: "Service template saved", cs: "Šablona služby uložena", uk: "Шаблон послуги збережено" },
  "tpl.deleted": { en: "Template deleted", cs: "Šablona smazána", uk: "Шаблон видалено" },

  // === PDF PREVIEW ===
  "pdf.preview": { en: "Preview", cs: "Náhled", uk: "Попередній перегляд" },
  "pdf.print": { en: "Print", cs: "Tisk", uk: "Друк" },
  "pdf.exportPdf": { en: "Export PDF", cs: "Export PDF", uk: "Експорт PDF" },
  "pdf.invoice": { en: "INVOICE", cs: "FAKTURA", uk: "ІНВОЙС" },
  "pdf.issueDate": { en: "Issue Date", cs: "Datum vystavení", uk: "Дата виставлення" },
  "pdf.deliveryDate": { en: "Delivery Date (DUZP)", cs: "Datum uskutečnění zdanitelného plnění (DUZP)", uk: "Дата постачання (DUZP)" },
  "pdf.dueDate": { en: "Due Date", cs: "Datum splatnosti", uk: "Дата оплати" },
  "pdf.from": { en: "FROM", cs: "DODAVATEL", uk: "ВІД" },
  "pdf.billTo": { en: "BILL TO", cs: "ODBĚRATEL", uk: "ЗАМОВНИК" },
  "pdf.description": { en: "DESCRIPTION", cs: "POPIS", uk: "ОПИС" },
  "pdf.qty": { en: "QTY", cs: "MNŽ", uk: "КІЛЬКІСТЬ" },
  "pdf.unit": { en: "UNIT", cs: "JEDN", uk: "ОД" },
  "pdf.unitPrice": { en: "UNIT PRICE", cs: "CENA/JED", uk: "ЦІНА/ОД" },
  "pdf.amount": { en: "AMOUNT", cs: "ČÁSTKA", uk: "СУМА" },
  "pdf.subtotal": { en: "Subtotal", cs: "Mezisoučet", uk: "Проміжний підсумок" },
  "pdf.total": { en: "Total", cs: "Celkem", uk: "Всього" },
  "pdf.reverseCharge": { en: "Reverse Charge", cs: "Přenesená daňová povinnost", uk: "Зворотне нарахування" },
  "pdf.paymentDetails": { en: "PAYMENT DETAILS", cs: "PLATEBNÍ ÚDAJE", uk: "ПЛАТІЖНІ РЕКВІЗИТИ" },
  "pdf.bank": { en: "Bank", cs: "Banka", uk: "Банк" },
  "pdf.notes": { en: "NOTES", cs: "POZNÁMKY", uk: "ПРИМІТКИ" },
  "pdf.notVatRegistered": { en: "Not VAT registered", cs: "Neplátce DPH", uk: "Не зареєстрований як платник ПДВ" },
  "pdf.vatExempt": { en: "VAT exempt", cs: "Bez DPH", uk: "Без ПДВ" },

  // === TOAST MESSAGES ===
  "toast.invoiceCreated": { en: "Invoice created", cs: "Faktura vytvořena", uk: "Інвойс створено" },
  "toast.invoiceUpdated": { en: "Invoice updated", cs: "Faktura upravena", uk: "Інвойс оновлено" },
  "toast.invoiceDeleted": { en: "Invoice deleted", cs: "Faktura smazána", uk: "Інвойс видалено" },
  "toast.statusUpdated": { en: "Status updated", cs: "Stav upraven", uk: "Статус оновлено" },
  "toast.error": { en: "Error", cs: "Chyba", uk: "Помилка" },
} as const;

type TranslationKey = keyof typeof translations;

const I18nContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const t = (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return (entry as any)[lang] || (entry as any).en || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
