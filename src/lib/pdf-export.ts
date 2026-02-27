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

// Sanitize emoji characters that jsPDF cannot render
function sanitizeForPdf(text: string): string {
  return text
    .replace(/✅/g, "[PAID]")
    .replace(/❌/g, "[X]")
    .replace(/🔵/g, "[E]")
    .replace(/➖/g, "[-]")
    .replace(/⏳/g, "[Pending]")
    .replace(/⚽/g, "[G]")
    .replace(/🏆/g, "[T]")
    .replace(/📅/g, "[D]")
    .replace(/📊/g, "[S]")
    .replace(/⭐/g, "[*]")
    .replace(/⚠️/g, "[!]")
    .replace(/🟢/g, "[OK]")
    .replace(/🔐/g, "[L]")
    .replace(/🏟️/g, "")
    .replace(/🏋️/g, "")
    .replace(/📸/g, "")
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "");
}

function sanitizeTable(data: string[][]): string[][] {
  return data.map(row => row.map(cell => sanitizeForPdf(cell)));
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
  doc.text("Discipline - Unity - Victory", pageWidth / 2, 44, { align: "center" });

  // Generated date (top right)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`, pageWidth - 14, 12, { align: "right" });

  // Report title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(sanitizeForPdf(title), pageWidth / 2, 54, { align: "center" });

  let startY = 60;

  for (const table of tables) {
    const sanitizedHead = sanitizeTable(table.head);
    const sanitizedBody = sanitizeTable(table.body);

    autoTable(doc, {
      startY,
      head: sanitizedHead.length > 0 ? sanitizedHead : undefined,
      body: sanitizedBody,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2, font: "helvetica" },
      headStyles: { fillColor: [25, 55, 105], textColor: [255, 215, 0], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        // Color code status cells
        const cellText = data.cell.text.join("");
        if (cellText === "[PAID]" || cellText === "Yes") {
          data.cell.styles.textColor = [34, 139, 34];
          data.cell.styles.fontStyle = "bold";
        } else if (cellText === "[X]" || cellText === "No") {
          data.cell.styles.textColor = [220, 53, 69];
        } else if (cellText === "[E]") {
          data.cell.styles.textColor = [59, 130, 246];
        }
      },
    });
    startY = (doc as any).lastAutoTable.finalY + 10;

    // Add page break if needed
    if (startY > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      startY = 20;
    }
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("(c) 2026 Suncity FC - Discipline - Unity - Victory", pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: "right" });
  }

  doc.save(fileName);
}
