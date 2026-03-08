import {
  Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
  WidthType, AlignmentType, BorderStyle, ImageRun, HeadingLevel,
  TableLayoutType,
} from "docx";
import { saveAs } from "file-saver";
import suncityBadge from "@/assets/suncity-badge.png";

async function fetchImageAsBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const cleanUrl = url.split("?")[0];
    const response = await fetch(cleanUrl);
    if (!response.ok) {
      const retryResponse = await fetch(url);
      if (!retryResponse.ok) return null;
      const blob = await retryResponse.blob();
      return await blob.arrayBuffer();
    }
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch {
    return null;
  }
}

const BORDER_LIGHT = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
};

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

// ===== HELPER: Branded header =====
async function createBrandedHeader(title: string): Promise<Paragraph[]> {
  const badgeBuffer = await fetchImageAsBuffer(suncityBadge);
  const children: Paragraph[] = [];

  if (badgeBuffer) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: badgeBuffer, transformation: { width: 70, height: 70 }, type: "png" })],
      spacing: { after: 80 },
    }));
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "SUNCITY FC", bold: true, size: 30, font: "Calibri", color: "193769" })],
      spacing: { after: 20 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Discipline • Unity • Victory", italics: true, size: 18, font: "Calibri", color: "666666" })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({
        text: `${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
        size: 16, font: "Calibri", color: "999999",
      })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: title, bold: true, size: 24, font: "Calibri", color: "193769" })],
      spacing: { after: 120 },
    })
  );
  return children;
}

// ===== HELPER: Footer =====
function createFooter(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "© 2026 Suncity FC — Discipline • Unity • Victory", italics: true, size: 14, font: "Calibri", color: "AAAAAA" })],
    spacing: { before: 300 },
  });
}

// ===== HELPER: Section heading =====
function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, font: "Calibri", color: "193769" })],
    spacing: { before: 200, after: 80 },
  });
}

// ===== HELPER: Key-value paragraph =====
function kvParagraph(pairs: { label: string; value: string }[]): Paragraph {
  const runs: TextRun[] = [];
  pairs.forEach((p, i) => {
    if (i > 0) runs.push(new TextRun({ text: "  •  ", size: 16, font: "Calibri", color: "CCCCCC" }));
    runs.push(new TextRun({ text: `${p.label}: `, size: 16, font: "Calibri", color: "666666" }));
    runs.push(new TextRun({ text: p.value, bold: true, size: 16, font: "Calibri", color: "193769" }));
  });
  return new Paragraph({ children: runs, spacing: { after: 60 } });
}

// ===== HELPER: Inline list =====
function inlineList(items: string[], separator = "  |  "): Paragraph {
  const runs: TextRun[] = [];
  items.forEach((item, i) => {
    if (i > 0) runs.push(new TextRun({ text: separator, size: 16, font: "Calibri", color: "CCCCCC" }));
    runs.push(new TextRun({ text: item, size: 16, font: "Calibri" }));
  });
  return new Paragraph({ children: runs, spacing: { after: 60 } });
}

// ===== HELPER: Smart table (only when truly tabular) =====
function smartTable(head: string[][], body: string[][]): Table {
  const rows: TableRow[] = [];
  for (const headRow of head) {
    rows.push(new TableRow({
      children: headRow.map(cell =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cell, bold: true, size: 16, font: "Calibri", color: "FFFFFF" })],
            alignment: AlignmentType.CENTER,
          })],
          shading: { fill: "193769" },
          borders: BORDER_LIGHT,
          width: { size: Math.floor(100 / headRow.length), type: WidthType.PERCENTAGE },
        })
      ),
    }));
  }
  body.forEach((bodyRow, rowIdx) => {
    rows.push(new TableRow({
      children: bodyRow.map(cell =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cell, size: 15, font: "Calibri" })],
          })],
          shading: rowIdx % 2 === 1 ? { fill: "F7F8FC" } : undefined,
          borders: BORDER_LIGHT,
          width: { size: Math.floor(100 / bodyRow.length), type: WidthType.PERCENTAGE },
        })
      ),
    }));
  });
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.AUTOFIT });
}

export interface DocxTableData {
  head: string[][];
  body: string[][];
}

export async function generateBrandedDocx(
  title: string,
  tables: DocxTableData[],
  fileName: string,
  extraParagraphs?: Paragraph[]
) {
  const headerChildren = await createBrandedHeader(title);
  const bodyElements: (Paragraph | Table)[] = [];

  for (const tableData of tables) {
    // If single-column data, use paragraph list instead of table
    if (tableData.head.length > 0 && tableData.head[0].length === 1) {
      bodyElements.push(sectionHeading(tableData.head[0][0]));
      for (const row of tableData.body) {
        bodyElements.push(new Paragraph({
          children: [new TextRun({ text: `  ${row[0]}`, size: 16, font: "Calibri" })],
          spacing: { after: 40 },
        }));
      }
      bodyElements.push(new Paragraph({ spacing: { after: 100 } }));
    }
    // Two-column key-value data → use styled paragraphs
    else if (tableData.head.length > 0 && tableData.head[0].length === 2 && tableData.body.length <= 12) {
      if (tableData.head[0][0]) {
        bodyElements.push(sectionHeading(tableData.head[0][0]));
      }
      for (const row of tableData.body) {
        bodyElements.push(kvParagraph([{ label: row[0], value: row[1] }]));
      }
      bodyElements.push(new Paragraph({ spacing: { after: 100 } }));
    }
    // Multi-column tabular data → use smart table
    else if (tableData.body.length > 0) {
      bodyElements.push(smartTable(tableData.head, tableData.body));
      bodyElements.push(new Paragraph({ spacing: { after: 120 } }));
    }
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } } },
      children: [
        ...headerChildren,
        ...bodyElements,
        ...(extraParagraphs || []),
        createFooter(),
      ],
    }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, fileName);
}

// ===== PLAYER PROFILE EXPORT =====
export async function generatePlayerProfileDocx(
  playerName: string,
  playerId: string,
  position: string,
  stats: { label: string; value: string | number }[],
  attendanceDays: { day: string; status: string }[],
  opponents: { opponent: string; date: string; result: string }[],
  contributions: { month: string; status: string }[],
  profilePicUrl?: string,
  weeklyLogs?: { weekStart: string; stats: { label: string; value: number }[] }[],
  matchHistory?: { opponent: string; date: string; result: string; gameType: string; venue: string }[]
) {
  const headerChildren = await createBrandedHeader(`Player Profile — ${playerName}`);
  const profileBuffer = profilePicUrl ? await fetchImageAsBuffer(profilePicUrl) : null;
  const children: (Paragraph | Table)[] = [...headerChildren];

  // Profile picture
  if (profileBuffer) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: profileBuffer, transformation: { width: 90, height: 90 }, type: "png" })],
      spacing: { after: 80 },
    }));
  }

  // Player info as styled paragraph
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: playerName, bold: true, size: 26, font: "Calibri", color: "193769" }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `${playerId}  •  ${position}`, size: 18, font: "Calibri", color: "666666" }),
      ],
      spacing: { after: 120 },
    })
  );

  // Stats as inline key-value pairs (grouped in rows of 3-4)
  if (stats.length > 0) {
    children.push(sectionHeading("Performance Statistics"));
    const statPairs = stats.map(s => ({ label: s.label, value: String(s.value) }));
    // Group into rows of 3
    for (let i = 0; i < statPairs.length; i += 3) {
      children.push(kvParagraph(statPairs.slice(i, i + 3)));
    }
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // Attendance as inline icons
  if (attendanceDays.length > 0) {
    children.push(sectionHeading("Training Attendance"));
    const attItems = attendanceDays.map(a => {
      const icon = a.status === "present" ? "✅" : a.status === "excused" ? "🔵" : a.status === "no_activity" ? "➖" : "⬜";
      return `${a.day}: ${icon}`;
    });
    children.push(inlineList(attItems, "   "));
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // Contributions as compact inline
  if (contributions.length > 0) {
    children.push(sectionHeading("Monthly Contributions"));
    const contribItems = contributions.map(c => {
      const icon = c.status === "paid" ? "✅" : "⬜";
      return `${c.month}: ${icon}`;
    });
    children.push(inlineList(contribItems, "   "));
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // Match History (comprehensive)
  if (matchHistory && matchHistory.length > 0) {
    children.push(sectionHeading("Match History"));
    const head = [["Opponent", "Date", "Result", "Type", "Venue"]];
    const body = matchHistory.map(m => [m.opponent, m.date, m.result, m.gameType, m.venue]);
    children.push(smartTable(head, body));
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }
  // Legacy opponents if no match history
  else if (opponents.length > 0) {
    children.push(sectionHeading("Opponents Played Against"));
    const head = [["Opponent", "Date", "Result"]];
    const body = opponents.map(o => [o.opponent, o.date, o.result]);
    children.push(smartTable(head, body));
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // Weekly logs as styled sections (not rigid tables)
  if (weeklyLogs && weeklyLogs.length > 0) {
    children.push(sectionHeading("Weekly Activity Log"));
    for (const log of weeklyLogs) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Week of ${log.weekStart}`, bold: true, size: 17, font: "Calibri", color: "193769" })],
        spacing: { before: 60, after: 40 },
      }));
      const nonZero = log.stats.filter(s => s.value > 0);
      if (nonZero.length > 0) {
        const pairs = nonZero.map(s => ({ label: s.label, value: String(s.value) }));
        for (let i = 0; i < pairs.length; i += 4) {
          children.push(kvParagraph(pairs.slice(i, i + 4)));
        }
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: "No activity recorded", size: 15, font: "Calibri", color: "999999", italics: true })],
          spacing: { after: 40 },
        }));
      }
    }
  }

  children.push(createFooter());

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } } },
      children,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `suncity_fc_${playerName.replace(/\s+/g, "_").toLowerCase()}_profile.docx`);
}
