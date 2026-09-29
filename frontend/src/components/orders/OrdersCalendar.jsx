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

const locales = {
  "pl": pl,
  "en": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CustomToolbar = ({ label, onNavigate, onView, view, messages = {} }) => {
  const safeMessages = messages || {};
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
      {/* Title */}
      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white capitalize">
        {label}
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

const OrdersCalendar = ({ orders, onEventClick }) => {
  const { language } = useLanguage();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("month");

  const events = useMemo(() => {
    const calendarEvents = [];
    orders.forEach((order) => {
      const customerName = order.customer?.firstName && order.customer?.lastName
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : order.customer?.email || "Unknown";

      order.items.forEach((item) => {
        const rawOwnerId = item?.responsibleOwner?._id
          ? item.responsibleOwner._id.toString()
          : (item?.responsibleOwner ? item.responsibleOwner.toString() : null);

        let ownerData = order.ownersData?.find((od) =>
          rawOwnerId && od.owner?.toString() === rawOwnerId
        );

        if (!ownerData && order.ownersData?.length > 0) {
          ownerData = order.ownersData[0];
        }

        const group = {
          orderId: order._id,
          items: order.items.filter((i) => {
            const rId = i.responsibleOwner?._id
              ? i.responsibleOwner._id.toString()
              : (i?.responsibleOwner ? i.responsibleOwner.toString() : null);
            return rId === rawOwnerId;
          }),
          customerInfo: order.customer,
          owner: item.responsibleOwner || { name: language === "pl" ? "Nieznany/Usunięty opiekun" : "Unknown/Deleted owner" },
          ownerData,
          status: ownerData?.status || item?.status || "pending",
          dates: {
            requestedStartDate: order.requestedStartDate,
            requestedEndDate: order.requestedEndDate,
            assignedStartDate: ownerData?.assignedStartDate,
            assignedEndDate: ownerData?.assignedEndDate,
          },
          hasAssignedDates: !!(ownerData?.assignedStartDate && ownerData?.assignedEndDate),
        };

        const start = ownerData?.assignedStartDate ? new Date(ownerData.assignedStartDate) : new Date(order.requestedStartDate);
        const end = ownerData?.assignedEndDate ? new Date(ownerData.assignedEndDate) : new Date(order.requestedEndDate);
        
        calendarEvents.push({
          id: `${order._id}-${item._id}`,
          title: `${item.product?.name || 'Item'} (${customerName})`,
          start,
          end,
          status: item.status,
          resource: group,
        });
      });
    });
    return calendarEvents;
  }, [orders, language]);

  const eventPropGetter = (event) => {
    let backgroundColor = "#6366f1"; // indigo
    if (event.status === "pending") backgroundColor = "#eab308"; // yellow
    else if (event.status === "rented") backgroundColor = "#22c55e"; // green
    else if (event.status === "returned") backgroundColor = "#3b82f6"; // blue
    else if (event.status === "late") backgroundColor = "#ef4444"; // red
    else if (event.status === "rejected" || event.status === "cancelled") backgroundColor = "#94a3b8"; // slate

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
        padding: "3px 6px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
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
  }), [language]);

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6 overflow-x-auto min-w-full" style={{ height: "850px" }}>
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
          border-radius: 12px !important;
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
      `}</style>

      <div className="min-w-[800px] h-full">
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
          }}
          messages={calendarMessages}
          onSelectEvent={(event) => {
            if (onEventClick) onEventClick(event.resource);
          }}
        />
      </div>
    </div>
  );
};

export default OrdersCalendar;
