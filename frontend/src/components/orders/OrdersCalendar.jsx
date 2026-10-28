import React, { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import pl from "date-fns/locale/pl";
import enUS from "date-fns/locale/en-US";
import { useLanguage } from "../../context/LanguageContext";
import { StatusBadge } from "./OrderGroupCard";
import Btn from "../layout/Btn";
import {
  Calendar as CalendarIcon,
  User,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  Sliders,
  Hash,
  Phone,
  Mail,
  BookOpen,
  Info,
} from "lucide-react";

const API_BASE = `${import.meta.env.VITE_API_IP || ""}${import.meta.env.VITE_API_PORT || ""}${import.meta.env.VITE_API_POSTFIX || ""}`;

const locales = {
  pl,
  en: enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const STATUS_FILTER_CONFIG = [
  { key: "all", labelPl: "Wszystkie", labelEn: "All", dotColor: null },
  { key: "pending", labelPl: "Oczekujące", labelEn: "Pending", dotColor: "bg-amber-500" },
  { key: "prepared", labelPl: "Przygotowane", labelEn: "Prepared", dotColor: "bg-purple-500" },
  { key: "rented", labelPl: "Wypożyczone", labelEn: "Rented", dotColor: "bg-emerald-500" },
  { key: "late", labelPl: "Po terminie", labelEn: "Late", dotColor: "bg-red-500" },
  { key: "returned", labelPl: "Zwrócone", labelEn: "Returned", dotColor: "bg-blue-500" },
];

const CustomToolbar = ({ label, onNavigate, onView, view, messages = {} }) => {
  const safeMessages = messages || {};
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
      {/* Title */}
      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white capitalize flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-indigo-500" />
        <span>{label}</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => onNavigate("PREV")}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition shadow-2xs cursor-pointer"
          >
            {safeMessages.previous || "Poprzedni"}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("TODAY")}
            className="px-3 py-1.5 text-xs font-extrabold text-indigo-650 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-lg transition shadow-2xs cursor-pointer"
          >
            {safeMessages.today || "Dzisiaj"}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("NEXT")}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition shadow-2xs cursor-pointer"
          >
            {safeMessages.next || "Następny"}
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
          {["month", "week", "day"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onView(v)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer capitalize ${
                view === v
                  ? "bg-indigo-600 text-white shadow-2xs font-extrabold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {safeMessages[v] || v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const CustomEvent = ({ event }) => {
  const isLate = event.status === "late";

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold text-white truncate rounded-md shadow-2xs select-none"
      title={`Zamówienie #${event.shortId}\nStudent: ${event.customerName}\nPrzedmioty: ${event.itemSummary} (${event.totalQty} szt.)\nStatus: ${event.status}`}
    >
      {isLate && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
      )}
      <span className="font-mono text-[10px] font-extrabold opacity-95 shrink-0">#{event.shortId}</span>
      <span className="truncate flex-1 font-semibold">{event.customerName}</span>
      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/25 shrink-0">
        {event.totalQty} szt.
      </span>
    </div>
  );
};

const OrdersCalendar = ({ orders, onEventClick }) => {
  const { language } = useLanguage();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Group items by order & supervisor group (1 event per supervisor order-group)
  const rawEvents = useMemo(() => {
    const calendarEvents = [];

    orders.forEach((order) => {
      const customer = order.customer;
      const customerName = customer?.firstName && customer?.lastName
        ? `${customer.firstName} ${customer.lastName}`
        : customer?.email || (language === "pl" ? "Nieznany student" : "Unknown student");

      const shortId = (order.uuid ? order.uuid.slice(0, 8) : order._id.slice(-8)).toUpperCase();

      // Group items in this order by supervisor
      const itemsByOwner = order.items.reduce((acc, item) => {
        const rawOwnerId = item?.responsibleOwner?._id
          ? item.responsibleOwner._id.toString()
          : (item?.responsibleOwner ? item.responsibleOwner.toString() : "unknown");

        if (!acc[rawOwnerId]) {
          acc[rawOwnerId] = [];
        }
        acc[rawOwnerId].push(item);
        return acc;
      }, {});

      Object.entries(itemsByOwner).forEach(([rawOwnerId, groupItems]) => {
        let ownerData = order.ownersData?.find((od) =>
          rawOwnerId !== "unknown" && od.owner?.toString() === rawOwnerId
        );
        if (!ownerData && order.ownersData?.length > 0) {
          ownerData = order.ownersData[0];
        }

        const firstItem = groupItems[0];
        const supervisor = firstItem?.responsibleOwner || { name: language === "pl" ? "Opiekun labu" : "Lab supervisor" };

        // Determine status
        let groupStatus = ownerData?.status || "pending";
        if (groupItems.some((i) => i.status === "late")) groupStatus = "late";
        else if (groupItems.every((i) => i.status === "returned")) groupStatus = "returned";
        else if (groupItems.some((i) => i.status === "rented")) groupStatus = "rented";
        else if (groupItems.some((i) => i.status === "prepared")) groupStatus = "prepared";
        else if (groupItems.some((i) => i.status === "approved")) groupStatus = "approved";

        const totalQty = groupItems.reduce((acc, i) => acc + (i.requestedQuantity || 1), 0);
        const itemNames = groupItems.map((i) => i.product?.name).filter(Boolean);
        const itemSummary = itemNames.length > 2
          ? `${itemNames.slice(0, 2).join(", ")} +${itemNames.length - 2}`
          : itemNames.join(", ");

        const start = ownerData?.assignedStartDate
          ? new Date(ownerData.assignedStartDate)
          : new Date(order.requestedStartDate);
        const end = ownerData?.assignedEndDate
          ? new Date(ownerData.assignedEndDate)
          : new Date(order.requestedEndDate);

        const group = {
          orderId: order._id,
          orderUuid: order.uuid,
          items: groupItems,
          customerInfo: order.customer,
          owner: supervisor,
          ownerData,
          status: groupStatus,
          dates: {
            requestedStartDate: order.requestedStartDate,
            requestedEndDate: order.requestedEndDate,
            assignedStartDate: ownerData?.assignedStartDate,
            assignedEndDate: ownerData?.assignedEndDate,
          },
          hasAssignedDates: !!(ownerData?.assignedStartDate && ownerData?.assignedEndDate),
        };

        calendarEvents.push({
          id: `${order._id}-${rawOwnerId}`,
          orderId: order._id,
          shortId,
          title: `#${shortId} • ${customerName} (${totalQty} szt.)`,
          customerName,
          customer,
          itemSummary,
          totalQty,
          items: groupItems,
          supervisor,
          start,
          end,
          status: groupStatus,
          resource: group,
        });
      });
    });

    return calendarEvents;
  }, [orders, language]);

  // Filter events according to selected status filter
  const events = useMemo(() => {
    if (statusFilter === "all") return rawEvents;
    return rawEvents.filter((e) => e.status === statusFilter);
  }, [rawEvents, statusFilter]);

  // Counts for each status filter pill
  const statusCounts = useMemo(() => {
    const counts = { all: rawEvents.length, pending: 0, prepared: 0, rented: 0, late: 0, returned: 0 };
    rawEvents.forEach((e) => {
      if (counts[e.status] !== undefined) counts[e.status]++;
    });
    return counts;
  }, [rawEvents]);

  const eventPropGetter = (event) => {
    let backgroundColor = "#6366f1"; // indigo
    if (event.status === "pending") backgroundColor = "#d97706"; // amber-600
    else if (event.status === "approved") backgroundColor = "#65a30d"; // lime-600
    else if (event.status === "prepared") backgroundColor = "#7c3aed"; // violet-600
    else if (event.status === "rented") backgroundColor = "#16a34a"; // green-600
    else if (event.status === "returned") backgroundColor = "#2563eb"; // blue-600
    else if (event.status === "late") backgroundColor = "#dc2626"; // red-600
    else if (event.status === "rejected" || event.status === "cancelled") backgroundColor = "#64748b"; // slate-500

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 0.95,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "11px",
        fontWeight: "700",
        padding: "2px 4px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
      },
    };
  };

  const calendarMessages = useMemo(() => ({
    allDay: language === "pl" ? "Cały dzień" : "All Day",
    previous: language === "pl" ? "Poprzedni" : "Previous",
    next: language === "pl" ? "Następny" : "Next",
    today: language === "pl" ? "Dzisiaj" : "Today",
    month: language === "pl" ? "Miesiąc" : "Month",
    week: language === "pl" ? "Tydzień" : "Week",
    day: language === "pl" ? "Dzień" : "Day",
    agenda: language === "pl" ? "Plan" : "Agenda",
    date: language === "pl" ? "Data" : "Date",
    time: language === "pl" ? "Czas" : "Time",
    event: language === "pl" ? "Wydarzenie" : "Event",
    noEventsInRange: language === "pl" ? "Brak zamówień w tym okresie." : "No orders in this period.",
    showMore: (total) => (language === "pl" ? `+ ${total} więcej` : `+ ${total} more`),
  }), [language]);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6 overflow-hidden">
      <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-header {
          padding: 8px 4px !important;
          font-weight: 800 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid rgba(0,0,0,0.08) !important;
        }
        .dark .rbc-header {
          color: #94a3b8 !important;
          border-bottom-color: rgba(255,255,255,0.1) !important;
        }
        .rbc-month-view, .rbc-time-view {
          border-radius: 14px !important;
          border: 1px solid #e2e8f0 !important;
          overflow: hidden !important;
        }
        .dark .rbc-month-view, .dark .rbc-time-view {
          border-color: #1e293b !important;
        }
        .rbc-month-row + .rbc-month-row {
          border-top: 1px solid #e2e8f0 !important;
        }
        .dark .rbc-month-row + .rbc-month-row {
          border-top-color: #1e293b !important;
        }
        .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid #f1f5f9 !important;
        }
        .dark .rbc-day-bg + .rbc-day-bg {
          border-left-color: #1e293b !important;
        }
        .rbc-off-range-bg {
          background-color: rgba(241, 245, 249, 0.4) !important;
        }
        .dark .rbc-off-range-bg {
          background-color: rgba(15, 23, 42, 0.6) !important;
        }
        .rbc-today {
          background-color: rgba(99, 102, 241, 0.06) !important;
        }
        .dark .rbc-today {
          background-color: rgba(99, 102, 241, 0.12) !important;
        }
        .rbc-date-cell {
          padding: 4px 8px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
        }
        .dark .rbc-date-cell {
          color: #cbd5e1 !important;
        }
        .dark .rbc-off-range .rbc-button-link {
          color: #475569 !important;
        }
        /* Show more button (+X więcej) */
        .rbc-show-more {
          background-color: rgba(99, 102, 241, 0.1) !important;
          color: #4f46e5 !important;
          border-radius: 6px !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          padding: 2px 6px !important;
          margin-top: 2px !important;
          cursor: pointer !important;
          transition: all 0.15s ease !important;
        }
        .dark .rbc-show-more {
          background-color: rgba(99, 102, 241, 0.2) !important;
          color: #a5b4fc !important;
        }
        .rbc-show-more:hover {
          background-color: #4f46e5 !important;
          color: white !important;
        }
        /* Overlay popup for days with overflowing events */
        .rbc-overlay {
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 14px !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1) !important;
          padding: 10px !important;
          z-index: 100 !important;
          max-width: 320px !important;
        }
        .dark .rbc-overlay {
          background-color: #0f172a !important;
          border-color: #1e293b !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5) !important;
        }
        .rbc-overlay-header {
          font-size: 11px !important;
          font-weight: 800 !important;
          color: #0f172a !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding-bottom: 6px !important;
          margin-bottom: 6px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        .dark .rbc-overlay-header {
          color: #f8fafc !important;
          border-bottom-color: #1e293b !important;
        }
        .rbc-event {
          border-radius: 6px !important;
          padding: 1px 3px !important;
          margin-bottom: 2px !important;
        }
      `}</style>

      {/* Status Filter Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTER_CONFIG.map(({ key, labelPl, labelEn, dotColor }) => {
            const active = statusFilter === key;
            const count = statusCounts[key] ?? 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-2xs ${
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                }`}
              >
                {dotColor && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
                <span>{language === "pl" ? labelPl : labelEn}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  active ? "bg-white/20 dark:bg-slate-900/20" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Legend */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> {language === "pl" ? "Oczekujące" : "Pending"}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> {language === "pl" ? "Przygotowane" : "Prepared"}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {language === "pl" ? "Wypożyczone" : "Rented"}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> {language === "pl" ? "Po terminie" : "Late"}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> {language === "pl" ? "Zwrócone" : "Returned"}</span>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="w-full" style={{ height: "780px" }}>
        <Calendar
          localizer={localizer}
          events={events}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          view={view}
          onView={(newView) => setView(newView)}
          startAccessor="start"
          endAccessor="end"
          culture={language === "pl" ? "pl" : "en"}
          style={{ height: "100%", color: "inherit" }}
          eventPropGetter={eventPropGetter}
          views={["month", "week", "day"]}
          popup={true}
          components={{
            toolbar: (props) => <CustomToolbar {...props} messages={calendarMessages} />,
            event: CustomEvent,
          }}
          messages={calendarMessages}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
          }}
        />
      </div>

      {/* Quick-View Modal for Selected Calendar Event */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden p-6 flex flex-col gap-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  #{selectedEvent.shortId}
                </span>
                <StatusBadge status={selectedEvent.status} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student & Dates Information */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {language === "pl" ? "Student" : "Student"}
                </p>
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {selectedEvent.customerName}
                </p>
                {selectedEvent.customer?.index && (
                  <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    {language === "pl" ? "Nr albumu: " : "Index: "}{selectedEvent.customer.index}
                  </p>
                )}
                {selectedEvent.customer?.email && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {selectedEvent.customer.email}
                  </p>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {language === "pl" ? "Termin wypożyczenia" : "Rental Period"}
                </p>
                <p className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                  {format(selectedEvent.start, "dd.MM.yyyy")} → {format(selectedEvent.end, "dd.MM.yyyy")}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {language === "pl" ? "Opiekun: " : "Supervisor: "}<span className="font-semibold text-slate-700 dark:text-slate-300">{selectedEvent.supervisor?.name || "—"}</span>
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>{language === "pl" ? "Sprzęt w zamówieniu" : "Equipment in Order"}</span>
                <span>{selectedEvent.totalQty} {language === "pl" ? "szt." : "pcs"}</span>
              </p>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950">
                {selectedEvent.items.map((item, idx) => {
                  const imgSrc = item?.product?.image
                    ? (item.product.image.startsWith("http")
                        ? item.product.image
                        : `${API_BASE}/uploads/products/${item.product.image}`)
                    : null;

                  return (
                    <div key={item._id || idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {imgSrc ? (
                            <img src={imgSrc} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          ) : (
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item?.product?.name || "Produkt"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {item.assignedQuantity ?? item.requestedQuantity ?? 1} szt.
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {language === "pl" ? "Zamknij" : "Close"}
              </button>
              {onEventClick && (
                <Btn
                  onClick={() => {
                    const group = selectedEvent.resource;
                    setSelectedEvent(null);
                    onEventClick(group);
                  }}
                  variant="primary"
                  className="px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{language === "pl" ? "Procesuj w panelu" : "Process order"}</span>
                </Btn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersCalendar;
