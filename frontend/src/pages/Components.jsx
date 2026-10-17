import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/layout/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/layout/ConfirmModal";

const Components = () => {
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
  const [collections, setCollections] = useState([]);
  const [newCollection, setNewCollection] = useState("");
  const [newCollectionLogo, setNewCollectionLogo] = useState("");
  const [expanded, setExpanded] = useState(null);

  const [linkInputs, setLinkInputs] = useState({});
  const [editingLink, setEditingLink] = useState({
    id: null,
    text: "",
    href: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingLogo, setEditingLogo] = useState("");

  // Fetch collections
  const fetchCollections = async () => {
    try {
      const res = await apiClient.get("/components");
      if (res.data.success) setCollections(res.data.data);
    } catch {
      showToast("Error fetching collections", "error");
    }
  };

  // Add collection
  const addCollection = async () => {
    if (!newCollection.trim()) return;

    try {
      const payload = { name: newCollection };
      if (newCollectionLogo.trim()) payload.logo = newCollectionLogo;

      await apiClient.post("/components/create", payload);
      await fetchCollections();

      setNewCollection("");
      setNewCollectionLogo("");
    } catch {
      showToast(t("components.addLinkError"), "error");
    }
  };

  // Delete collection
  const deleteCollection = (collectionId) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń",
      message: t("components.deleteCollectionConfirm") || "Are you sure you want to delete this collection?",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/components/${collectionId}`);
          await fetchCollections();
          setExpanded(null);
        } catch {
          showToast(t("components.deleteCollectionError"), "error");
        }
      }
    });
  };

  // Edit collection name and logo
  const editCollection = async (collectionId) => {
    if (!editingName.trim()) return;

    try {
      const payload = { name: editingName };
      if (editingLogo.trim()) payload.logo = editingLogo;

      await apiClient.patch(`/components/${collectionId}`, payload);
      await fetchCollections();

      setEditingId(null);
      setEditingName("");
      setEditingLogo("");
    } catch {
      showToast(t("components.editCollectionError"), "error");
    }
  };

  // Add link
  const addLink = async (collectionId) => {
    const input = linkInputs[collectionId];
    if (!input?.text || !input?.href) {
      showToast(t("components.linkTextRequired"), "warning");
      return;
    }

    let href = input.href;
    if (!/^https?:\/\//i.test(href)) href = "http://" + href;

    try {
      await apiClient.post(`/components/${collectionId}/links`, {
        text: input.text,
        href,
      });
      await fetchCollections();

      setLinkInputs((prev) => ({
        ...prev,
        [collectionId]: { text: "", href: "" },
      }));
    } catch {
      showToast(t("components.addLinkError"), "error");
    }
  };

  // Delete link
  const deleteLink = (collectionId, linkId) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń",
      message: t("components.deleteLinkConfirm") || "Are you sure you want to delete this link?",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/components/${collectionId}/links/${linkId}`);
          await fetchCollections();
        } catch {
          showToast(t("components.deleteLinkError"), "error");
        }
      }
    });
  };

  // Edit link
  const saveLink = async (collectionId) => {
    if (!editingLink.text || !editingLink.href) {
      showToast(t("components.linkTextRequired"), "warning");
      return;
    }

    let href = editingLink.href;
    if (!/^https?:\/\//i.test(href)) href = "http://" + href;

    try {
      await apiClient.put(
        `/components/${collectionId}/links/${editingLink.id}`,
        {
          text: editingLink.text,
          href,
        },
      );
      await fetchCollections();

      setEditingLink({ id: null, text: "", href: "" });
    } catch {
      showToast(t("components.saveLinkError"), "error");
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
    if (!file) {
      showToast(t("components.uploadFileFirst"), "warning");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await apiClient.post(`/components/${collectionId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchCollections();
      setFileInputs((prev) => ({ ...prev, [collectionId]: null }));
    } catch {
      showToast(t("components.uploadError"), "error");
    }
  };

  // Delete file
  const deleteFile = (collectionId, fileId) => {
    setConfirmConfig({
      isOpen: true,
      title: t("common.delete") || "Usuń",
      message: t("components.deleteFileConfirm") || "Are you sure you want to delete this file?",
      type: "danger",
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/components/${collectionId}/files/${fileId}`);
          await fetchCollections();
        } catch {
          showToast(t("components.deleteFileError"), "error");
        }
      }
    });
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <PageHeader
          title={"📂 " + t("nav.components")}
          subtitle={t("components.subtitle")}
        />

        <div className="flex flex-col gap-6">
          {/* Add collection */}
          <div className="flex flex-col gap-3 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("components.createNewCollection")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={newCollection}
                onChange={(e) => setNewCollection(e.target.value.slice(0, 25))}
                placeholder={t("components.collectionNamePlaceholder")}
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="flex gap-2">
                <input
                  value={newCollectionLogo}
                  onChange={(e) =>
                    setNewCollectionLogo(e.target.value.slice(0, 10))
                  }
                  placeholder={t("components.logoEmojiPlaceholder")}
                  className="w-36 border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  onClick={addCollection}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition"
                >
                  {t("common.add") || "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* List of collections */}
          <div className="flex flex-col gap-4">
            {collections.length === 0 && (
              <div className="py-20 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-lg font-semibold mb-2">{t("components.noCollections")}</p>
                <p className="text-sm text-slate-500">
                  {t("components.noCollectionsDesc")}
                </p>
              </div>
            )}
            {collections.map((collection) => (
              <div
                key={collection._id}
                className="border border-slate-200/80 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  {editingId === collection._id ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder={t("components.collectionName")}
                      />
                      <input
                        value={editingLogo}
                        onChange={(e) => setEditingLogo(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder={t("components.logoString")}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => editCollection(collection._id)}
                          className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm hover:bg-emerald-700 transition"
                        >
                          {t("common.save")}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                            setEditingLogo("");
                          }}
                          className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-slate-200 transition"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 w-full">
                      {/* Expand arrow */}
                      <button
                        onClick={() =>
                          setExpanded(
                            expanded === collection._id ? null : collection._id,
                          )
                        }
                        className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
                      >
                        {expanded === collection._id ? "▼" : "▶"}
                      </button>

                      {/* Logo (optional) */}
                      {collection.logo && (
                        <span
                          className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base"
                          title={collection.logo}
                        >
                          {collection.logo.length > 5
                            ? collection.logo.slice(0, 5) + "…"
                            : collection.logo}
                        </span>
                      )}

                      {/* Name: truncated */}
                      <span
                        className="flex-1 min-w-0 font-bold text-slate-800 text-sm sm:text-base truncate"
                        title={collection.name}
                      >
                        {collection.name}
                      </span>

                      {/* Action buttons */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(collection._id);
                            setEditingName(collection.name);
                            setEditingLogo(collection.logo || "");
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition text-sm"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteCollection(collection._id)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {expanded === collection._id && (
                  <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col gap-4">
                    {/* Files */}
                    {collection.files?.length > 0 && (
                      <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          {t("components.attachedFiles")}
                        </p>
                        {collection.files.map((file) => (
                          <div
                            key={file._id}
                            className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-sm"
                          >
                            <a
                              href={`${import.meta.env.VITE_API_IP}${import.meta.env.VITE_API_PORT}${import.meta.env.VITE_API_POSTFIX}/${file.path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline truncate max-w-[80%]"
                            >
                              {file.name}
                            </a>
                            <button
                              onClick={() =>
                                deleteFile(collection._id, file._id)
                              }
                              className="p-1 text-slate-400 hover:text-red-600 transition"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add file */}
                    <div className="flex items-center gap-3 bg-slate-50/30 border border-slate-200/60 rounded-xl p-3">
                      <input
                        type="file"
                        onChange={(e) =>
                          setFileInputs((prev) => ({
                            ...prev,
                            [collection._id]: e.target.files[0],
                          }))
                        }
                        className="flex-1 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
                      />
                      <button
                        onClick={() => addFile(collection._id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm transition"
                      >
                        {t("components.upload")}
                      </button>
                    </div>

                    {/* Links */}
                    <div className="border-t border-slate-100 pt-4">
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
                        {t("components.links")}:
                      </h4>
                      <div className="flex flex-col gap-2">
                        {collection.links?.map((link) => (
                          <div
                            key={link._id}
                            className="flex gap-2 items-center w-full bg-slate-50/50 px-3 py-2 rounded-xl border border-slate-100"
                          >
                            {editingLink.id === link._id ? (
                              <div className="flex flex-1 gap-2 min-w-0">
                                <input
                                  className="border border-slate-200 px-2 py-1 rounded-lg text-xs flex-1 min-w-0"
                                  value={editingLink.text}
                                  onChange={(e) =>
                                    setEditingLink((prev) => ({
                                      ...prev,
                                      text: e.target.value,
                                    }))
                                  }
                                  placeholder={t("components.linkText")}
                                />
                                <input
                                  className="border border-slate-200 px-2 py-1 rounded-lg text-xs flex-1 min-w-0"
                                  value={editingLink.href}
                                  onChange={(e) =>
                                    setEditingLink((prev) => ({
                                      ...prev,
                                      href: e.target.value,
                                    }))
                                  }
                                  placeholder="URL"
                                />
                                <button
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg"
                                  onClick={() => saveLink(collection._id)}
                                >
                                  ✅
                                </button>
                                <button
                                  className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg"
                                  onClick={() =>
                                    setEditingLink({
                                      id: null,
                                      text: "",
                                      href: "",
                                    })
                                  }
                                >
                                  ❌
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-1 gap-2 min-w-0 items-center justify-between">
                                <a
                                  href={link.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-850 hover:underline truncate max-w-[80%]"
                                >
                                  {link.text}
                                </a>
                                <div className="flex gap-1.5">
                                  <button
                                    className="text-slate-400 hover:text-slate-600 text-xs p-1"
                                    onClick={() => startEditingLink(link)}
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className="text-red-400 hover:text-red-600 text-xs p-1"
                                    onClick={() =>
                                      deleteLink(collection._id, link._id)
                                    }
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add new link */}
                      <div className="flex flex-col sm:flex-row gap-2 mt-3 w-full">
                        <input
                          className="border border-slate-200 px-3 py-1.5 rounded-xl text-xs flex-1 min-w-0"
                          placeholder={t("components.linkLabelPlaceholder")}
                          value={linkInputs[collection._id]?.text || ""}
                          onChange={(e) =>
                            setLinkInputs((prev) => ({
                              ...prev,
                              [collection._id]: {
                                ...prev[collection._id],
                                text: e.target.value,
                              },
                            }))
                          }
                        />
                        <input
                          className="border border-slate-200 px-3 py-1.5 rounded-xl text-xs flex-1 min-w-0"
                          placeholder="https://..."
                          value={linkInputs[collection._id]?.href || ""}
                          onChange={(e) =>
                            setLinkInputs((prev) => ({
                              ...prev,
                              [collection._id]: {
                                ...prev[collection._id],
                                href: e.target.value,
                              },
                            }))
                          }
                        />
                        <button
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-xs font-bold rounded-xl shadow-sm transition"
                          onClick={() => addLink(collection._id)}
                        >
                          {t("components.addLink")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
};

export default Components;
