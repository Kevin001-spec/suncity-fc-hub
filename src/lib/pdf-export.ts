import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import suncityBadge from "@/assets/suncity-badge.png";

// Convert image to base64
async function getBase64FromUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
}

export interface TableData {
  head: string[][];
  body: string[][];
}

export async function generateBrandedPdf(
  title: string,
  tables: TableData[],
  fileName: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Add badge
  const badgeBase64 = await getBase64FromUrl(suncityBadge);
  if (badgeBase64) {
    doc.addImage(badgeBase64, "PNG", pageWidth / 2 - 12, 8, 24, 24);
  }

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SUNCITY FC", pageWidth / 2, 38, { align: "center" });

  // Motto
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Discipline • Unity • Victory", pageWidth / 2, 44, { align: "center" });

  // Generated date (top right)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`, pageWidth - 14, 12, { align: "right" });

  // Report title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 54, { align: "center" });

  let startY = 60;

  for (const table of tables) {
    autoTable(doc, {
      startY,
      head: table.head,
      body: table.body,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 40, 70], textColor: [255, 215, 0], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      margin: { left: 14, right: 14 },
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("© 2026 Suncity FC — Discipline • Unity • Victory", pageWidth / 2, pageHeight - 10, { align: "center" });

  doc.save(fileName);
}
