import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import apiClient from "../api/apiClient";
import PageHeader from "../components/layout/PageHeader";
import Pagination from "../components/layout/Pagination";
import ConfirmModal from "../components/layout/ConfirmModal";
import Btn from "../components/layout/Btn";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Trash2,
  Search,
  Filter,
  Package,
  RefreshCw,
  Shield,
  Info,
  RotateCcw,
  Sparkles,
  Calendar,
  ExternalLink,
  X,
  AlertTriangle,
} from "lucide-react";
import { format, formatDistanceToNow, addDays, differenceInDays } from "date-fns";
import { pl, enUS } from "date-fns/locale";

const Notifications = () => {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(15);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "unread" | "read"
  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "ORDER_CREATED" | "STATUS_CHANGED" | "REMINDER_SENT" | "SYSTEM"
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    unreadCount: 0,
    readCount: 0,
    ordersCount: 0,
    retentionDays: 7,
  });

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger",
    onConfirm: null,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());

      const { data } = await apiClient.get(`/notifications?${params.toString()}`);
      if (data.success) {
        setNotifications(data.notifications || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error(err);
      showToast(
        language === "pl" ? "Błąd pobierania powiadomień" : "Failed to load notifications",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, typeFilter, debouncedSearch, language, showToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark single notification as read
  const handleMarkAsRead = async (id) => {
    setActionLoadingId(id);
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setStats((prev) => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        readCount: prev.readCount + 1,
      }));
      showToast(
        language === "pl" ? "Oznaczono jako przeczytane" : "Marked as read",
        "success"
      );
    } catch {
      showToast(
        language === "pl" ? "Nie udało się zaktualizować powiadomienia" : "Failed to update notification",
        "error"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark single notification as unread
  const handleMarkAsUnread = async (id) => {
    setActionLoadingId(id);
    try {
      await apiClient.patch(`/notifications/${id}/unread`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: false, readAt: null } : n))
      );
      setStats((prev) => ({
        ...prev,
        unreadCount: prev.unreadCount + 1,
        readCount: Math.max(0, prev.readCount - 1),
      }));
      showToast(
        language === "pl" ? "Oznaczono jako nieprzeczytane" : "Marked as unread",
        "info"
      );
    } catch {
      showToast(
        language === "pl" ? "Nie udało się zaktualizować powiadomienia" : "Failed to update notification",
        "error"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete single notification
  const handleDeleteSingle = (id) => {
    setConfirmConfig({
      isOpen: true,
      title: language === "pl" ? "Usunąć powiadomienie?" : "Delete notification?",
      message:
        language === "pl"
          ? "Czy na pewno chcesz usunąć to powiadomienie ze swojej historii?"
          : "Are you sure you want to delete this notification from history?",
      type: "danger",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/notifications/${id}`);
          setNotifications((prev) => prev.filter((n) => n._id !== id));
          setTotalItems((prev) => Math.max(0, prev - 1));
          showToast(
            language === "pl" ? "Powiadomienie zostało usunięte" : "Notification deleted",
            "success"
          );
          fetchNotifications();
        } catch {
          showToast(
            language === "pl" ? "Błąd usuwania powiadomienia" : "Failed to delete notification",
            "error"
          );
        }
      },
    });
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.patch("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() }))
      );
      setStats((prev) => ({
        ...prev,
        readCount: prev.readCount + prev.unreadCount,
        unreadCount: 0,
      }));
      showToast(
        language === "pl" ? "Wszystkie powiadomienia oznaczono jako przeczytane" : "All marked as read",
        "success"
      );
      fetchNotifications();
    } catch {
      showToast(
        language === "pl" ? "Błąd oznaczania wszystkich" : "Failed to mark all as read",
        "error"
      );
    }
  };

  // Clear all read notifications
  const handleClearRead = () => {
    setConfirmConfig({
      isOpen: true,
      title: t("notifications.confirmClearReadTitle"),
      message: t("notifications.confirmClearReadMsg"),
      type: "warning",
      onConfirm: async () => {
        try {
          const res = await apiClient.delete("/notifications/clear-read");
          showToast(
            res.data?.message || (language === "pl" ? "Wyczyszczono przeczytane" : "Read notifications cleared"),
            "success"
          );
          fetchNotifications();
        } catch {
          showToast(
            language === "pl" ? "Błąd usuwania przeczytanych" : "Failed to clear read notifications",
            "error"
          );
        }
      },
    });
  };

  // Delete all notifications
  const handleDeleteAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: t("notifications.confirmDeleteAllTitle"),
      message: t("notifications.confirmDeleteAllMsg"),
      type: "danger",
      onConfirm: async () => {
        try {
          await apiClient.delete("/notifications");
          setNotifications([]);
          setTotalItems(0);
          setStats({
            total: 0,
            unreadCount: 0,
            readCount: 0,
            ordersCount: 0,
            retentionDays: 7,
          });
          showToast(
            language === "pl" ? "Cała historia została wyczyszczona" : "All notifications deleted",
            "success"
          );
        } catch {
          showToast(
            language === "pl" ? "Błąd czyszczenia historii" : "Failed to delete all notifications",
            "error"
          );
        }
      },
    });
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
    setPage(1);
  };

  const isAnyFilterActive = statusFilter !== "all" || typeFilter !== "all" || searchQuery.trim() !== "";

  // Styling helper for notification type
  const getTypeConfig = (type) => {
    switch (type) {
      case "ORDER_CREATED":
        return {
          icon: Package,
          label: language === "pl" ? "Nowe zamówienie" : "New Order",
          bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40",
          badgeBg: "bg-blue-100/70 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        };
      case "STATUS_CHANGED":
        return {
          icon: RefreshCw,
          label: language === "pl" ? "Zmiana statusu" : "Status Change",
          bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40",
          badgeBg: "bg-amber-100/70 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        };
      case "REMINDER_SENT":
        return {
          icon: Clock,
          label: language === "pl" ? "Przypomnienie" : "Reminder",
          bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/40",
          badgeBg: "bg-purple-100/70 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
        };
      case "SYSTEM":
        return {
          icon: Shield,
          label: language === "pl" ? "Systemowe" : "System",
          bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40",
          badgeBg: "bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        };
      default:
        return {
          icon: BellRing,
          label: language === "pl" ? "Powiadomienie" : "Notification",
          bg: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          badgeBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        };
    }
  };

  const dateLocale = language === "pl" ? pl : enUS;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Full width container mirroring Users & Orders pages */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-6 md:py-8 flex flex-col gap-6 max-w-[1920px] mx-auto">
        {/* Page Header */}
        <PageHeader
          title={"🔔 " + (t("notifications.title") || "Centrum Powiadomień")}
          subtitle={
            t("notifications.subtitle") ||
            (language === "pl"
              ? "Historia zdarzeń, aktualizacje zamówień i powiadomienia systemowe"
              : "Activity log, order updates and system notifications")
          }
        >
          <div className="flex items-center gap-2 flex-wrap">
            {stats.readCount > 0 && (
              <button
                type="button"
                onClick={handleClearRead}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs border border-slate-200 dark:border-slate-700 cursor-pointer"
                title={language === "pl" ? "Usuń przeczytane powiadomienia" : "Clear read notifications"}
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{t("notifications.clearRead")}</span>
              </button>
            )}

            {stats.unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-900/40 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{t("notifications.markAllAsRead")}</span>
              </button>
            )}

            {stats.total > 0 && (
              <button
                type="button"
                onClick={handleDeleteAll}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("notifications.deleteAll")}</span>
              </button>
            )}
          </div>
        </PageHeader>

        {/* 7-Day Auto-retention Notice Banner */}
        <div className="flex items-center justify-between gap-3 p-3.5 px-4 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50/60 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-slate-900/40 rounded-2xl border border-indigo-100/80 dark:border-indigo-900/30 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-indigo-500 text-white shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-slate-800 dark:text-slate-200">
                {language === "pl" ? "Automatyczna retencja:" : "Automatic retention:"}
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {language === "pl"
                  ? "Przeczytane powiadomienia są automatycznie i bezpowrotnie usuwane po 7 dniach od odczytania."
                  : "Read notifications are automatically purged after 7 days from when they were marked as read."}
              </span>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-650 dark:text-indigo-400 shrink-0 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>TTL 7d</span>
          </span>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={t("notifications.searchPlaceholder")}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t("notifications.all")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("unread");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "unread"
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span>{t("notifications.unread")}</span>
                {stats.unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("read");
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === "read"
                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t("notifications.read")}
              </button>
            </div>

            {/* Type Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
            >
              <option value="all">{language === "pl" ? "Wszystkie kategorie" : "All Categories"}</option>
              <option value="ORDER_CREATED">{language === "pl" ? "Nowe zamówienia" : "New Orders"}</option>
              <option value="STATUS_CHANGED">{language === "pl" ? "Zmiany statusu" : "Status Changes"}</option>
              <option value="REMINDER_SENT">{language === "pl" ? "Przypomnienia" : "Reminders"}</option>
              <option value="SYSTEM">{language === "pl" ? "Systemowe" : "System"}</option>
            </select>

            {/* Reset Filters */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                title={language === "pl" ? "Wyczyść filtry" : "Clear filters"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === "pl" ? "Reset" : "Reset"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-xs font-bold">
                {language === "pl" ? "Wczytywanie powiadomień..." : "Loading notifications..."}
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-3xl shadow-inner">
                📭
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                  {t("notifications.emptyTitle")}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                  {isAnyFilterActive
                    ? (language === "pl" ? "Brak powiadomień spełniających wybrane kryteria filtrowania." : "No notifications match your current filters.")
                    : t("notifications.emptySubtitle")}
                </p>
              </div>
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-xs font-bold transition border border-indigo-200 dark:border-indigo-900/30 cursor-pointer"
                >
                  {language === "pl" ? "Zresetuj filtry" : "Reset filters"}
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-850">
              {notifications.map((notif) => {
                const typeCfg = getTypeConfig(notif.type);
                const TypeIcon = typeCfg.icon;
                const isUnread = !notif.isRead;

                // Calculate auto-deletion time for read notifications
                let daysLeft = null;
                if (notif.isRead && notif.readAt) {
                  const expiresAt = addDays(new Date(notif.readAt), 7);
                  daysLeft = Math.max(0, differenceInDays(expiresAt, new Date()));
                }

                return (
                  <li
                    key={notif._id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start transition-colors duration-150 group ${
                      isUnread
                        ? "bg-indigo-50/20 dark:bg-indigo-950/15 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/25"
                        : "hover:bg-slate-50/70 dark:hover:bg-slate-850/40"
                    }`}
                  >
                    {/* Left: Type Icon */}
                    <div className="flex sm:flex-col items-center gap-2 shrink-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-2xs ${typeCfg.bg}`}
                      >
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      {isUnread && (
                        <span className="sm:hidden text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white animate-pulse">
                          {t("notifications.newBadge")}
                        </span>
                      )}
                    </div>

                    {/* Middle: Title, Meta, Message, Related Order */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5 w-full">
                      {/* Title & Timestamp Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-sm sm:text-base font-extrabold truncate ${
                              isUnread
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {notif.title}
                          </h4>

                          {isUnread ? (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white shadow-2xs animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              <span>{t("notifications.newBadge")}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              {t("notifications.readBadge")}
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${typeCfg.badgeBg}`}
                          >
                            {typeCfg.label}
                          </span>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px] font-medium shrink-0">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {format(new Date(notif.createdAt), "d MMM yyyy, HH:mm", {
                                locale: dateLocale,
                              })}
                            </span>
                          </span>
                          <span className="opacity-40">•</span>
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">
                            {formatDistanceToNow(new Date(notif.createdAt), {
                              addSuffix: true,
                              locale: dateLocale,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Message body */}
                      <p
                        className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                          isUnread
                            ? "text-slate-800 dark:text-slate-200 font-medium"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {notif.message}
                      </p>

                      {/* Related Entities and Retention Info Footer */}
                      <div className="flex items-center gap-2 flex-wrap pt-1 mt-0.5">
                        {/* Related Order Chip */}
                        {notif.relatedOrder && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/admin-dashboard/orders", {
                                state: {
                                  highlightOrderUUID: notif.relatedOrder.uuid,
                                  orderId: notif.relatedOrder._id,
                                },
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] font-bold transition shadow-2xs group/order cursor-pointer"
                            title={language === "pl" ? "Przejdź do tego zamówienia" : "Go to order"}
                          >
                            <Package className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{t("notifications.relatedOrder")}:</span>
                            <span className="font-mono underline">
                              #{notif.relatedOrder.uuid?.substring(0, 8)}
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-60 group-hover/order:opacity-100 transition" />
                          </button>
                        )}

                        {/* Related Product Chip */}
                        {notif.relatedProduct && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold shadow-2xs">
                            <span className="text-slate-400 font-normal">{t("notifications.relatedProduct")}:</span>
                            <span>{notif.relatedProduct.name}</span>
                          </span>
                        )}

                        {/* Auto-delete counter for read notifications */}
                        {notif.isRead && daysLeft !== null && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50/70 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                            <Clock className="w-3 h-3" />
                            <span>
                              {daysLeft === 0
                                ? (language === "pl" ? "Auto-usunięcie dziś" : "Auto-deletes today")
                                : (language === "pl"
                                    ? `Auto-usunięcie za ${daysLeft} ${daysLeft === 1 ? "dzień" : "dni"}`
                                    : `Auto-deletes in ${daysLeft}d`)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                      {isUnread ? (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notif._id)}
                          disabled={actionLoadingId === notif._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                          title={t("notifications.markAsRead")}
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="hidden sm:inline">{t("notifications.markAsRead")}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkAsUnread(notif._id)}
                          disabled={actionLoadingId === notif._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                          title={t("notifications.markAsUnread")}
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                          <span className="hidden sm:inline">{t("notifications.markAsUnread")}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(notif._id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                        title={t("notifications.deleteSingle")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination and Counter Footer */}
          {totalItems > 0 && (
            <div className="p-4 bg-slate-50/80 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <div className="flex items-center gap-2">
                <span>
                  {language === "pl" ? "Łącznie powiadomień:" : "Total notifications:"}{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong>
                </span>
                <span className="opacity-40">•</span>
                <span>
                  {language === "pl" ? "Strona" : "Page"}{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{page}</strong>{" "}
                  {language === "pl" ? "z" : "of"}{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
                </span>
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={() => {
          if (confirmConfig.onConfirm) confirmConfig.onConfirm();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Notifications;
