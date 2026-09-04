import React, { useMemo } from "react";
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

const OrdersCalendar = ({ orders, onEventClick }) => {
  const { language } = useLanguage();

  const events = useMemo(() => {
    const calendarEvents = [];
    orders.forEach((order) => {
      const customerName = order.customer?.firstName && order.customer?.lastName
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : order.customer?.email || "Unknown";

      order.items.forEach((item) => {
        const ownerId = item.responsibleOwner?._id?.toString() || "unknown";
        const ownerData = order.ownersData?.find(od => od.owner?.toString() === ownerId);

        const group = {
          orderId: order._id,
          items: order.items.filter(i => (i.responsibleOwner?._id?.toString() || "unknown") === ownerId),
          customerInfo: order.customer,
          owner: item.responsibleOwner || { name: language === "pl" ? "Nieznany opiekun" : "Unknown owner" },
          ownerData,
          status: ownerData?.status,
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
  }, [orders]);

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
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "11px",
        padding: "2px 4px",
      },
    };
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-6 overflow-x-auto min-w-full" style={{ height: "850px" }}>
      <div className="min-w-[800px] h-full">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture={language === "pl" ? "pl" : "en"}
        style={{ height: "100%", color: "inherit" }}
        eventPropGetter={eventPropGetter}
        views={["month", "week", "day"]}
        popup={true}
        messages={language === "pl" ? {
          allDay: "Cały dzień",
          previous: "Poprzedni",
          next: "Następny",
          today: "Dzisiaj",
          month: "Miesiąc",
          week: "Tydzień",
          day: "Dzień",
          agenda: "Plan",
          date: "Data",
          time: "Czas",
          event: "Wydarzenie",
          noEventsInRange: "Brak zamówień w tym okresie.",
        } : undefined}
        onSelectEvent={(event) => {
          if (onEventClick) onEventClick(event.resource);
        }}
      />
      </div>
    </div>
  );
};

export default OrdersCalendar;
