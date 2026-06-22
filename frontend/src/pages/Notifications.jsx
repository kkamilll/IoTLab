import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import apiClient from "../api/apiClient";
import PageHeader from "../components/layout/PageHeader";
import Pagination from "../components/layout/Pagination";
import Btn from "../components/layout/Btn";
import { Bell, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const Notifications = () => {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async (pageToFetch = 1) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/notifications?page=${pageToFetch}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setNotifications(data.notifications);
        setPage(data.page);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      addToast({ title: "Błąd pobierania historii powiadomień", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchNotifications(page);
    }
  }, [user, token, page]);

  const markAsRead = async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      addToast({ title: "Nie udało się oznaczyć powiadomienia", type: "error" });
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch(`/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      addToast({ title: "Oznaczono wszystkie jako przeczytane", type: "success" });
    } catch (err) {
      addToast({ title: "Błąd podczas oznaczania wszystkich", type: "error" });
    }
  };

  const deleteAll = async () => {
    if (!window.confirm("Czy na pewno chcesz usunąć całą historię?")) return;
    try {
      await apiClient.delete(`/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setTotalPages(1);
      addToast({ title: "Usunięto całą historię", type: "success" });
    } catch (err) {
      addToast({ title: "Błąd podczas usuwania historii", type: "error" });
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "ORDER_CREATED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "STATUS_CHANGED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "REMINDER_SENT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader title="Historia działań">
          <div className="flex gap-2">
            <Btn onClick={deleteAll} variant="danger" className="flex items-center gap-2">
              🗑️ Usuń historię
            </Btn>
            <Btn onClick={markAllAsRead} variant="outline" className="flex items-center gap-2">
              <Check size={16} />
              Oznacz jako przeczytane
            </Btn>
          </div>
        </PageHeader>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              Wczytywanie historii...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <Bell size={48} className="text-gray-300 mb-4" />
              <p className="text-lg font-medium">Brak powiadomień</p>
              <p className="text-sm">Twoja historia działań jest pusta.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <li
                  key={notif._id}
                  className={`p-5 flex gap-4 transition-colors hover:bg-gray-50 ${
                    !notif.isRead ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-full border ${getTypeStyle(notif.type)}`}>
                      <Bell size={18} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-base font-medium truncate ${!notif.isRead ? "text-gray-900" : "text-gray-700"}`}>
                        {notif.title}
                        {!notif.isRead && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Nowe
                          </span>
                        )}
                      </h4>
                      <span className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {format(new Date(notif.createdAt), "d MMM yyyy, HH:mm", { locale: pl })}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${!notif.isRead ? "text-gray-700" : "text-gray-500"}`}>
                      {notif.message}
                    </p>
                    {notif.relatedOrder && (
                      <p className="mt-2 text-xs text-gray-400">
                        Dotyczy zamówienia: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 shadow-sm" title={notif.relatedOrder.uuid}>#{notif.relatedOrder.uuid.substring(0, 8)}</span>
                      </p>
                    )}
                  </div>
                  {!notif.isRead && (
                    <div className="flex-shrink-0 flex items-center ml-4">
                      <button
                        onClick={() => markAsRead(notif._id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Oznacz jako przeczytane"
                      >
                        <Check size={18} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
