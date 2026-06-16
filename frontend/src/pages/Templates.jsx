import React, { useEffect, useState, useRef } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/layout/PageHeader";
import { useLanguage } from "../context/LanguageContext";

const PLACEHOLDER_MAP = {
  newOrder: ["orderId", "CustomerName", "orderLink", "orderPassword"],
  updateOrder: ["orderId", "CustomerName"],
  resetPassword: ["VerificationCode"],
};

function TemplatesApp() {
  const { token } = useAuth();
  const { t, language } = useLanguage();
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
  // console.log(currName, currentPlaceholders, PLACEHOLDER_MAP[currName]);

  // Fetch template names
  const fetchTemplateNames = async () => {
    try {
      const { data } = await apiClient.get("/templates/names");
      if (data.success) setTemplatesNames(data.data);
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
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
      alert(err?.response?.data?.message || err.message);
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
      alert(err?.response?.data?.message || err.message);
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
        }
      } else {
        const { data } = await apiClient.post("/templates/create", form);
        if (data.success) {
          fetchTemplates();
          resetForm();
        }
      }
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
    setSubmitLoading(false);
  };

  // Delete template
  const handleDelete = async (id) => {
    if (!window.confirm(t("templates.deleteConfirm")))
      return;
    setDeleteLoadingId(id);
    try {
      const { data } = await apiClient.delete(`/templates/delete/${id}`);
      if (data.success) {
        fetchTemplates();
        if (selected?._id === id) resetForm();
      }
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    }
    setDeleteLoadingId(null);
  };

  // Reset form
  const resetForm = () => {
    setSelected(null);
    setCurrName("");
    setForm({ name: "", subject: "", body: "", isDefault: false });
    setShowForm(false);
  };

  // Insert placeholder at cursor
  const insertPlaceholder = (placeholder) => {
    const textToInsert = `\${${placeholder}}`;
    if (!activeField) return;

    setForm((prev) => ({
      ...prev,
      [activeField]: prev[activeField] + textToInsert,
    }));
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white px-10 py-8 text-slate-600 shadow-lg">
          {t("templates.loading")}
        </div>
      </div>
    );

  return (
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <PageHeader
          title={"📧 " + t("nav.templates")}
          subtitle={t("templates.subtitle")}
        />

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.name}
                onChange={(e) =>
                  setFilters({ ...filters, name: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">{t("templates.allNames")}</option>
                {templatesNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder={t("templates.subjectContains")}
                value={filters.subject}
                onChange={(e) =>
                  setFilters({ ...filters, subject: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <select
                value={filters.isDefault}
                onChange={(e) =>
                  setFilters({ ...filters, isDefault: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">{t("templates.all")}</option>
                <option value="true">{t("templates.default")}</option>
                <option value="false">{t("templates.notDefault")}</option>
              </select>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              {t("templates.quickActions")}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition"
            >
              {t("templates.addTemplate")}
            </button>
            <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {t("templates.totalTemplates")}
                </span>{" "}
                {templates.length}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {t("templates.visibleFilters")}
                </span>{" "}
                {filters.name || filters.subject || filters.isDefault
                  ? t("templates.active")
                  : t("templates.none")}
              </p>
            </div>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {selected ? t("templates.editTemplate") : t("templates.createNewTemplate")}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {t("common.cancel")}
              </button>
            </div>

            <select
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setCurrName(e.target.value);
              }}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="" disabled>
                {t("templates.selectTemplateName")}
              </option>
              {templatesNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder={t("templates.subject")}
              value={form.subject}
              onFocus={() => setActiveField("subject")}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />

            <div className="flex flex-wrap gap-2">
              {currentPlaceholders.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  onClick={() => insertPlaceholder(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              placeholder={t("templates.body")}
              value={form.body}
              onFocus={() => setActiveField("body")}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-4 text-slate-900 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={6}
              required
            />

            <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
                className="h-5 w-5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-blue-600 focus:ring-blue-500"
              />
              <span>{t("templates.defaultTemplate")}</span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="submit"
                disabled={submitLoading}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition ${submitLoading ? "bg-emerald-300" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {submitLoading
                  ? selected
                    ? (language === "pl" ? "Aktualizowanie..." : "Updating...")
                    : (language === "pl" ? "Tworzenie..." : "Creating...")
                  : selected
                    ? t("templates.saveTemplate")
                    : t("templates.createNewTemplate")}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 transition"
              >
                {language === "pl" ? "Resetuj" : "Reset"}
              </button>
            </div>
          </form>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white dark:bg-slate-900 p-6 shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-950 text-left text-slate-600 dark:text-slate-400 uppercase tracking-[0.18em] text-xs">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">{t("users.name")}</th>
                <th className="p-3">{t("templates.subject")}</th>
                <th className="p-3">{t("templates.default")}</th>
                <th className="p-3 text-center">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tmpl, idx) => (
                <tr
                  key={tmpl._id}
                  className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/40 transition"
                >
                  <td className="p-3 align-top">{idx + 1}</td>
                  <td className="p-3 align-top">{tmpl.name}</td>
                  <td className="p-3 align-top">{tmpl.subject}</td>
                  <td className="p-3 align-top">
                    {tmpl.isDefault ? t("cart.yes") : t("cart.no")}
                  </td>
                  <td className="p-3 align-top text-center">
                    <div className="inline-flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => fetchTemplateById(tmpl._id)}
                        className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(tmpl._id)}
                        disabled={deleteLoadingId === tmpl._id}
                        className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white transition ${deleteLoadingId === tmpl._id ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                      >
                        {deleteLoadingId === tmpl._id ? (language === "pl" ? "Usuwanie..." : "Deleting...") : t("common.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    {language === "pl" ? "Nie znaleziono szablonów. Użyj przycisku powyżej, aby utworzyć szablon." : "No templates found. Use the button above to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TemplatesApp;
