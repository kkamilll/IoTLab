import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const savePDF = (doc, filename) => {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 200);
};

const fetchFontAsBase64 = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(",")[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateProductsPDF = async (filteredProducts, allColumns, hiddenColumns, t) => {
  // Landscape (poziomo)
  const doc = new jsPDF({ orientation: "landscape" });

  // Dynamic Font Load for Polish Characters
  let hasCustomFont = false;
  try {
    // Fetch Roboto-Regular TTF font supporting Latin-Extended (Polish letters)
    const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
    const fontBase64 = await fetchFontAsBase64(fontUrl);
    doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");
    hasCustomFont = true;
  } catch (err) {
    console.warn("Could not load Roboto font for PDF export, falling back to standard font:", err);
  }

  // Title & Date Header
  doc.setFontSize(14);
  const title = "IoTLab - Lista Obiektów / Products Inventory";
  doc.text(title, 14, 15);
  doc.setFontSize(8);
  const dateText = `Wygenerowano / Generated: ${new Date().toLocaleString("pl-PL")}`;
  doc.text(dateText, 14, 21);

  const visibleColumns = allColumns.filter(col => !hiddenColumns.includes(col));
  const headers = [
    "#",
    ...visibleColumns.map(col => {
      const colTrans = t(`products.columns.${col}`);
      return colTrans.startsWith("products.columns.") ? col : colTrans;
    })
  ];

  const rows = filteredProducts.map((p, i) =>
    visibleColumns.map(col => {
      switch (col) {
        case "total": return p.stockTotal ?? 0;
        case "for rent": return p.stockForRent ?? 0;
        case "categories": return p.categories?.map(c => c?.name ?? "").join(", ") ?? "";
        case "owner": return p.owner?.name ?? p.owner ?? "";
        case "description": return p.description ?? "";
        case "name": return p.name ?? "";
        default: return p[col] ?? p.extraFields?.[col] ?? "";
      }
    })
  );

  const numberedRows = rows.map((row, idx) => [idx + 1, ...row]);

  // Automatyczne dopasowanie kolumn i zawijanie tekstu
  const columnStyles = {};
  headers.forEach((h, i) => {
    if (h === "name") columnStyles[i] = { cellWidth: 50 };
    else if (h === "description") columnStyles[i] = { cellWidth: 70 };
    else if (h === "#") columnStyles[i] = { cellWidth: 10 };
    else columnStyles[i] = { cellWidth: 'auto' };
  });

  autoTable(doc, {
    head: [headers],
    body: numberedRows,
    startY: 25,
    styles: { 
      font: hasCustomFont ? "Roboto" : "Helvetica",
      fontSize: 8, 
      overflow: 'linebreak', 
      cellPadding: 3 
    },
    headStyles: { 
      fillColor: [79, 70, 229], // Brand Indigo theme
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Premium slate/gray alternative row shading
    },
    columnStyles,
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      // Footer with Page Numbers
      const str = `Strona ${data.pageNumber} z ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      const pageWidth = pageSize.width || pageSize.getWidth();
      doc.text(str, pageWidth - 30, pageHeight - 8);
    }
  });

  savePDF(doc, `IoTLab_Inventory_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateOrdersReportPDF = async (orders, t, language) => {
  const doc = new jsPDF({ orientation: "landscape" });

  let hasCustomFont = false;
  try {
    const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
    const fontBase64 = await fetchFontAsBase64(fontUrl);
    doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");
    hasCustomFont = true;
  } catch (err) {
    console.warn("Could not load Roboto font for PDF export, falling back to standard font:", err);
  }

  doc.setFontSize(14);
  const title = language === "pl" ? "IoTLab - Raport Zamówień / Orders Report" : "IoTLab - Orders Report";
  doc.text(title, 14, 15);
  doc.setFontSize(8);
  const dateText = `Wygenerowano / Generated: ${new Date().toLocaleString("pl-PL")}`;
  doc.text(dateText, 14, 21);

  const headers = language === "pl" 
    ? ["#", "ID", "Student", "Przedmiot (Opiekun)", "Od - Do", "Status"]
    : ["#", "ID", "Customer", "Item (Supervisor)", "From - To", "Status"];

  const rows = [];
  let index = 1;

  orders.forEach((order) => {
    const customerName = order.customer?.firstName && order.customer?.lastName 
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : order.customer?.email || "Unknown";

    const uuidShort = `#${order.uuid.substring(0, 6)}`;

    order.items.forEach((item) => {
      const ownerData = order.ownersData?.find(od => od.owner?.toString() === item.responsibleOwner?._id?.toString() || od.owner?.toString() === item.responsibleOwner?.toString());
      const ownerName = item.responsibleOwner?.name || "Unknown";
      
      const start = ownerData?.assignedStartDate ? new Date(ownerData.assignedStartDate) : new Date(order.requestedStartDate);
      const end = ownerData?.assignedEndDate ? new Date(ownerData.assignedEndDate) : new Date(order.requestedEndDate);
      const dateRange = `${start.toLocaleDateString("pl-PL")} - ${end.toLocaleDateString("pl-PL")}`;

      const itemName = item.product?.name || "Deleted Product";
      const statusTrans = t(`statuses.${item.status}`) || item.status;

      rows.push([
        index++,
        uuidShort,
        customerName,
        `${itemName} (${ownerName})`,
        dateRange,
        statusTrans
      ]);
    });
  });

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 25,
    styles: { 
      font: hasCustomFont ? "Roboto" : "Helvetica",
      fontSize: 8, 
      overflow: 'linebreak', 
      cellPadding: 3 
    },
    headStyles: { 
      fillColor: [79, 70, 229], // Brand Indigo theme
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 10, right: 10 },
    didDrawPage: (data) => {
      const str = `Strona ${data.pageNumber} z ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      const pageSize = doc.internal.pageSize;
      doc.text(str, pageSize.getWidth() - 30, pageSize.getHeight() - 8);
    }
  });

  savePDF(doc, `IoTLab_Orders_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};
