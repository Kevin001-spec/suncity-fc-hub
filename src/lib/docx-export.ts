import {
  Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
  WidthType, AlignmentType, BorderStyle, ImageRun, HeadingLevel,
  TableLayoutType,
} from "docx";
import { saveAs } from "file-saver";
import suncityBadge from "@/assets/suncity-badge.png";

async function fetchImageAsBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch {
    return null;
  }
}

const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
};

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
  const badgeBuffer = await fetchImageAsBuffer(suncityBadge);

  const headerChildren: Paragraph[] = [];

  if (badgeBuffer) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({ data: badgeBuffer, transformation: { width: 80, height: 80 }, type: "png" }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "SUNCITY FC", bold: true, size: 32, font: "Calibri" })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Discipline • Unity • Victory", italics: true, size: 20, font: "Calibri" })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({
        text: `Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
        size: 16, font: "Calibri", color: "666666",
      })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: title, bold: true, size: 26, font: "Calibri" })],
      spacing: { after: 200 },
    })
  );

  const tableElements: (Paragraph | Table)[] = [];

  for (const tableData of tables) {
    const rows: TableRow[] = [];

    // Header rows
    for (const headRow of tableData.head) {
      rows.push(
        new TableRow({
          children: headRow.map(cell =>
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: cell, bold: true, size: 18, font: "Calibri", color: "FFFFFF" })],
                alignment: AlignmentType.CENTER,
              })],
              shading: { fill: "193769" },
              borders: BORDER,
              width: { size: Math.floor(100 / headRow.length), type: WidthType.PERCENTAGE },
            })
          ),
        })
      );
    }

    // Body rows
    tableData.body.forEach((bodyRow, rowIdx) => {
      rows.push(
        new TableRow({
          children: bodyRow.map(cell =>
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: cell, size: 16, font: "Calibri" })],
              })],
              shading: rowIdx % 2 === 1 ? { fill: "F5F5FA" } : undefined,
              borders: BORDER,
              width: { size: Math.floor(100 / bodyRow.length), type: WidthType.PERCENTAGE },
            })
          ),
        })
      );
    });

    if (rows.length > 0) {
      tableElements.push(
        new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.AUTOFIT,
        }),
        new Paragraph({ spacing: { after: 200 } })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        ...headerChildren,
        ...tableElements,
        ...(extraParagraphs || []),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "© 2026 Suncity FC — Discipline • Unity • Victory", italics: true, size: 16, font: "Calibri", color: "999999" })],
          spacing: { before: 400 },
        }),
      ],
    }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, fileName);
}

// Player profile DOCX export
export async function generatePlayerProfileDocx(
  playerName: string,
  playerId: string,
  position: string,
  stats: { label: string; value: string | number }[],
  attendanceDays: { day: string; status: string }[],
  opponents: { opponent: string; date: string; result: string }[],
  contributions: { month: string; status: string }[],
  profilePicUrl?: string
) {
  const badgeBuffer = await fetchImageAsBuffer(suncityBadge);
  const profileBuffer = profilePicUrl ? await fetchImageAsBuffer(profilePicUrl) : null;

  const children: (Paragraph | Table)[] = [];

  if (badgeBuffer) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: badgeBuffer, transformation: { width: 80, height: 80 }, type: "png" })],
      spacing: { after: 100 },
    }));
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "SUNCITY FC", bold: true, size: 32, font: "Calibri" })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Discipline • Unity • Victory", italics: true, size: 20, font: "Calibri" })],
      spacing: { after: 200 },
    })
  );

  if (profileBuffer) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: profileBuffer, transformation: { width: 100, height: 100 }, type: "png" })],
      spacing: { after: 100 },
    }));
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: playerName, bold: true, size: 28, font: "Calibri" })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `${playerId} • ${position}`, size: 20, font: "Calibri", color: "666666" })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Player Statistics", bold: true, size: 22, font: "Calibri" })],
      spacing: { after: 100 },
    })
  );

  // Stats table
  const statsRows = stats.map(s =>
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.label, size: 18, font: "Calibri" })] })], borders: BORDER }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(s.value), bold: true, size: 18, font: "Calibri" })] })], borders: BORDER }),
      ],
    })
  );
  if (statsRows.length > 0) {
    children.push(new Table({ rows: statsRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // Attendance
  children.push(new Paragraph({
    children: [new TextRun({ text: "Training Attendance", bold: true, size: 22, font: "Calibri" })],
    spacing: { after: 100 },
  }));
  const attRows = attendanceDays.map(a =>
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.day, size: 18, font: "Calibri" })] })], borders: BORDER }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({
          text: a.status === "present" ? "✅ Present" : a.status === "excused" ? "🔵 Excused" : a.status === "no_activity" ? "➖ No Activity" : "⬜ Absent",
          size: 18, font: "Calibri"
        })] })], borders: BORDER }),
      ],
    })
  );
  if (attRows.length > 0) {
    children.push(new Table({ rows: attRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // Contributions
  if (contributions.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: "Monthly Contributions", bold: true, size: 22, font: "Calibri" })],
      spacing: { after: 100 },
    }));
    const contribRows = contributions.map(c =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c.month, size: 18, font: "Calibri" })] })], borders: BORDER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({
            text: c.status === "paid" ? "✅ Paid" : "⬜ Unpaid",
            size: 18, font: "Calibri"
          })] })], borders: BORDER }),
        ],
      })
    );
    children.push(new Table({ rows: contribRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }

  // Opponents
  if (opponents.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: "Opponents Played Against", bold: true, size: 22, font: "Calibri" })],
      spacing: { after: 100 },
    }));
    const oppRows = [
      new TableRow({
        children: ["Opponent", "Date", "Result"].map(h =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Calibri", color: "FFFFFF" })] })],
            shading: { fill: "193769" }, borders: BORDER,
          })
        ),
      }),
      ...opponents.map(o =>
        new TableRow({
          children: [o.opponent, o.date, o.result].map(cell =>
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell, size: 18, font: "Calibri" })] })], borders: BORDER })
          ),
        })
      ),
    ];
    children.push(new Table({ rows: oppRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
  }

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "© 2026 Suncity FC — Discipline • Unity • Victory", italics: true, size: 16, font: "Calibri", color: "999999" })],
    spacing: { before: 400 },
  }));

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `suncity_fc_${playerName.replace(/\s+/g, "_").toLowerCase()}_profile.docx`);
}
