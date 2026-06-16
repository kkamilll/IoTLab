import React, { useState, useEffect, useRef } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { useLanguage } from "../context/LanguageContext";

const Profile = () => {
  const { token } = useAuth();
  const { t, language } = useLanguage();

  // --- State ---
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    labRooms: [],
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newLabRoom, setNewLabRoom] = useState("");
  const [open, setOpen] = useState(false);

  const ref = useRef(null);

  // --- Fetch user profile on mount ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get("/users/profile");
        if (res.data.success) {
          setUser({
            name: res.data.user.name,
            email: res.data.user.email,
            password: "",
            labRooms: res.data.user.labRooms || [],
          });
        }
      } catch (err) {
        console.error(err.response?.data || err.message);
        alert(t("profile.errorFetch"));
      }
    };
    fetchUser();
  }, [token]);

  // --- Handle click outside dropdown ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Handlers ---
  const handleSave = async () => {
    if (!user.name.trim() || !user.email.trim())
      return alert(t("profile.nameEmailRequired"));
    try {
      setLoading(true);
      const res = await apiClient.put("/users/profile", {
        name: user.name,
        email: user.email,
        password: user.password,
        labRooms: user.labRooms,
      });
      if (res.data.success) {
        alert(t("profile.successUpdate"));
        setEditMode(false);
        setUser((prev) => ({ ...prev, password: "" }));
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(t("profile.errorUpdate"));
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => setEditMode(false);

  const handleAddLabRoom = () => {
    if (newLabRoom && !user.labRooms.includes(newLabRoom)) {
      setUser((prev) => ({
        ...prev,
        labRooms: [...prev.labRooms, newLabRoom],
      }));
      setNewLabRoom("");
    }
  };

  const handleRemoveLabRoom = (room) => {
    setUser((prev) => ({
      ...prev,
      labRooms: prev.labRooms.filter((r) => r !== room),
    }));
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/30 dark:bg-slate-900/10">
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6">
        <PageHeader
          title={"👤 " + t("nav.profile")}
          subtitle={language === "pl" ? "Zarządzaj swoimi danymi konta, pokojami laboratoryjnymi i preferencjami" : "Manage your account details, lab rooms, and preferences"}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              {t("profile.overview")}
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">
              {t("profile.details")}
            </h3>

            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-slate-500">{t("profile.name")}</p>
                <p className="font-semibold text-slate-900">
                  {user.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">{t("profile.email")}</p>
                <p className="font-semibold text-slate-900 break-all">
                  {user.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">{t("profile.role")}</p>
                <p className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {user.role || "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                {t("profile.labRooms")}
              </p>
              {user.labRooms?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.labRooms.map((room, idx) => (
                    <span
                      key={idx}
                      className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm"
                    >
                      {room}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {t("profile.noLabRooms")}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
              {t("profile.editProfile")}
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">
              {t("profile.settings")}
            </h3>

            <div className="mt-6 space-y-5">
              <label className="block text-sm text-slate-700">
                <span className="font-medium">{t("profile.name")}</span>
                <input
                  type="text"
                  value={user.name}
                  disabled={!editMode}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
                  placeholder={t("profile.name")}
                />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="font-medium">{t("profile.email")}</span>
                <input
                  type="email"
                  value={user.email}
                  disabled={!editMode}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
                  placeholder={t("profile.email")}
                />
              </label>

              {editMode && (
                <label className="block text-sm text-slate-700">
                  <span className="font-medium">{t("profile.password")}</span>
                  <input
                    type="password"
                    value={user.password}
                    onChange={(e) =>
                      setUser({ ...user, password: e.target.value })
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder={t("profile.password")}
                  />
                </label>
              )}

              {editMode && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="flex-1 block text-sm text-slate-700">
                      <span className="font-medium">{t("profile.newLabRoom")}</span>
                      <input
                        id="lab-room"
                        type="text"
                        placeholder="e.g. Lab A"
                        value={newLabRoom}
                        onChange={(e) => setNewLabRoom(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLabRoom}
                      className="self-end rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                      {t("profile.addLab")}
                    </button>
                  </div>

                  <div ref={ref} className="space-y-2">
                    <button
                      onClick={() => setOpen((prev) => !prev)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-200 transition flex items-center justify-between"
                    >
                      <span>{t("profile.manageLabRooms")}</span>
                      <span>
                        {open ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </span>
                    </button>

                    {open && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        {user.labRooms.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            {t("profile.noLabRooms")}
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {user.labRooms.map((room, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                              >
                                <span>{room}</span>
                                <button
                                  onClick={() => handleRemoveLabRoom(room)}
                                  className="text-sm font-semibold text-red-600 hover:text-red-800"
                                >
                                  {t("common.delete")}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-10">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 transition"
            >
              {t("profile.editProfile")}
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3 text-base font-semibold text-white shadow-lg hover:bg-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (language === "pl" ? "Zapisywanie..." : "Saving...") : t("profile.saveChanges")}
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 rounded-2xl bg-slate-200 px-5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-300 transition"
              >
                {t("common.cancel")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
