import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateProductsPDF = (filteredProducts, allColumns, hiddenColumns) => {
  if (filteredProducts.length === 0) {
    alert("No products to export.");
    return;
  }

  // Landscape (poziomo)
  const doc = new jsPDF({ orientation: "landscape" });
  doc.text("Product List", 14, 15);

  const visibleColumns = allColumns.filter(col => !hiddenColumns.includes(col));
  const headers = ["#", ...visibleColumns];

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
    startY: 20,
    styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 2 },
    headStyles: { fillColor: [22, 160, 133] },
    columnStyles,
    margin: { left: 10, right: 10 },
  });

  doc.save("products.pdf");
};
