import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/templates`;

const PLACEHOLDER_MAP = {
    newOrder: ["orderId", "CustomerName", "orderLink", "orderPassword"],
    updateOrder: ["orderId", "CustomerName"],
    resetPassword: ["VerificationCode"],
}

function TemplatesApp() {
    const { token } = useAuth();
    const [templatesNames, setTemplatesNames] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selected, setSelected] = useState(null);
    const [currName, setCurrName] = useState("");
    const [form, setForm] = useState({ name: "", subject: "", body: "", isDefault: false });
    const [filters, setFilters] = useState({ name: "", subject: "", isDefault: "" });
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [deleteLoadingId, setDeleteLoadingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [activeField, setActiveField] = useState(null);
    const textareaRef = useRef();

    const currentPlaceholders = currName
        ? PLACEHOLDER_MAP[currName] || []
        : [];
    // console.log(currName, currentPlaceholders, PLACEHOLDER_MAP[currName]);

    // Fetch template names
    const fetchTemplateNames = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/names`, { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) setTemplatesNames(data.data);
        } catch (err) {
            alert(err?.response?.data?.message || err.message);
        }
    };

    // Fetch templates
    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` }, params: { ...filters } });
            if (data.success) setTemplates(data.data);
        } catch (err) {
            alert(err?.response?.data?.message || err.message);
        }
        setLoading(false);
    };

    // Fetch one template for edit
    const fetchTemplateById = async (id) => {
        try {
            const { data } = await axios.get(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });

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
                const { data } = await axios.put(`${API_URL}/update/${selected._id}`, form, { headers: { Authorization: `Bearer ${token}` } });
                if (data.success) {
                    fetchTemplates();
                    resetForm();
                }
            } else {
                const { data } = await axios.post(`${API_URL}/create`, form, { headers: { Authorization: `Bearer ${token}` } });
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
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        setDeleteLoadingId(id);
        try {
            const { data } = await axios.delete(`${API_URL}/delete/${id}`, { headers: { Authorization: `Bearer ${token}` } });
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

        setForm(prev => ({
            ...prev,
            [activeField]: prev[activeField] + textToInsert
        }));
    };

    useEffect(() => {
        fetchTemplateNames();
        fetchTemplates();
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [filters]);

    if (loading) return <div className="p-8 text-center font-semibold text-gray-600">Loading templates...</div>;

    return (
        <div className="flex min-h-screen bg-blue-50">
            <main className="flex-1 p-6 md:p-10">
                <h1 className="text-3xl font-extrabold text-blue-700 text-center mb-6">Templates Manager</h1>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <select
                        value={filters.name}
                        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                        className="p-3 border rounded-xl flex-1"
                    >
                        <option value="">All Names</option>
                        {templatesNames.map((name) => (<option key={name} value={name}>{name}</option>))}
                    </select>
                    <input
                        type="text"
                        placeholder="Subject contains..."
                        value={filters.subject}
                        onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                        className="p-3 border rounded-xl flex-1"
                    />
                    <select
                        value={filters.isDefault}
                        onChange={(e) => setFilters({ ...filters, isDefault: e.target.value })}
                        className="p-3 border rounded-xl flex-1 md:flex-none"
                    >
                        <option value="">All</option>
                        <option value="true">Default</option>
                        <option value="false">Not Default</option>
                    </select>
                </div>

                {/* Show add/edit button */}
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                    >
                        + Add Template
                    </button>
                )}

                {/* Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 mb-6 space-y-4">
                        <h2 className="text-xl font-semibold">{selected ? "Edit Template" : "Create New Template"}</h2>

                        <select
                            value={form.name}
                            onChange={(e) => {setForm({ ...form, name: e.target.value }); setCurrName(e.target.value)}}
                            className="p-3 border rounded-xl w-full"
                            required
                        >
                            <option value="" disabled>Select template name</option>
                            {templatesNames.map((name) => (<option key={name} value={name}>{name}</option>))}
                        </select>

                        <input
                            type="text"
                            placeholder="Subject"
                            value={form.subject}
                            onFocus={() => setActiveField("subject")}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            className="p-3 border rounded-xl w-full"
                            required
                        />

                        {/* Placeholder buttons */}
                        <div className="flex flex-wrap gap-2 mb-1">
                            {currentPlaceholders.map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className="px-2 py-1 bg-blue-200 rounded hover:bg-blue-300"
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
                            className="p-3 border rounded-xl w-full"
                            rows={6}
                            required
                        />

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={form.isDefault}
                                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                                className="w-5 h-5"
                            />
                            <span>Is Default</span>
                        </label>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={submitLoading}
                                className={`px-4 py-2 rounded-xl text-white font-semibold ${submitLoading ? "bg-green-300" : "bg-green-600 hover:bg-green-700"}`}
                            >
                                {submitLoading ? (selected ? "Updating..." : "Creating...") : (selected ? "Update Template" : "Create Template")}
                            </button>

                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 rounded-xl bg-gray-300 hover:bg-gray-400 text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Templates List */}
                <div className="bg-white rounded-2xl shadow-lg overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead className="bg-blue-50 text-blue-700">
                            <tr>
                                <th className="p-3 text-left">#</th>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Subject</th>
                                <th className="p-3 text-left">Default</th>
                                <th className="p-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map((t, idx) => (
                                <tr key={t._id} className="hover:bg-blue-50 transition">
                                    <td className="p-3">{idx + 1}</td>
                                    <td className="p-3">{t.name}</td>
                                    <td className="p-3">{t.subject}</td>
                                    <td className="p-3">{t.isDefault ? "Yes" : "No"}</td>
                                    <td className="p-3 flex justify-center gap-2">
                                        <button
                                            onClick={() => fetchTemplateById(t._id)}
                                            className="px-3 py-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t._id)}
                                            disabled={deleteLoadingId === t._id}
                                            className={`px-3 py-1 rounded-xl text-white ${deleteLoadingId === t._id ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                                        >
                                            {deleteLoadingId === t._id ? "Deleting..." : "Delete"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {templates.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-gray-500">
                                        No templates found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

export default TemplatesApp;
