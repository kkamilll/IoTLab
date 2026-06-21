import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

  doc.save(`IoTLab_Inventory_${new Date().toISOString().slice(0, 10)}.pdf`);
};
