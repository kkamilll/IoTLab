import React, { useEffect, useState, useRef } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/layout/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import Btn from "../components/layout/Btn";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/layout/ConfirmModal";
import { Mail, Edit2, Trash2, CheckCircle2, HelpCircle, Plus, Filter, RotateCcw, FileCode, Check, AlertCircle, Sparkles } from "lucide-react";

const PLACEHOLDER_MAP = {
  newOrder: ["orderId", "CustomerName", "orderLink", "orderPassword"],
  updateOrder: ["orderId", "CustomerName"],
  resetPassword: ["VerificationCode"],
};

function TemplatesApp() {
  const { token } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });
  const [templatesNames, setTemplatesNames] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currName, setCurrName] = useState("");
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
  const textareaRef = useRef();

  const currentPlaceholders = currName ? PLACEHOLDER_MAP[currName] || [] : [];

  // Fetch template names
  const fetchTemplateNames = async () => {
    try {
      const { data } = await apiClient.get("/templates/names");
      if (data.success) setTemplatesNames(data.data);
    } catch (err) {
      showToast(err?.response?.data?.message || err.message, "error");
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/templates", {
        params: { ...filters },
      });
      if (data.success) setTemplates(data.data);
    } catch (err) {
      showToast(err?.response?.data?.message || err.message, "error");
    }
    setLoading(false);
  };

  // Fetch one template for edit
  const fetchTemplateById = async (id) => {
    try {
      const { data } = await apiClient.get(`/templates/${id}`);

      if (data.success) {
        setSelected(data.data);
        setCurrName(data.data?.name);
        setForm(data.data);
        setShowForm(true);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err.message, "error");
    }
  };

  // Create or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (selected) {
        const { data } = await apiClient.put(
          `/templates/update/${selected._id}`,
          form,
        );
        if (data.success) {
          fetchTemplates();
          resetForm();
          showToast(language === "pl" ? "Szablon został zaktualizowany." : "Template updated successfully.", "success");
        }
      } else {
        const { data } = await apiClient.post("/templates/create", form);
        if (data.success) {
          fetchTemplates();
          resetForm();
          showToast(language === "pl" ? "Szablon został utworzony." : "Template created successfully.", "success");
        }
      }
    } catch (err) {
      showToast(err?.response?.data?.message || err.message, "error");
    }
    setSubmitLoading(false);
  };

  // Delete template
  const handleDelete = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń",
      message: t("templates.deleteConfirm") || "Czy na pewno chcesz usunąć ten szablon?",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        setDeleteLoadingId(id);
        try {
          const { data } = await apiClient.delete(`/templates/delete/${id}`);
          if (data.success) {
            fetchTemplates();
            if (selected?._id === id) resetForm();
            showToast(language === "pl" ? "Szablon został usunięty." : "Template deleted successfully.", "success");
          }
        } catch (err) {
          showToast(err?.response?.data?.message || err.message, "error");
        }
        setDeleteLoadingId(null);
      }
    });
  };

  // Reset form
  const resetForm = () => {
    setSelected(null);
    setCurrName("");
    setForm({ name: "", subject: "", body: "", isDefault: false });
    setShowForm(false);
  };

  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholder) => {
    const textToInsert = `\${${placeholder}}`;
    if (!activeField) return;

    const el = activeField === "subject" 
      ? document.getElementById("template-subject") 
      : textareaRef.current;
      
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const text = form[activeField] || "";
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      
      setForm((prev) => ({
        ...prev,
        [activeField]: before + textToInsert + after,
      }));

      // Focus back and place cursor after inserted text
      setTimeout(() => {
        el.focus();
        const cursorPosition = start + textToInsert.length;
        el.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    } else {
      setForm((prev) => ({
        ...prev,
        [activeField]: (prev[activeField] || "") + textToInsert,
      }));
    }
  };

  useEffect(() => {
    fetchTemplateNames();
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [filters]);

  if (loading)
    return (
      <div className="w-full h-full flex items-center justify-center p-20 text-slate-400 font-semibold">
        {t("templates.loading")}
      </div>
    );

  return (
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <PageHeader
          title={"📧 " + t("nav.templates")}
          subtitle={t("templates.subtitle")}
        />

        {/* Filters and Quick Actions Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Filters Card */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Filter className="w-3.5 h-3.5" />
              {language === "pl" ? "Filtry wyszukiwania" : "Search Filters"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Name Select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                  {language === "pl" ? "Nazwa szablonu" : "Template Name"}
                </span>
                <select
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3.5 pr-8 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer w-full"
                >
                  <option value="">{t("templates.allNames")}</option>
                  {templatesNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Subject Input */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                  {language === "pl" ? "Temat zawiera" : "Subject Contains"}
                </span>
                <input
                  type="text"
                  placeholder={t("templates.subjectContains")}
                  value={filters.subject}
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 hover:border-slate-350 dark:hover:border-slate-700 shadow-sm w-full"
                />
              </div>

              {/* Default Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                  {language === "pl" ? "Status domyślny" : "Default status"}
                </span>
                <select
                  value={filters.isDefault}
                  onChange={(e) => setFilters({ ...filters, isDefault: e.target.value })}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 pl-3.5 pr-8 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer w-full"
                >
                  <option value="">{t("templates.all")}</option>
                  <option value="true">{t("templates.default")}</option>
                  <option value="false">{t("templates.notDefault")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-650 dark:text-indigo-400 select-none">
                {t("templates.quickActions")}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 dark:text-slate-405">
                <div className="bg-slate-50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60">
                  <span className="text-[10px] block text-slate-400 uppercase tracking-wider mb-0.5">{t("templates.totalTemplates")}</span>
                  <span className="text-base font-extrabold text-slate-850 dark:text-slate-200">{templates.length}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900/60">
                  <span className="text-[10px] block text-slate-400 uppercase tracking-wider mb-0.5">{language === "pl" ? "Filtry" : "Filters"}</span>
                  <span className="text-base font-extrabold text-slate-850 dark:text-slate-200">
                    {filters.name || filters.subject || filters.isDefault ? (
                      <span className="text-emerald-555">{language === "pl" ? "Aktywne" : "Active"}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <Btn
              variant="primary"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t("templates.addTemplate")}
            </Btn>
          </div>
        </div>

        {/* Template Composer Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-5 transition duration-200 animate-fadeIn"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-1">
              <h3 className="text-base font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-500" />
                {selected ? t("templates.editTemplate") : t("templates.createNewTemplate")}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 font-bold transition text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Select template category name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                  {language === "pl" ? "Typ szablonu" : "Template Type"}
                </label>
                <select
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    setCurrName(e.target.value);
                  }}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 pl-3.5 pr-8 py-2.5 font-semibold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-350 dark:hover:border-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer w-full"
                  required
                >
                  <option value="" disabled>{t("templates.selectTemplateName")}</option>
                  {templatesNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Subject Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                  {t("templates.subject")}
                </label>
                <input
                  id="template-subject"
                  type="text"
                  placeholder={t("templates.subject")}
                  value={form.subject}
                  onFocus={() => setActiveField("subject")}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 px-3.5 py-2.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 hover:border-slate-350 dark:hover:border-slate-700 shadow-sm w-full"
                  required
                />
              </div>
            </div>

            {/* Dynamic Placeholders Guides */}
            {currentPlaceholders.length > 0 ? (
              <div className="flex flex-col gap-2 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/45 dark:border-indigo-900/20">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider select-none flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {language === "pl" ? "Dynamiczne symbole zastępcze (kliknij, aby wstawić w miejscu kursora):" : "Dynamic Placeholders (click to insert at cursor):"}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentPlaceholders.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => insertPlaceholder(p)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-755 dark:text-indigo-350 border border-indigo-200/50 dark:border-indigo-900/30 rounded-xl text-xs font-semibold shadow-xs transition duration-100 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{`\${${p}}`}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-850/60 text-xs text-slate-400">
                <HelpCircle className="w-4 h-4 flex-shrink-0" />
                <span>{language === "pl" ? "Wybierz typ szablonu powyżej, aby odblokować dedykowane zmienne." : "Select a template type above to unlock template-specific variables."}</span>
              </div>
            )}

            {/* Template Body Editor */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1 select-none">
                {t("templates.body")}
              </label>
              <textarea
                ref={textareaRef}
                placeholder={t("templates.body")}
                value={form.body}
                onFocus={() => setActiveField("body")}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full font-mono text-xs leading-relaxed bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 hover:border-slate-350 dark:hover:border-slate-700 resize-none shadow-inner focus:shadow-md"
                rows={9}
                required
              />
            </div>

            {/* Settings Toggles */}
            <div className="flex items-center py-2 border-t border-b border-slate-100 dark:border-slate-800/80 my-1">
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-650 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 transition-colors duration-200"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700 dark:text-slate-305">
                  {t("templates.defaultTemplate")}
                </span>
              </label>
            </div>

            {/* Form actions */}
            <div className="flex gap-2.5 pt-2">
              <Btn
                type="submit"
                disabled={submitLoading}
                variant="primary"
                className="flex-1 py-2.5 font-bold"
              >
                {submitLoading ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {selected ? (language === "pl" ? "Zapisywanie..." : "Saving...") : (language === "pl" ? "Tworzenie..." : "Creating...")}
                  </span>
                ) : (
                  <span>{selected ? "💾 " + t("templates.saveTemplate") : "➕ " + t("templates.createNewTemplate")}</span>
                )}
              </Btn>
              <Btn
                type="button"
                onClick={resetForm}
                variant="ghost"
                className="flex-1 py-2.5 font-bold"
              >
                {language === "pl" ? "Anuluj" : "Cancel"}
              </Btn>
            </div>
          </form>
        )}

        {/* Desktop Templates Table */}
        <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-left border-collapse border-spacing-0">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4 w-52">{t("users.name")}</th>
                  <th className="p-4">{t("templates.subject")}</th>
                  <th className="p-4 w-28 text-center">{t("templates.default")}</th>
                  <th className="p-4 w-44 text-center">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {templates.map((tmpl, idx) => (
                  <tr key={tmpl._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition">
                    <td className="p-4 text-xs font-semibold text-slate-450 dark:text-slate-500 text-center">
                      {idx + 1}
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30 flex-shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{tmpl.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {tmpl.subject}
                    </td>
                    <td className="p-4 text-center">
                      {tmpl.isDefault ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-350 border border-emerald-100/40 dark:border-emerald-900/20 text-[10px] font-bold">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {language === "pl" ? "Domyślny" : "Default"}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                          {language === "pl" ? "Nie" : "No"}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <Btn onClick={() => fetchTemplateById(tmpl._id)} variant="primary" size="sm">
                          {t("common.edit")}
                        </Btn>
                        <Btn
                          onClick={() => handleDelete(tmpl._id)}
                          disabled={deleteLoadingId === tmpl._id}
                          variant="danger"
                          size="sm"
                        >
                          {deleteLoadingId === tmpl._id ? (language === "pl" ? "Usuwanie..." : "Deleting...") : t("common.delete")}
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-405 dark:text-slate-600 font-semibold italic">
                      {language === "pl" ? "Nie znaleziono szablonów. Kliknij przycisk powyżej, aby dodać nowy." : "No templates found. Click the button above to add one."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Templates Cards List */}
        <div className="md:hidden flex flex-col gap-4">
          {templates.map((tmpl, idx) => (
            <div key={tmpl._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4 animate-fadeIn">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30 flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm truncate">{tmpl.name}</span>
                </div>
                <span className="text-[10px] font-bold font-mono text-slate-400">#{idx + 1}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider select-none">
                  {t("templates.subject")}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-250 break-words leading-relaxed">
                  {tmpl.subject}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider select-none">
                  {language === "pl" ? "Typ szablonu" : "Template status"}:
                </span>
                {tmpl.isDefault ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-350 border border-emerald-100/40 dark:border-emerald-900/20 text-[10px] font-bold">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {language === "pl" ? "Domyślny" : "Default"}
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-450 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                    {language === "pl" ? "Niedomyślny" : "Not Default"}
                  </span>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3.5 flex gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => fetchTemplateById(tmpl._id)}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition duration-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t("common.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tmpl._id)}
                  disabled={deleteLoadingId === tmpl._id}
                  className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-100/30 dark:border-rose-900/30 text-rose-650 dark:text-rose-400 text-xs font-bold rounded-xl transition duration-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleteLoadingId === tmpl._id ? (language === "pl" ? "Usuwanie..." : "Deleting...") : t("common.delete")}
                </button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-slate-450 italic font-semibold text-xs">
              {language === "pl" ? "Nie znaleziono szablonów. Kliknij przycisk powyżej, aby dodać nowy." : "No templates found. Click the button above to add one."}
            </div>
          )}
        </div>
      </div>
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
