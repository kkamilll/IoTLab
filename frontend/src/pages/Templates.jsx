import React, { useEffect, useState, useRef, useMemo } from "react";
import apiClient from "../api/apiClient";
import PageHeader from "../components/layout/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import Btn from "../components/layout/Btn";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/layout/ConfirmModal";
import {
  Mail,
  Edit2,
  Trash2,
  Plus,
  Filter,
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  Eye,
  Package,
  RefreshCw,
  KeyRound,
  Code,
  Copy,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  Layers,
  FileText
} from "lucide-react";

// Required variables mapping from backend Template.js
const PLACEHOLDER_MAP = {
  newOrder: ["orderId", "CustomerName", "orderLink", "orderPassword"],
  updateOrder: ["orderId", "CustomerName"],
  resetPassword: ["VerificationCode"],
  returnReminder: ["orderId", "CustomerName"],
  overdueAlert: ["orderId", "CustomerName"],
};

// Optional variables that can also be used
const OPTIONAL_PLACEHOLDER_MAP = {
  newOrder: ["startDate", "endDate"],
  updateOrder: ["startDate", "endDate"],
  resetPassword: [],
  returnReminder: ["dueDate", "orderLink"],
  overdueAlert: ["dueDate", "orderLink"],
};

// Sample dummy data for live preview
const DUMMY_DATA = {
  orderId: "ORD-2026-98421",
  CustomerName: "Jan Kowalski",
  orderLink: "http://localhost:5173/order/f47ac10b-58cc-4372-a567-0e02b2c3d479",
  orderPassword: "LAB-PASS-8491",
  startDate: "28.10.2026",
  endDate: "04.11.2026",
  dueDate: "29.10.2026",
  VerificationCode: "849 201",
};

// Starter HTML boilerplates for new templates
const STARTER_BOILERPLATES = {
  newOrder: {
    subject: "✅ Twoje zamówienie zostało złożone – IoTLab #${orderId}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #4f46e5; font-size: 24px; margin: 0;">🔬 IoTLab</h1>
    <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Laboratorium Sprzętu Elektronicznego</p>
  </div>
  <h2 style="color: #1e293b; font-size: 18px;">Cześć \${CustomerName}!</h2>
  <p style="color: #475569; line-height: 1.6;">Twoje zamówienie zostało pomyślnie złożone i oczekuje na weryfikację przez opiekuna laboratorium.</p>
  
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Numer zamówienia</p>
    <p style="margin: 0; color: #1e293b; font-family: monospace; font-size: 15px; font-weight: bold;">\${orderId}</p>
  </div>

  <p style="color: #475569; line-height: 1.6;">Możesz śledzić status swojego zamówienia klikając w poniższy link. Będziesz potrzebować hasła dostępu:</p>
  
  <div style="text-align: center; margin: 24px 0;">
    <a href="\${orderLink}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">📋 Śledź zamówienie</a>
  </div>

  <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
    <p style="margin: 0 0 4px; color: #92400e; font-size: 12px; font-weight: bold;">🔑 Hasło dostępu do zamówienia:</p>
    <p style="margin: 0; color: #1e293b; font-family: monospace; font-size: 16px; font-weight: bold;">\${orderPassword}</p>
    <p style="margin: 4px 0 0; color: #92400e; font-size: 11px;">Zachowaj to hasło – będzie potrzebne do zalogowania do podglądu zamówienia.</p>
  </div>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="color: #94a3b8; font-size: 11px; text-align: center;">IoTLab · Politechnika · Ta wiadomość została wygenerowana automatycznie.</p>
</div>`
  },
  updateOrder: {
    subject: "🔄 Status Twojego zamówienia został zaktualizowany – IoTLab #${orderId}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #4f46e5; font-size: 24px; margin: 0;">🔬 IoTLab</h1>
    <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Laboratorium Sprzętu Elektronicznego</p>
  </div>
  <h2 style="color: #1e293b; font-size: 18px;">Cześć \${CustomerName}!</h2>
  <p style="color: #475569; line-height: 1.6;">Informujemy, że status Twojego zamówienia uległ zmianie.</p>
  
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Numer zamówienia</p>
    <p style="margin: 0; color: #1e293b; font-family: monospace; font-size: 15px; font-weight: bold;">\${orderId}</p>
  </div>

  <p style="color: #475569; line-height: 1.6;">W razie pytań skontaktuj się z opiekunem laboratorium lub sprawdź aktualny stan w systemie.</p>
  
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="color: #94a3b8; font-size: 11px; text-align: center;">IoTLab · Politechnika · Wiadomość automatyczna.</p>
</div>`
  },
  resetPassword: {
    subject: "🔐 Kod weryfikacyjny do resetowania hasła – IoTLab",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #4f46e5; font-size: 24px; margin: 0;">🔬 IoTLab</h1>
    <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Laboratorium Sprzętu Elektronicznego</p>
  </div>
  <h2 style="color: #1e293b; font-size: 18px;">Reset hasła</h2>
  <p style="color: #475569; line-height: 1.6;">Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta. Użyj poniższego kodu weryfikacyjnego:</p>
  
  <div style="text-align: center; margin: 28px 0;">
    <div style="display: inline-block; background: #4f46e5; color: #ffffff; font-size: 32px; font-weight: bold; font-family: monospace; padding: 16px 32px; border-radius: 12px; letter-spacing: 8px;">
      \${VerificationCode}
    </div>
  </div>

  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
    <p style="margin: 0; color: #991b1b; font-size: 13px;">⏱️ Ten kod jest ważny przez <strong>15 minut</strong>. Nie udostępniaj go nikomu.</p>
  </div>

  <p style="color: #475569; line-height: 1.6;">Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość – Twoje konto pozostaje bezpieczne.</p>
  
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="color: #94a3b8; font-size: 11px; text-align: center;">IoTLab · Wiadomość automatyczna.</p>
</div>`
  },
  returnReminder: {
    subject: "⏳ Zbliża się termin zwrotu sprzętu – IoTLab #${orderId}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #d97706; font-size: 24px; margin: 0;">⏳ IoTLab</h1>
    <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Laboratorium Sprzętu Elektronicznego</p>
  </div>
  <h2 style="color: #1e293b; font-size: 18px;">Cześć \${CustomerName}!</h2>
  <p style="color: #475569; line-height: 1.6;">Przypominamy, że zbliża się termin zwrotu sprzętu wypożyczonego w ramach zamówienia <strong>#\${orderId}</strong>.</p>
  
  <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 6px; color: #92400e; font-size: 12px; font-weight: bold; text-transform: uppercase;">Planowany termin zwrotu:</p>
    <p style="margin: 0; color: #1e293b; font-size: 16px; font-weight: bold;">\${dueDate}</p>
  </div>

  <p style="color: #475569; line-height: 1.6;">Prosimy o punktualne dostarczenie sprzętu w nienaruszonym stanie do laboratorium.</p>
  
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="color: #94a3b8; font-size: 11px; text-align: center;">IoTLab · Wiadomość automatyczna.</p>
</div>`
  },
  overdueAlert: {
    subject: "🚨 PILNE: Przekroczony termin zwrotu sprzętu – IoTLab #${orderId}",
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #dc2626; font-size: 24px; margin: 0;">🚨 IoTLab</h1>
    <p style="color: #64748b; font-size: 12px; margin: 4px 0 0;">Laboratorium Sprzętu Elektronicznego</p>
  </div>
  <h2 style="color: #991b1b; font-size: 18px;">Uwaga, \${CustomerName}!</h2>
  <p style="color: #475569; line-height: 1.6;">Informujemy, że <strong>przekroczyłeś ustalony termin zwrotu sprzętu</strong> dla zamówienia <strong>#\${orderId}</strong>.</p>
  
  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 6px; color: #991b1b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Data upływu terminu:</p>
    <p style="margin: 0; color: #991b1b; font-size: 16px; font-weight: bold;">\${dueDate}</p>
  </div>

  <p style="color: #475569; line-height: 1.6;">Prosimy o <strong>niezwłoczny zwrot sprzętu</strong> do laboratorium. W przypadku braku możliwości zwrotu, natychmiast skontaktuj się z opiekunem laboratorium.</p>
  
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
  <p style="color: #94a3b8; font-size: 11px; text-align: center;">IoTLab · Wiadomość wygenerowana przez system.</p>
</div>`
  }
};

function renderSimulatedEmail(subject, body) {
  let renderedSubject = subject || "";
  let renderedBody = body || "";

  Object.entries(DUMMY_DATA).forEach(([key, val]) => {
    const regex = new RegExp(`\\$\\{${key}\\}`, "g");
    renderedSubject = renderedSubject.replace(regex, val);
    renderedBody = renderedBody.replace(regex, val);
  });

  return {
    subject: renderedSubject,
    body: renderedBody,
  };
}

function TemplatesApp() {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });

  const [templatesNames, setTemplatesNames] = useState([
    "newOrder",
    "updateOrder",
    "resetPassword",
    "returnReminder",
    "overdueAlert",
  ]);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    body: "",
    isDefault: false,
  });

  const [filters, setFilters] = useState({
    name: "",
    subject: "",
    isDefault: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [composerPreviewMode, setComposerPreviewMode] = useState(false); // live preview inside composer

  // Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewTab, setPreviewTab] = useState("visual"); // "visual" | "html" | "vars"

  const textareaRef = useRef();
  const composerFormRef = useRef();

  // Fetch template names
  const fetchTemplateNames = async () => {
    try {
      const { data } = await apiClient.get("/templates/names");
      if (data.success && Array.isArray(data.data)) {
        setTemplatesNames(data.data);
      }
    } catch {
      // Fallback already pre-set
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/templates", {
        params: { ...filters },
      });
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch one template for edit
  const fetchTemplateById = async (id) => {
    try {
      const { data } = await apiClient.get(`/templates/${id}`);
      if (data.success) {
        setSelected(data.data);
        setForm(data.data);
        setShowForm(true);
        setTimeout(() => {
          composerFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err.message, "error");
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (tmpl) => {
    setPreviewTemplate(tmpl);
    setPreviewTab("visual");
    setPreviewModalOpen(true);
  };

  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholder) => {
    const textToInsert = `\${${placeholder}}`;
    const field = activeField || "body";

    const el = field === "subject" 
      ? document.getElementById("template-subject") 
      : textareaRef.current;
      
    if (el) {
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const text = form[field] || "";
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      
      setForm((prev) => ({
        ...prev,
        [field]: before + textToInsert + after,
      }));

      setTimeout(() => {
        el.focus();
        const cursorPosition = start + textToInsert.length;
        el.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    } else {
      setForm((prev) => ({
        ...prev,
        [field]: (prev[field] || "") + textToInsert,
      }));
    }
  };

  // Load starter boilerplate into form
  const handleLoadBoilerplate = () => {
    if (!form.name || !STARTER_BOILERPLATES[form.name]) return;
    const starter = STARTER_BOILERPLATES[form.name];
    setForm((prev) => ({
      ...prev,
      subject: starter.subject,
      body: starter.body,
    }));
    showToast(
      language === "pl" ? "Wczytano przykładowy szablon." : "Loaded starter boilerplate.",
      "info"
    );
  };

  // Check required placeholders status
  const requiredList = form.name ? PLACEHOLDER_MAP[form.name] || [] : [];
  const missingPlaceholders = useMemo(() => {
    if (!form.name || !requiredList.length) return [];
    const combined = `${form.subject} ${form.body}`;
    return requiredList.filter((v) => !combined.includes(`\${${v}}`));
  }, [form.name, form.subject, form.body, requiredList]);

  // Create or update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name) {
      showToast(t("templates.selectTemplateType"), "error");
      return;
    }

    if (missingPlaceholders.length > 0) {
      showToast(
        `${t("templates.missingRequired")}: ${missingPlaceholders.join(", ")}`,
        "error"
      );
      return;
    }

    setSubmitLoading(true);
    try {
      if (selected) {
        const { data } = await apiClient.put(
          `/templates/update/${selected._id}`,
          form
        );
        if (data.success) {
          await fetchTemplates();
          resetForm();
          showToast(t("templates.saveSuccess"), "success");
        }
      } else {
        const { data } = await apiClient.post("/templates/create", form);
        if (data.success) {
          await fetchTemplates();
          resetForm();
          showToast(t("templates.saveSuccess"), "success");
        }
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err.message, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete template
  const handleDelete = (tmpl) => {
    if (tmpl.isDefault) {
      showToast(t("templates.cannotDeleteDefault"), "error");
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: t("templates.deleteConfirmTitle"),
      message: t("templates.deleteConfirm"),
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setDeleteLoadingId(tmpl._id);
        try {
          const { data } = await apiClient.delete(`/templates/delete/${tmpl._id}`);
          if (data.success) {
            await fetchTemplates();
            if (selected?._id === tmpl._id) resetForm();
            showToast(t("templates.deleteSuccess"), "success");
          }
        } catch (err) {
          showToast(err?.response?.data?.message || err.message, "error");
        } finally {
          setDeleteLoadingId(null);
        }
      },
    });
  };

  // Reset form
  const resetForm = () => {
    setSelected(null);
    setForm({ name: "", subject: "", body: "", isDefault: false });
    setShowForm(false);
    setComposerPreviewMode(false);
  };

  // Copy HTML to clipboard
  const handleCopy = (text) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(language === "pl" ? "Skopiowano do schowka!" : "Copied to clipboard!", "success");
    }
  };

  useEffect(() => {
    fetchTemplateNames();
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [filters]);


  const hasActiveFilters = Boolean(filters.name || filters.subject || filters.isDefault);

  const getTypeBadge = (name) => {
    switch (name) {
      case "newOrder":
        return {
          icon: Package,
          label: t("templates.types.newOrder") || "Nowe zamówienie",
          bg: "bg-emerald-50 dark:bg-emerald-950/40",
          border: "border-emerald-200 dark:border-emerald-800/60",
          text: "text-emerald-700 dark:text-emerald-300",
          iconColor: "text-emerald-600 dark:text-emerald-400",
        };
      case "updateOrder":
        return {
          icon: RefreshCw,
          label: t("templates.types.updateOrder") || "Aktualizacja zamówienia",
          bg: "bg-indigo-50 dark:bg-indigo-950/40",
          border: "border-indigo-200 dark:border-indigo-800/60",
          text: "text-indigo-700 dark:text-indigo-300",
          iconColor: "text-indigo-600 dark:text-indigo-400",
        };
      case "resetPassword":
        return {
          icon: KeyRound,
          label: t("templates.types.resetPassword") || "Reset hasła",
          bg: "bg-sky-50 dark:bg-sky-950/40",
          border: "border-sky-200 dark:border-sky-800/60",
          text: "text-sky-700 dark:text-sky-300",
          iconColor: "text-sky-600 dark:text-sky-400",
        };
      case "returnReminder":
        return {
          icon: AlertTriangle,
          label: t("templates.types.returnReminder") || "Przypomnienie o zwrocie",
          bg: "bg-amber-50 dark:bg-amber-950/40",
          border: "border-amber-200 dark:border-amber-800/60",
          text: "text-amber-700 dark:text-amber-300",
          iconColor: "text-amber-600 dark:text-amber-400",
        };
      case "overdueAlert":
        return {
          icon: AlertCircle,
          label: t("templates.types.overdueAlert") || "Przekroczenie terminu zwrotu",
          bg: "bg-rose-50 dark:bg-rose-950/40",
          border: "border-rose-200 dark:border-rose-800/60",
          text: "text-rose-700 dark:text-rose-300",
          iconColor: "text-rose-600 dark:text-rose-400",
        };
      default:
        return {
          icon: Mail,
          label: name,
          bg: "bg-slate-50 dark:bg-slate-800",
          border: "border-slate-200 dark:border-slate-700",
          text: "text-slate-700 dark:text-slate-300",
          iconColor: "text-slate-500 dark:text-slate-400",
        };
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/40 dark:bg-slate-950/40 transition-colors">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        
        {/* Page Header */}
        <PageHeader
          title={"📧 " + (t("templates.title") || "Szablony wiadomości e-mail")}
          subtitle={t("templates.subtitle") || "Zarządzaj szablonami powiadomień e-mail, podglądaj wygenerowany kod HTML i konfiguruj dynamiczne symbole zastępcze"}
        />


        {/* Filters and Search Bar Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Template Type selector */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                {t("templates.filterType")}
              </span>
              <select
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-300 dark:hover:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">{t("templates.allTypes")}</option>
                {templatesNames.map((name) => (
                  <option key={name} value={name}>
                    {t(`templates.types.${name}`) || name} ({name})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject search */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                {t("templates.subject")}
              </span>
              <input
                type="text"
                placeholder={t("templates.searchPlaceholder")}
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100 outline-none hover:border-slate-300 dark:hover:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Default Status Filter */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                {t("templates.filterDefault")}
              </span>
              <select
                value={filters.isDefault}
                onChange={(e) => setFilters({ ...filters, isDefault: e.target.value })}
                className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-300 dark:hover:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">{t("templates.allStatuses")}</option>
                <option value="true">{t("templates.defaultOnly")}</option>
                <option value="false">{t("templates.nonDefaultOnly")}</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 md:pt-4 self-end md:self-auto">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilters({ name: "", subject: "", isDefault: "" })}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title={t("templates.clearFilters")}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t("templates.clearFilters")}</span>
              </button>
            )}

            <Btn
              variant="primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
                setTimeout(() => {
                  composerFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 100);
              }}
              className="py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              {t("templates.addTemplate")}
            </Btn>
          </div>
        </div>

        {/* Template Composer Form (Drawer / Card) */}
        {showForm && (
          <div ref={composerFormRef} className="animate-fadeIn">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-lg flex flex-col gap-6"
            >
              {/* Composer Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50">
                    <Code className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                      {selected ? t("templates.editTemplate") : t("templates.createNewTemplate")}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {selected
                        ? `${t("templates.editTemplate")} #${selected._id}`
                        : t("templates.subtitle")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Load Boilerplate button (only when type is chosen) */}
                  {form.name && STARTER_BOILERPLATES[form.name] && (
                    <button
                      type="button"
                      onClick={handleLoadBoilerplate}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === "pl" ? "Wczytaj szablon wzorcowy" : "Load boilerplate"}</span>
                    </button>
                  )}

                  {/* Live preview toggle in composer */}
                  <button
                    type="button"
                    onClick={() => setComposerPreviewMode(!composerPreviewMode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                      composerPreviewMode
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t("templates.livePreviewToggle")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Type Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                    {t("templates.templateType")} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.name}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setForm({ ...form, name: newType });
                    }}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-100 outline-none hover:border-slate-300 dark:hover:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                    required
                  >
                    <option value="" disabled>
                      {t("templates.selectTemplateType")}
                    </option>
                    {templatesNames.map((name) => (
                      <option key={name} value={name}>
                        {t(`templates.types.${name}`) || name} ({name})
                      </option>
                    ))}
                  </select>
                  {form.name && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                      {t(`templates.typeDescriptions.${form.name}`) || ""}
                    </p>
                  )}
                </div>

                {/* Subject Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                    {t("templates.subject")} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="template-subject"
                    type="text"
                    placeholder={t("templates.subjectPlaceholder")}
                    value={form.subject}
                    onFocus={() => setActiveField("subject")}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-100 outline-none hover:border-slate-300 dark:hover:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Placeholders Toolbar & Validation */}
              {form.name ? (
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      {t("templates.placeholdersTitle")}
                      <span className="text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                        ({t("templates.placeholdersSubtitle")})
                      </span>
                    </span>

                    {/* Real-time variable validation status */}
                    {missingPlaceholders.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {t("templates.allRequiredPresent")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/60">
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        {t("templates.missingRequired")}: {missingPlaceholders.join(", ")}
                      </span>
                    )}
                  </div>

                  {/* Required Placeholders */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pr-1">
                      {t("templates.requiredPlaceholders")}:
                    </span>
                    {(PLACEHOLDER_MAP[form.name] || []).map((p) => {
                      const isUsed = `${form.subject} ${form.body}`.includes(`\${${p}}`);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => insertPlaceholder(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                            isUsed
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100"
                              : "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          }`}
                          title={isUsed ? "Użyto w szablonie (kliknij, aby wstawić ponownie)" : "Wymagana zmienna – kliknij, aby wstawić"}
                        >
                          {isUsed ? (
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Plus className="w-3 h-3 text-rose-500" />
                          )}
                          <span>{`\${${p}}`}</span>
                        </button>
                      );
                    })}

                    {/* Optional Placeholders */}
                    {(OPTIONAL_PLACEHOLDER_MAP[form.name] || []).map((p) => {
                      const isUsed = `${form.subject} ${form.body}`.includes(`\${${p}}`);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => insertPlaceholder(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                            isUsed
                              ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100"
                              : "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          }`}
                          title={isUsed ? (language === "pl" ? "Użyto w szablonie (kliknij, aby wstawić ponownie)" : "Used in template (click to re-insert)") : (language === "pl" ? "Zmienna opcjonalna – kliknij, aby wstawić" : "Optional placeholder – click to insert")}
                        >
                          {isUsed ? (
                            <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Plus className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{`\${${p}}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>{t("templates.selectTemplateType")}</span>
                </div>
              )}

              {/* Body Editor and Split Live Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* HTML Body Editor Column */}
                <div className={`flex flex-col gap-1.5 ${composerPreviewMode ? "" : "lg:col-span-2"}`}>
                  <div className="flex items-center justify-between pl-1">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t("templates.body")} <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {form.body.length} {language === "pl" ? "znaków" : "chars"}
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    placeholder={t("templates.bodyPlaceholder")}
                    value={form.body}
                    onFocus={() => setActiveField("body")}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    rows={composerPreviewMode ? 14 : 10}
                    className="w-full font-mono text-xs leading-relaxed bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-800 dark:text-slate-100 outline-none hover:border-slate-300 dark:hover:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y shadow-inner"
                    required
                  />
                </div>

                {/* Live Preview Column (if active) */}
                {composerPreviewMode && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        {t("templates.livePreviewToggle")}
                      </label>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {language === "pl" ? "Aktualizowane na żywo" : "Live update"}
                      </span>
                    </div>

                    <div className="w-full h-full min-h-[300px] border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-100 dark:bg-slate-950/80 p-4 overflow-y-auto">
                      {/* Rendered simulated email card */}
                      <div className="max-w-[560px] mx-auto bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden text-slate-800">
                        {/* Simulated header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-center text-white">
                          <h4 className="text-base font-bold m-0 break-words">
                            {renderSimulatedEmail(form.subject, form.body).subject || "Podgląd tematu"}
                          </h4>
                        </div>
                        {/* Simulated body */}
                        <div
                          className="p-5 text-xs text-slate-700 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: renderSimulatedEmail(form.subject, form.body).body || "<em>Wpisz treść wiadomości...</em>",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Default Template Checkbox */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-100 block cursor-pointer">
                    {t("templates.isDefault")}
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t("templates.isDefaultHelp")}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 transition-colors"></div>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Btn
                  type="button"
                  variant="ghost"
                  onClick={resetForm}
                  className="px-5 py-2.5 text-xs font-semibold"
                >
                  {t("common.cancel")}
                </Btn>

                <Btn
                  type="submit"
                  variant="primary"
                  disabled={submitLoading || missingPlaceholders.length > 0}
                  className="px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  {submitLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{selected ? t("templates.saving") : t("templates.creating")}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{selected ? t("templates.saveTemplate") : t("templates.createNewTemplate")}</span>
                    </>
                  )}
                </Btn>
              </div>
            </form>
          </div>
        )}

        {/* Templates Table View (Desktop) */}
        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[20%]" />
                <col className="w-[46%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-3 text-center">#</th>
                  <th className="py-4 px-4">{t("templates.templateType")}</th>
                  <th className="py-4 px-4">{t("templates.subject")}</th>
                  <th className="py-4 px-4 text-center">{t("templates.filterDefault")}</th>
                  <th className="py-4 px-4 text-center">{t("templates.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {templates.map((tmpl, idx) => {
                  const typeBadge = getTypeBadge(tmpl.name);
                  const TypeIcon = typeBadge.icon;

                  return (
                    <tr
                      key={tmpl._id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition duration-150 group"
                    >
                      {/* Index */}
                      <td className="py-4 px-3 text-center font-mono font-semibold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeBadge.bg} ${typeBadge.border}`}>
                            <TypeIcon className={`w-4 h-4 ${typeBadge.iconColor}`} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-800 dark:text-slate-100 block truncate">
                              {typeBadge.label}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                              {tmpl.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                            {tmpl.subject}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                            {tmpl.body.replace(/<[^>]*>?/gm, "").substring(0, 90)}...
                          </span>
                        </div>
                      </td>

                      {/* Default Status */}
                      <td className="py-4 px-4 text-center">
                        {tmpl.isDefault ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-bold shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t("templates.defaultBadge")}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
                            {t("templates.nonDefaultBadge")}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Preview Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(tmpl)}
                            className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 transition cursor-pointer"
                            title={t("templates.preview")}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => fetchTemplateById(tmpl._id)}
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title={t("common.edit")}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(tmpl)}
                            disabled={tmpl.isDefault || deleteLoadingId === tmpl._id}
                            className={`p-2 rounded-xl border transition cursor-pointer ${
                              tmpl.isDefault
                                ? "text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed"
                                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-100 dark:border-rose-900/40"
                            }`}
                            title={
                              tmpl.isDefault
                                ? t("templates.cannotDeleteDefault")
                                : t("common.delete")
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty State */}
                {templates.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-slate-400 dark:text-slate-600">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Mail className="w-8 h-8 opacity-40" />
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">
                          {t("templates.noTemplates")}
                        </span>
                        <span className="text-xs text-slate-400 max-w-sm">
                          {t("templates.noTemplatesHelp")}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden flex flex-col gap-3">
          {templates.map((tmpl, idx) => {
            const typeBadge = getTypeBadge(tmpl.name);
            const TypeIcon = typeBadge.icon;

            return (
              <div
                key={tmpl._id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${typeBadge.bg} ${typeBadge.border}`}>
                      <TypeIcon className={`w-4 h-4 ${typeBadge.iconColor}`} />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 block">
                        {typeBadge.label}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {tmpl.name}
                      </span>
                    </div>
                  </div>

                  {tmpl.isDefault ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {t("templates.defaultBadge")}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">
                      #{idx + 1}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("templates.subject")}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 break-words">
                    {tmpl.subject}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(tmpl)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t("templates.preview")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchTemplateById(tmpl._id)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{t("common.edit")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(tmpl)}
                    disabled={tmpl.isDefault || deleteLoadingId === tmpl._id}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center ${
                      tmpl.isDefault
                        ? "text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800 cursor-not-allowed"
                        : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Live Email Preview Modal */}
      {previewModalOpen && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100">
                      {t("templates.previewModalTitle")}
                    </h3>
                    {previewTemplate.isDefault && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {t("templates.defaultBadge")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {t("templates.previewModalSubtitle")}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="px-6 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab("visual")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    previewTab === "visual"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-800"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t("templates.visualPreview")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTab("html")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    previewTab === "html"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-800"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{t("templates.rawHtml")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTab("vars")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    previewTab === "vars"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-800"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{t("templates.variablesTab")}</span>
                </button>
              </div>

              {previewTab === "html" && (
                <button
                  type="button"
                  onClick={() => handleCopy(previewTemplate.body)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{language === "pl" ? "Kopiuj HTML" : "Copy HTML"}</span>
                </button>
              )}
            </div>

            {/* Modal Body Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-100/70 dark:bg-slate-950/70">
              
              {/* Tab 1: Visual Email Preview */}
              {previewTab === "visual" && (
                <div className="max-w-2xl mx-auto flex flex-col gap-4">
                  {/* Simulated Mail Client Header */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="font-bold text-slate-400 uppercase text-[10px] w-16">
                        {language === "pl" ? "Od:" : "From:"}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        IoTLab &lt;iotlab@put.poznan.pl&gt;
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="font-bold text-slate-400 uppercase text-[10px] w-16">
                        {language === "pl" ? "Do:" : "To:"}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Jan Kowalski &lt;jan.kowalski@student.put.poznan.pl&gt;
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-400 uppercase text-[10px] w-16">
                        {language === "pl" ? "Temat:" : "Subject:"}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {renderSimulatedEmail(previewTemplate.subject, previewTemplate.body).subject}
                      </span>
                    </div>
                  </div>

                  {/* Rendered Email Frame */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden text-slate-800">
                    {/* IoTLab Standard Email Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 p-6 sm:p-8 text-center text-white">
                      <h1 className="text-xl sm:text-2xl font-extrabold m-0 tracking-wide text-white">
                        {renderSimulatedEmail(previewTemplate.subject, previewTemplate.body).subject}
                      </h1>
                    </div>

                    {/* Email Content Container */}
                    <div
                      className="p-6 sm:p-8 text-sm text-slate-700 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{
                        __html: renderSimulatedEmail(previewTemplate.subject, previewTemplate.body).body,
                      }}
                    />

                    {/* IoTLab Standard Email Footer */}
                    <div className="bg-slate-50 border-t border-slate-100 p-6 text-center text-xs text-slate-400 flex flex-col gap-1">
                      <p className="m-0 font-semibold text-slate-500">
                        System Wypożyczalni Sprzętu Laboratoryjnego · IoTLab
                      </p>
                      <p className="m-0 text-[11px]">
                        © {new Date().getFullYear()} Wszelkie prawa zastrzeżone. Ta wiadomość została wygenerowana automatycznie.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Raw HTML */}
              {previewTab === "html" && (
                <div className="max-w-3xl mx-auto flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === "pl" ? "Treść szablonu (HTML):" : "Template Body (HTML):"}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {previewTemplate.body.length} {language === "pl" ? "bajtów" : "bytes"}
                    </span>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 select-all max-h-[500px]">
                    <code>{previewTemplate.body}</code>
                  </pre>
                </div>
              )}

              {/* Tab 3: Variables Breakdown */}
              {previewTab === "vars" && (
                <div className="max-w-2xl mx-auto flex flex-col gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-1">
                      {language === "pl" ? "Podstawione wartości testowe" : "Substituted Sample Values"}
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">
                      {language === "pl"
                        ? "Wartości wykorzystywane do generowania podglądu wiadomości e-mail w czasie rzeczywistym."
                        : "Values utilized to generate real-time email preview simulation."}
                    </p>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-b border-slate-100 dark:border-slate-800 text-xs">
                      {Object.entries(DUMMY_DATA).map(([key, val]) => {
                        const isUsedInSubject = previewTemplate.subject.includes(`\${${key}}`);
                        const isUsedInBody = previewTemplate.body.includes(`\${${key}}`);
                        const isUsed = isUsedInSubject || isUsedInBody;

                        return (
                          <div key={key} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md text-[11px] border border-indigo-100 dark:border-indigo-900/30">
                                {`\${${key}}`}
                              </span>
                              {isUsed ? (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> {language === "pl" ? "Użyte" : "Used"}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  {language === "pl" ? "Nieużyte" : "Not used"}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[280px]">
                              {val}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>{language === "pl" ? "Wszystkie zmienne są bezpiecznie filtrowane przez serwer." : "Variables safely parsed by mailer."}</span>
              </div>
              <Btn
                variant="primary"
                onClick={() => setPreviewModalOpen(false)}
                className="px-5 py-2 text-xs font-bold"
              >
                {t("templates.close")}
              </Btn>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default TemplatesApp;
