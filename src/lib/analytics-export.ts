/**
 * Analytics report export — CSV and PDF. CLIENT ONLY (uses jsPDF's browser
 * canvas/blob APIs, and triggers a download via an anchor click).
 *
 * Both formats are built from the exact same `AnalyticsPayload` the page is
 * already rendering, fetched through the same admin-only, range-filtered
 * GET /api/analytics call — there's no separate export endpoint and no
 * second data path to keep in sync.
 *
 * jsPDF/jspdf-autotable are loaded with a dynamic import() inside
 * exportAnalyticsPdf() rather than a top-level import, so they're only
 * fetched/parsed when someone actually clicks "PDF Report" — previously they
 * were bundled into the Analytics page's initial JS unconditionally (a real,
 * measured chunk of that route's unusually large First Load JS; see the 2026
 * pre-deployment audit). CSV export needs no library and is unaffected.
 */

import type jsPDFType from "jspdf";
import type { AnalyticsPayload } from "@/server/repositories/analytics";

const BRAND = {
  navy: [12, 52, 68] as [number, number, number],
  orange: [217, 138, 26] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Escapes a value for a CSV cell — wraps in quotes if it contains a comma, quote, or newline. */
function csvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

/**
 * A structured, human-readable CSV with clearly labelled sections —
 * deliberately not a flat dump of the JSON payload.
 */
export function exportAnalyticsCsv(siteName: string, data: AnalyticsPayload) {
  const lines: string[] = [];

  lines.push(csvRow([`${siteName} — Analytics Report`]));
  lines.push(csvRow([`Date range: ${data.range.label}`]));
  lines.push(csvRow([`Generated: ${new Date().toISOString()}`]));
  lines.push("");

  lines.push(csvRow(["SUMMARY (selected range)"]));
  lines.push(csvRow(["Metric", "Value"]));
  lines.push(csvRow(["Total Visits", data.totalVisitsInRange]));
  lines.push(csvRow(["Articles Published", data.articlesPublishedInRange]));
  lines.push("");

  lines.push(csvRow(["SUMMARY (all-time — views/likes/bookmarks have no date breakdown)"]));
  lines.push(csvRow(["Metric", "Value"]));
  lines.push(csvRow(["Total Articles", data.allTime.totalArticles]));
  lines.push(csvRow(["Published Articles", data.allTime.publishedArticles]));
  lines.push(csvRow(["Draft Articles", data.allTime.draftArticles]));
  lines.push(csvRow(["In Review Articles", data.allTime.inReviewArticles]));
  lines.push(csvRow(["Needs Revision Articles", data.allTime.needsRevisionArticles]));
  lines.push(csvRow(["Total Views", data.allTime.totalViews]));
  lines.push(csvRow(["Total Likes", data.allTime.totalLikes]));
  lines.push(csvRow(["Total Bookmarks", data.allTime.totalBookmarks]));
  lines.push(csvRow(["Active Editors", data.allTime.activeEditors]));
  lines.push(csvRow(["Unread Feedback", data.allTime.unreadFeedback]));
  lines.push(
    csvRow([
      "Most Viewed Article",
      data.allTime.mostViewedArticle
        ? `${data.allTime.mostViewedArticle.title} (${data.allTime.mostViewedArticle.views} views)`
        : "—",
    ])
  );
  lines.push(
    csvRow([
      "Most Viewed Category",
      data.allTime.mostViewedCategory
        ? `${data.allTime.mostViewedCategory.categoryName} (${data.allTime.mostViewedCategory.views} views)`
        : "—",
    ])
  );
  lines.push("");

  lines.push(csvRow([`DAILY VISITS (${data.range.label})`]));
  lines.push(csvRow(["Date", "Visitors"]));
  for (const v of data.visitsOverTime) lines.push(csvRow([v.date, v.visitors]));
  lines.push("");

  lines.push(csvRow([`ARTICLES PUBLISHED OVER TIME (${data.range.label})`]));
  lines.push(csvRow(["Period", "Articles Published"]));
  for (const p of data.publishedOverTime) lines.push(csvRow([p.period, p.count]));
  lines.push("");

  lines.push(csvRow([`ARTICLES PUBLISHED BY CATEGORY (${data.range.label})`]));
  lines.push(csvRow(["Category", "Articles Published"]));
  for (const c of data.articlesByCategoryInRange) lines.push(csvRow([c.categoryName, c.count]));
  lines.push("");

  lines.push(csvRow(["TOP ARTICLES BY VIEWS (all-time)"]));
  lines.push(csvRow(["Title", "Category", "Views", "Likes", "Bookmarks"]));
  for (const a of data.allTime.topArticles) {
    lines.push(csvRow([a.title, a.categoryName, a.views, a.likes, a.bookmarks]));
  }
  lines.push("");

  lines.push(csvRow(["VIEWS BY CATEGORY (all-time)"]));
  lines.push(csvRow(["Category", "Views"]));
  for (const c of data.allTime.viewsByCategory) lines.push(csvRow([c.categoryName, c.views]));

  const csv = lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${siteName.replace(/\s+/g, "-").toLowerCase()}-analytics-${data.range.toISO}.csv`);
}

/** Draws a small native vector bar chart directly on the PDF canvas — real
 * chart primitives (rects), not an embedded screenshot. */
function drawBarChart(
  doc: jsPDFType,
  x: number,
  y: number,
  width: number,
  height: number,
  bars: { label: string; value: number }[],
  color: [number, number, number]
) {
  if (bars.length === 0) {
    doc.setFontSize(9).setTextColor(150).text("No data for this range.", x, y + height / 2);
    return;
  }
  const max = Math.max(...bars.map((b) => b.value), 1);
  const gap = 4;
  const barWidth = (width - gap * (bars.length - 1)) / bars.length;

  doc.setDrawColor(...BRAND.gray).setLineWidth(0.2);
  doc.line(x, y + height, x + width, y + height); // baseline

  bars.forEach((bar, i) => {
    const barHeight = (bar.value / max) * (height - 14);
    const bx = x + i * (barWidth + gap);
    const by = y + height - barHeight;
    doc.setFillColor(...color);
    doc.roundedRect(bx, by, barWidth, barHeight, 0.6, 0.6, "F");
    doc.setFontSize(7).setTextColor(...BRAND.navy);
    doc.text(String(bar.value), bx + barWidth / 2, by - 1.5, { align: "center" });
    const label = bar.label.length > 14 ? `${bar.label.slice(0, 13)}…` : bar.label;
    doc.setFontSize(6.5).setTextColor(...BRAND.gray);
    doc.text(label, bx + barWidth / 2, y + height + 4, { align: "center" });
  });
}

/** Draws a native vector line/sparkline chart — plain polyline segments. */
function drawLineChart(
  doc: jsPDFType,
  x: number,
  y: number,
  width: number,
  height: number,
  points: { label: string; value: number }[],
  color: [number, number, number]
) {
  if (points.length === 0) {
    doc.setFontSize(9).setTextColor(150).text("No data for this range.", x, y + height / 2);
    return;
  }
  const max = Math.max(...points.map((p) => p.value), 1);
  doc.setDrawColor(...BRAND.gray).setLineWidth(0.2);
  doc.line(x, y + height, x + width, y + height);

  const step = points.length > 1 ? width / (points.length - 1) : 0;
  doc.setDrawColor(...color).setLineWidth(0.6);
  for (let i = 0; i < points.length - 1; i++) {
    const x1 = x + i * step;
    const y1 = y + height - (points[i].value / max) * height;
    const x2 = x + (i + 1) * step;
    const y2 = y + height - (points[i + 1].value / max) * height;
    doc.line(x1, y1, x2, y2);
  }
  // Endpoints only, to keep it legible at small sizes.
  doc.setFontSize(6.5).setTextColor(...BRAND.gray);
  doc.text(points[0].label, x, y + height + 4);
  doc.text(points[points.length - 1].label, x + width, y + height + 4, { align: "right" });
}

export async function exportAnalyticsPdf(siteName: string, data: AnalyticsPayload) {
  // Loaded here, not at module scope — see this file's top comment. Both
  // packages stay regular (non-lazy) dependencies in package.json; only
  // *when* they're fetched by the browser changes.
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let cursorY = 0;

  // ---- Header / branding ----
  doc.setFillColor(...BRAND.navy);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFontSize(16).setTextColor(255, 255, 255).setFont("helvetica", "bold");
  doc.text(siteName, margin, 12);
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("Analytics Report", margin, 19);
  doc.setFontSize(8).setTextColor(230, 230, 230);
  doc.text(`Date range: ${data.range.label}`, margin, 25);
  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    pageWidth - margin,
    25,
    { align: "right" }
  );
  cursorY = 36;

  // ---- KPI summary ----
  doc.setTextColor(...BRAND.navy).setFontSize(12).setFont("helvetica", "bold");
  doc.text("Summary", margin, cursorY);
  cursorY += 4;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.5 },
    headStyles: { textColor: BRAND.navy, fontStyle: "bold" },
    body: [
      ["Total Visits (selected range)", String(data.totalVisitsInRange)],
      ["Articles Published (selected range)", String(data.articlesPublishedInRange)],
      ["Total Article Views (all-time)", String(data.allTime.totalViews)],
      ["Total Likes (all-time)", String(data.allTime.totalLikes)],
      ["Total Bookmarks (all-time)", String(data.allTime.totalBookmarks)],
      [
        "Most Viewed Article (all-time)",
        data.allTime.mostViewedArticle
          ? `${data.allTime.mostViewedArticle.title} — ${data.allTime.mostViewedArticle.views} views`
          : "—",
      ],
      [
        "Most Viewed Category (all-time)",
        data.allTime.mostViewedCategory
          ? `${data.allTime.mostViewedCategory.categoryName} — ${data.allTime.mostViewedCategory.views} views`
          : "—",
      ],
    ],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // ---- Visits over time (line chart) ----
  doc.setFontSize(12).setFont("helvetica", "bold").setTextColor(...BRAND.navy);
  doc.text(`Visits Over Time (${data.range.label})`, margin, cursorY);
  cursorY += 6;
  drawLineChart(
    doc,
    margin,
    cursorY,
    pageWidth - margin * 2,
    30,
    data.visitsOverTime.map((v) => ({ label: v.date.slice(5), value: v.visitors })),
    BRAND.orange
  );
  cursorY += 42;

  // ---- Views by category (bar chart) ----
  if (cursorY > 220) {
    doc.addPage();
    cursorY = 20;
  }
  doc.setFontSize(12).setFont("helvetica", "bold").setTextColor(...BRAND.navy);
  doc.text("Views by Category (all-time)", margin, cursorY);
  cursorY += 6;
  drawBarChart(
    doc,
    margin,
    cursorY,
    pageWidth - margin * 2,
    32,
    data.allTime.viewsByCategory
      .slice(0, 8)
      .map((c) => ({ label: c.categoryName, value: c.views })),
    BRAND.navy
  );
  cursorY += 44;

  // ---- Top articles table ----
  if (cursorY > 220) {
    doc.addPage();
    cursorY = 20;
  }
  doc.setFontSize(12).setFont("helvetica", "bold").setTextColor(...BRAND.navy);
  doc.text("Top Articles by Views (all-time)", margin, cursorY);
  cursorY += 4;
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [["Title", "Category", "Views", "Likes", "Bookmarks"]],
    body: data.allTime.topArticles.map((a) => [
      a.title,
      a.categoryName,
      String(a.views),
      String(a.likes),
      String(a.bookmarks),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: BRAND.navy, textColor: 255 },
    alternateRowStyles: { fillColor: [245, 239, 224] },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cursorY = (doc as any).lastAutoTable.finalY + 10;

  // ---- Articles published by category (selected range) ----
  if (cursorY > 220) {
    doc.addPage();
    cursorY = 20;
  }
  doc.setFontSize(12).setFont("helvetica", "bold").setTextColor(...BRAND.navy);
  doc.text(`Articles Published by Category (${data.range.label})`, margin, cursorY);
  cursorY += 4;
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [["Category", "Articles Published"]],
    body:
      data.articlesByCategoryInRange.length > 0
        ? data.articlesByCategoryInRange.map((c) => [c.categoryName, String(c.count)])
        : [["No articles published in this range", ""]],
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: BRAND.orange, textColor: 255 },
  });

  // ---- Footer on every page ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7).setTextColor(...BRAND.gray);
    doc.text(
      `${siteName} — Analytics Report — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  doc.save(`${siteName.replace(/\s+/g, "-").toLowerCase()}-analytics-${data.range.toISO}.pdf`);
}
