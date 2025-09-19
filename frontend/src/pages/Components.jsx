import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Components = () => {
    const { token } = useAuth();
    const [collections, setCollections] = useState([]);
    const [newCollection, setNewCollection] = useState("");
    const [newCollectionLogo, setNewCollectionLogo] = useState("");
    const [expanded, setExpanded] = useState(null);

    const [linkInputs, setLinkInputs] = useState({});
    const [editingLink, setEditingLink] = useState({ id: null, text: "", href: "" });

    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [editingLogo, setEditingLogo] = useState("");

    const axiosInstance = axios.create({
        baseURL: `${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}`,
        headers: { Authorization: `Bearer ${token}` },
    });

    // Fetch collections
    const fetchCollections = async () => {
        try {
            const res = await axiosInstance.get("/components");
            if (res.data.success) setCollections(res.data.data);
        } catch {
            alert("Error fetching collections");
        }
    };

    // Add collection
    const addCollection = async () => {
        if (!newCollection.trim()) return;

        try {
            const payload = { name: newCollection };
            if (newCollectionLogo.trim()) payload.logo = newCollectionLogo;

            await axiosInstance.post("/components/create", payload);
            await fetchCollections();

            setNewCollection("");
            setNewCollectionLogo("");
        } catch {
            alert("Error adding collection");
        }
    };

    // Delete collection
    const deleteCollection = async (collectionId) => {
        if (!window.confirm("Are you sure you want to delete this collection?")) return;
        try {
            await axiosInstance.delete(`/components/${collectionId}`);
            await fetchCollections();
            setExpanded(null);
        } catch {
            alert("Error deleting collection");
        }
    };

    // Edit collection name and logo
    const editCollection = async (collectionId) => {
        if (!editingName.trim()) return;

        try {
            const payload = { name: editingName };
            if (editingLogo.trim()) payload.logo = editingLogo;

            await axiosInstance.patch(`/components/${collectionId}`, payload);
            await fetchCollections();

            setEditingId(null);
            setEditingName("");
            setEditingLogo("");
        } catch {
            alert("Error editing collection");
        }
    };

    // Add link
    const addLink = async (collectionId) => {
        const input = linkInputs[collectionId];
        if (!input?.text || !input?.href) return alert("Text and URL are required");

        let href = input.href;
        if (!/^https?:\/\//i.test(href)) href = "http://" + href;

        try {
            await axiosInstance.post(`/components/${collectionId}/links`, { text: input.text, href });
            await fetchCollections();

            setLinkInputs(prev => ({ ...prev, [collectionId]: { text: "", href: "" } }));
        } catch {
            alert("Error adding link");
        }
    };

    // Delete link
    const deleteLink = async (collectionId, linkId) => {
        try {
            await axiosInstance.delete(`/components/${collectionId}/links/${linkId}`);
            await fetchCollections();
        } catch {
            alert("Error deleting link");
        }
    };

    // Edit link
    const saveLink = async (collectionId) => {
        if (!editingLink.text || !editingLink.href) return alert("Text and URL are required");

        let href = editingLink.href;
        if (!/^https?:\/\//i.test(href)) href = "http://" + href;

        try {
            await axiosInstance.put(`/components/${collectionId}/links/${editingLink.id}`, {
                text: editingLink.text,
                href
            });
            await fetchCollections();

            setEditingLink({ id: null, text: "", href: "" });
        } catch {
            alert("Error updating link");
        }
    };

    // Start editing link
    const startEditingLink = (link) => {
        setEditingLink({ id: link._id, text: link.text, href: link.href });
    };

    // Upload file
    const [fileInputs, setFileInputs] = useState({});
    const addFile = async (collectionId) => {
        const file = fileInputs[collectionId];
        if (!file) return alert("Choose a file first!");

        const formData = new FormData();
        formData.append("file", file);

        try {
            await axiosInstance.post(`/components/${collectionId}/files`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            await fetchCollections();
            setFileInputs(prev => ({ ...prev, [collectionId]: null }));
        } catch {
            alert("Error uploading file");
        }
    };

    // Delete file
    const deleteFile = async (collectionId, fileId) => {
        try {
            await axiosInstance.delete(`/components/${collectionId}/files/${fileId}`);
            await fetchCollections();
        } catch {
            alert("Error deleting file");
        }
    };

    useEffect(() => {
        fetchCollections();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex justify-center py-10 px-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-700">📂 Components</h2>

                {/* Add collection */}
                <div className="flex flex-col gap-2">
                    <input
                        value={newCollection}
                        onChange={e => setNewCollection(e.target.value.slice(0, 25))}
                        placeholder="New collection name..."
                        className="flex-1 border rounded-xl px-3 py-2"
                    />
                    <div className="flex gap-3">
                        <input
                            value={newCollectionLogo}
                            onChange={e => setNewCollectionLogo(e.target.value.slice(0, 10))}
                            placeholder="Optional logo"
                            className="flex-1 border rounded-xl px-3 py-2"
                        />
                        <button
                            onClick={addCollection}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* List of collections */}
                {collections.map(collection => (
                    <div key={collection._id} className="border rounded-xl p-4 bg-gray-50">
                        <div className="flex justify-between items-center">
                            {editingId === collection._id ? (
                                <div className="flex-1 flex flex-col gap-2">
                                    <input
                                        value={editingName}
                                        onChange={e => setEditingName(e.target.value)}
                                        className="flex-1 border rounded px-2 py-1"
                                        placeholder="Collection name"
                                    />
                                    <input
                                        value={editingLogo}
                                        onChange={e => setEditingLogo(e.target.value)}
                                        className="flex-1 border rounded px-2 py-1"
                                        placeholder="Logo string"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => editCollection(collection._id)}
                                            className="bg-green-500 text-white px-2 py-1 rounded"
                                        >
                                            ✅
                                        </button>
                                        <button
                                            onClick={() => { setEditingId(null); setEditingName(""); setEditingLogo(""); }}
                                            className="bg-gray-300 text-black px-2 py-1 rounded"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 w-full">
                                    {/* Expand arrow */}
                                    <button
                                        onClick={() => setExpanded(expanded === collection._id ? null : collection._id)}
                                    >
                                        {expanded === collection._id ? "▼" : "▶"}
                                    </button>

                                    {/* Logo (optional) */}
                                    {collection.logo && (
                                        <span className="flex-shrink-0 text-xl" title={collection.logo}>
                                            {collection.logo.length > 5 ? collection.logo.slice(0, 5) + "…" : collection.logo}
                                        </span>
                                    )}

                                    {/* Name: truncated */}
                                    <span className="flex-1 min-w-0 overflow-hidden text-xl truncate" title={collection.name}>
                                        {collection.name}
                                    </span>

                                    {/* Action buttons: flex-shrink-0 so they don't shrink */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => { setEditingId(collection._id); setEditingName(collection.name); setEditingLogo(collection.logo || ""); }}
                                            className="text-yellow-500 hover:text-yellow-700"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => deleteCollection(collection._id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Expanded content */}
                        {expanded === collection._id && (
                            <div className="mt-3">
                                {/* Files */}
                                {collection.files.map(file => (
                                    <div key={file._id} className="flex justify-between items-center bg-white p-2 rounded mb-2">
                                        <a
                                            href={`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/${file.path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 underline"
                                        >
                                            {file.name}
                                        </a>
                                        <button
                                            onClick={() => deleteFile(collection._id, file._id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}

                                {/* Add file */}
                                <div className="flex gap-2 mt-3">
                                    <input
                                        type="file"
                                        onChange={e => setFileInputs(prev => ({ ...prev, [collection._id]: e.target.files[0] }))}
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={() => addFile(collection._id)}
                                        className="bg-green-500 text-white px-3 py-2 rounded"
                                    >
                                        Upload
                                    </button>
                                </div>

                                {/* Links */}
                                <div className="mt-3">
                                    <h4 className="font-semibold mb-2">Links:</h4>
                                    {collection.links.map(link => (
                                        <div key={link._id} className="flex gap-2 items-center mb-2 w-full">
                                            {editingLink.id === link._id ? (
                                                <div className="flex flex-1 gap-2 min-w-0">
                                                    <input
                                                        className="border px-2 py-1 rounded flex-1 min-w-0 overflow-hidden truncate"
                                                        value={editingLink.text}
                                                        onChange={e => setEditingLink(prev => ({ ...prev, text: e.target.value }))}
                                                        placeholder="Text"
                                                    />
                                                    <input
                                                        className="border px-2 py-1 rounded flex-1 min-w-0 overflow-hidden truncate"
                                                        value={editingLink.href}
                                                        onChange={e => setEditingLink(prev => ({ ...prev, href: e.target.value }))}
                                                        placeholder="URL"
                                                    />
                                                    <button className="bg-green-500 text-white px-2 rounded flex-shrink-0" onClick={() => saveLink(collection._id)}>✅</button>
                                                    <button className="bg-gray-300 px-2 rounded flex-shrink-0" onClick={() => setEditingLink({ id: null, text: "", href: "" })}>❌</button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-1 gap-2 min-w-0">
                                                    <a
                                                        href={link.href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline flex-1 min-w-0 overflow-hidden truncate"
                                                    >
                                                        {link.text}
                                                    </a>
                                                    <button className="text-yellow-500 flex-shrink-0" onClick={() => startEditingLink(link)}>✏️</button>
                                                    <button className="text-red-500 flex-shrink-0" onClick={() => deleteLink(collection._id, link._id)}>🗑️</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Add new link */}
                                    <div className="flex gap-2 mt-2 w-full min-w-0">
                                        <input
                                            className="border px-2 py-1 rounded flex-1 min-w-0 overflow-hidden truncate"
                                            placeholder="Text"
                                            value={linkInputs[collection._id]?.text || ""}
                                            onChange={e => setLinkInputs(prev => ({ ...prev, [collection._id]: { ...prev[collection._id], text: e.target.value } }))}
                                        />
                                        <input
                                            className="border px-2 py-1 rounded flex-1 min-w-0 overflow-hidden truncate"
                                            placeholder="URL"
                                            value={linkInputs[collection._id]?.href || ""}
                                            onChange={e => setLinkInputs(prev => ({ ...prev, [collection._id]: { ...prev[collection._id], href: e.target.value } }))}
                                        />
                                        <button
                                            className="bg-green-500 text-white px-3 py-1 rounded flex-shrink-0"
                                            onClick={() => addLink(collection._id)}
                                        >
                                            Add
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Components;
