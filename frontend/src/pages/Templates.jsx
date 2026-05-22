import React, { useEffect, useState, useRef } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

const PLACEHOLDER_MAP = {
  newOrder: ["orderId", "CustomerName", "orderLink", "orderPassword"],
  updateOrder: ["orderId", "CustomerName"],
  resetPassword: ["VerificationCode"],
};

function TemplatesApp() {
  const { token } = useAuth();
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
    if (!window.confirm("Are you sure you want to delete this template?"))
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
          Loading templates…
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col items-center p-6 md:p-8">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4 w-full">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              📧 Templates Manager
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Create, edit and organize email templates with placeholders for
              orders, password resets, and updates.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.name}
                onChange={(e) =>
                  setFilters({ ...filters, name: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All Names</option>
                {templatesNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Subject contains..."
                value={filters.subject}
                onChange={(e) =>
                  setFilters({ ...filters, subject: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <select
                value={filters.isDefault}
                onChange={(e) =>
                  setFilters({ ...filters, isDefault: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All</option>
                <option value="true">Default</option>
                <option value="false">Not Default</option>
              </select>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              Quick actions
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition"
            >
              + Add Template
            </button>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">
                  Total templates:
                </span>{" "}
                {templates.length}
              </p>
              <p>
                <span className="font-semibold text-slate-900">
                  Visible filters:
                </span>{" "}
                {filters.name || filters.subject || filters.isDefault
                  ? "Active"
                  : "None"}
              </p>
            </div>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">
                {selected ? "Edit Template" : "Create New Template"}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>

            <select
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setCurrName(e.target.value);
              }}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="" disabled>
                Select template name
              </option>
              {templatesNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Subject"
              value={form.subject}
              onFocus={() => setActiveField("subject")}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />

            <div className="flex flex-wrap gap-2">
              {currentPlaceholders.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 transition"
                  onClick={() => insertPlaceholder(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              placeholder="Body"
              value={form.body}
              onFocus={() => setActiveField("body")}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={6}
              required
            />

            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
                className="h-5 w-5 rounded border border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
              />
              <span>Set as default template</span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="submit"
                disabled={submitLoading}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition ${submitLoading ? "bg-emerald-300" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {submitLoading
                  ? selected
                    ? "Updating..."
                    : "Creating..."
                  : selected
                    ? "Update Template"
                    : "Create Template"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Reset
              </button>
            </div>
          </form>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm text-slate-700">
            <thead className="bg-slate-100 text-left text-slate-600 uppercase tracking-[0.18em] text-xs">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Name</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Default</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t, idx) => (
                <tr
                  key={t._id}
                  className="border-t border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="p-3 align-top">{idx + 1}</td>
                  <td className="p-3 align-top">{t.name}</td>
                  <td className="p-3 align-top">{t.subject}</td>
                  <td className="p-3 align-top">
                    {t.isDefault ? "Yes" : "No"}
                  </td>
                  <td className="p-3 align-top text-center">
                    <div className="inline-flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => fetchTemplateById(t._id)}
                        className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t._id)}
                        disabled={deleteLoadingId === t._id}
                        className={`rounded-2xl px-3 py-2 text-xs font-semibold text-white transition ${deleteLoadingId === t._id ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                      >
                        {deleteLoadingId === t._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {templates.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No templates found. Use the button above to create one.
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
