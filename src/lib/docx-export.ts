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

// ===== HELPER: Flexible smart table — always renders as a proper table =====
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

// ===== HELPER: Key-value paragraph for compact inline data =====
function kvParagraph(pairs: { label: string; value: string }[]): Paragraph {
  const runs: TextRun[] = [];
  pairs.forEach((p, i) => {
    if (i > 0) runs.push(new TextRun({ text: "  •  ", size: 16, font: "Calibri", color: "CCCCCC" }));
    runs.push(new TextRun({ text: `${p.label}: `, size: 16, font: "Calibri", color: "666666" }));
    runs.push(new TextRun({ text: p.value, bold: true, size: 16, font: "Calibri", color: "193769" }));
  });
  return new Paragraph({ children: runs, spacing: { after: 60 } });
}

export interface DocxTableData {
  head: string[][];
  body: string[][];
}

/**
 * generateBrandedDocx — Always uses proper tables for multi-column data.
 * Single-column data gets a section heading + bullet list.
 * The system flexibly analyzes data and arranges in neat tables.
 */
export async function generateBrandedDocx(
  title: string,
  tables: DocxTableData[],
  fileName: string,
  extraParagraphs?: Paragraph[]
) {
  const headerChildren = await createBrandedHeader(title);
  const bodyElements: (Paragraph | Table)[] = [];

  for (const tableData of tables) {
    // Single-column list data → section heading + list
    if (tableData.head.length > 0 && tableData.head[0].length === 1) {
      bodyElements.push(sectionHeading(tableData.head[0][0]));
      for (const row of tableData.body) {
        bodyElements.push(new Paragraph({
          children: [new TextRun({ text: `  • ${row[0]}`, size: 16, font: "Calibri" })],
          spacing: { after: 40 },
        }));
      }
      bodyElements.push(new Paragraph({ spacing: { after: 100 } }));
    }
    // Multi-column data → ALWAYS use proper table
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
  matchHistory?: { opponent: string; date: string; result: string; gameType: string; venue: string; performance?: any }[],
  awards?: { label: string; reason: string }[],
) {
  const headerChildren = await createBrandedHeader(`Player Profile — ${playerName}`);
  const profileBuffer = profilePicUrl ? await fetchImageAsBuffer(profilePicUrl) : null;
  const children: (Paragraph | Table)[] = [...headerChildren];

  // Profile picture — sized for mobile doc viewers
  if (profileBuffer) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: profileBuffer, transformation: { width: 120, height: 120 }, type: "png" })],
      spacing: { after: 80 },
    }));
  }

  // Player info
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: playerName, bold: true, size: 26, font: "Calibri", color: "193769" })],
      spacing: { after: 20 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `${playerId}  •  ${position}`, size: 18, font: "Calibri", color: "666666" })],
      spacing: { after: 120 },
    })
  );

  // 🏅 Achievements & Awards
  if (awards && awards.length > 0) {
    children.push(sectionHeading("🏅 Achievements & Awards"));
    for (const award of awards) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${award.label}`, bold: true, size: 16, font: "Calibri", color: "193769" }),
          new TextRun({ text: ` — ${award.reason}`, size: 15, font: "Calibri", color: "666666" }),
        ],
        spacing: { after: 40 },
      }));
    }
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // ⚽ Stats as table
  if (stats.length > 0) {
    children.push(sectionHeading("⚽ Performance Statistics"));
    const statsHead = [stats.map(s => s.label)];
    const statsBody = [stats.map(s => String(s.value))];
    children.push(smartTable(statsHead, statsBody));
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // 📅 Attendance as table
  if (attendanceDays.length > 0) {
    children.push(sectionHeading("📅 Training Attendance"));
    const attHead = [attendanceDays.map(a => a.day)];
    const attBody = [attendanceDays.map(a => {
      return a.status === "present" ? "✅" : a.status === "excused" ? "🔵" : a.status === "no_activity" ? "➖" : "⬜";
    })];
    children.push(smartTable(attHead, attBody));
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // 💰 Contributions as table
  if (contributions.length > 0) {
    children.push(sectionHeading("💰 Monthly Contributions"));
    const contribHead = [contributions.map(c => c.month)];
    const contribBody = [contributions.map(c => c.status === "paid" ? "✅" : "⬜")];
    children.push(smartTable(contribHead, contribBody));
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // 🏟️ Match History with performance details
  if (matchHistory && matchHistory.length > 0) {
    children.push(sectionHeading("🏟️ Match History"));
    const head = [["Opponent", "Date", "Result", "Type", "Venue"]];
    const body = matchHistory.map(m => [m.opponent, m.date, m.result, m.gameType, m.venue]);
    children.push(smartTable(head, body));
    children.push(new Paragraph({ spacing: { after: 60 } }));

    // Match-by-match performance comparison
    const matchesWithPerf = matchHistory.filter(m => m.performance);
    if (matchesWithPerf.length > 0) {
      children.push(sectionHeading("📊 Match Performance Breakdown"));
      for (const match of matchesWithPerf) {
        const p = match.performance;
        const perfStats = [
          p.goals > 0 && `⚽ ${p.goals} Goals`,
          p.assists > 0 && `🅰️ ${p.assists} Assists`,
          p.tackles > 0 && `🛡️ ${p.tackles} Tackles`,
          p.saves > 0 && `🧤 ${p.saves} Saves`,
          p.interceptions > 0 && `🔄 ${p.interceptions} Interceptions`,
          p.aerial_duels > 0 && `✈️ ${p.aerial_duels} Aerial Duels`,
          p.direct_shots > 0 && `🎯 ${p.direct_shots} Shots on Target`,
          p.clean_sheet && `🧹 Clean Sheet`,
          p.is_potm && `🏆 PLAYER OF THE MATCH`,
        ].filter(Boolean);
        
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `vs ${match.opponent} (${match.date})`, bold: true, size: 16, font: "Calibri", color: "193769" }),
            new TextRun({ text: ` — ${match.result}`, size: 15, font: "Calibri", color: "666666" }),
          ],
          spacing: { before: 40, after: 20 },
        }));
        children.push(new Paragraph({
          children: [new TextRun({ text: perfStats.join("  •  ") || "No stats recorded", size: 15, font: "Calibri", color: perfStats.length > 0 ? "333333" : "999999" })],
          spacing: { after: 40 },
        }));
      }
      
      // Best/Lowest match comparison
      if (matchesWithPerf.length >= 2) {
        const scored = matchesWithPerf.map(m => ({
          opponent: m.opponent,
          total: (m.performance.goals || 0) + (m.performance.assists || 0) + (m.performance.tackles || 0) + (m.performance.saves || 0),
        }));
        const best = scored.reduce((a, b) => a.total > b.total ? a : b);
        const lowest = scored.reduce((a, b) => a.total < b.total ? a : b);
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `🔥 Best Performance: `, bold: true, size: 16, font: "Calibri", color: "193769" }),
            new TextRun({ text: `vs ${best.opponent} (${best.total} pts)`, size: 15, font: "Calibri" }),
            new TextRun({ text: `  •  `, size: 15, font: "Calibri", color: "CCCCCC" }),
            new TextRun({ text: `📉 Lowest: `, bold: true, size: 16, font: "Calibri", color: "CC3333" }),
            new TextRun({ text: `vs ${lowest.opponent} (${lowest.total} pts)`, size: 15, font: "Calibri" }),
          ],
          spacing: { before: 40, after: 80 },
        }));
      }
    }
    children.push(new Paragraph({ spacing: { after: 80 } }));
  } else if (opponents.length > 0) {
    children.push(sectionHeading("🏟️ Opponents Played Against"));
    const head = [["Opponent", "Date", "Result"]];
    const body = opponents.map(o => [o.opponent, o.date, o.result]);
    children.push(smartTable(head, body));
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // 📋 Weekly logs as tables
  if (weeklyLogs && weeklyLogs.length > 0) {
    children.push(sectionHeading("📋 Weekly Activity Log"));
    for (const log of weeklyLogs) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `📅 Week of ${log.weekStart}`, bold: true, size: 17, font: "Calibri", color: "193769" })],
        spacing: { before: 60, after: 40 },
      }));
      const nonZero = log.stats.filter(s => s.value > 0);
      if (nonZero.length > 0) {
        const head = [nonZero.map(s => s.label)];
        const body = [nonZero.map(s => String(s.value))];
        children.push(smartTable(head, body));
      } else {
        children.push(new Paragraph({
          children: [new TextRun({ text: "➖ No activity recorded", size: 15, font: "Calibri", color: "999999", italics: true })],
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
