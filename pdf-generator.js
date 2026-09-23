"use strict";

/**
 * pdf-generator.js
 *
 * Converts report HTML into a printable, beautifully formatted A4 PDF
 * using Puppeteer (headless Chromium).
 *
 * Features:
 * - Strips email introductory text ("Dear All...") so the PDF begins
 *   immediately with the report title and tables at the top of page 1.
 * - Scales the output to ~88-90% for a clean, uncrowded desktop view
 *   that prevents unnecessary table cell wrapping.
 * - Replaces email "cid:" image references with base64 data URIs so
 *   all logos, weather icons, and port graphics render offline.
 * - Injects print-specific CSS for clean A4 pagination, avoiding awkward
 *   table row breaks and preserving rich background colors.
 * - Saves a uniquely named temporary PDF in the OS temp directory.
 * - Returns { filePath, displayName } for attachment handling.
 */

const puppeteer = require("puppeteer");
const fs        = require("fs");
const os        = require("os");
const path      = require("path");

/**
 * Strips characters that are illegal or awkward in filenames on
 * Windows, macOS, and Linux, then collapses runs of spaces /
 * hyphens into a single hyphen.
 *
 * @param {string} name
 * @returns {string}
 */
function sanitiseFilename(name) {
    return String(name ?? "")
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "")
        || "Report";
}

/**
 * Generates an email-friendly display name for the PDF attachment
 * based on the report type and sheet/vessel details.
 *
 * @param {object} report
 * @returns {string}
 */
function getPdfDisplayName(report) {
    if (report.reportType === "line-up") {
        const safe = sanitiseFilename(report.sheetName);
        return `${safe}-Line-Up.pdf`;
    }

    if (report.reportType === "berth-sail") {
        return "Berthing-Report.pdf";
    }

    if (report.reportType === "daily-report") {
        const vessel = sanitiseFilename(report.vesselName);
        return vessel ? `${vessel}-Daily-Report.pdf` : "Daily-Report.pdf";
    }

    const safe = sanitiseFilename(report.sheetName || "Report");
    return `${safe}.pdf`;
}

/**
 * Inlines CID-referenced local image files into base64 data URIs
 * so Puppeteer can render them without an HTTP server.
 *
 * @param {string} html
 * @param {Array<{ path: string, cid: string }>} images
 * @returns {string}
 */
function inlineCidImages(html, images = []) {
    let result = html;

    for (const img of images) {
        if (img?.path && img?.cid && fs.existsSync(img.path)) {
            const ext = path.extname(img.path).slice(1).toLowerCase();
            const mime =
                ext === "jpg" || ext === "jpeg"
                    ? "image/jpeg"
                    : ext === "svg"
                    ? "image/svg+xml"
                    : `image/${ext}`;

            const base64Data = fs.readFileSync(img.path, "base64");
            const dataUri = `data:${mime};base64,${base64Data}`;

            result = result.split(`cid:${img.cid}`).join(dataUri);
        }
    }

    return result;
}

/**
 * Removes email-specific greeting/intro paragraphs (e.g. "Dear All...")
 * from the PDF output so the document begins cleanly with the report header.
 *
 * @param {string} html
 * @returns {string}
 */
function stripIntroSection(html) {
    return html
        .replace(/<tr[^>]*>\s*<td[^>]*>\s*<div class="intro-section"[\s\S]*?<\/div>\s*<\/td>\s*<\/tr>/gi, "")
        .replace(/<div class="intro-section"[\s\S]*?<\/div>/gi, "");
}

/**
 * Print styles to ensure optimal layout, accurate colors, and proper
 * table page breaks on standard A4 paper.
 */
const PDF_PRINT_STYLES = `
<style>
@page {
    size: A4 portrait;
    margin: 8mm;
}
*, *::before, *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}
body {
    background-color: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
}
.intro-section {
    display: none !important;
}
.email-container {
    width: 100% !important;
    max-width: 100% !important;
}
table {
    page-break-inside: auto;
}
tr, .card, .table-section {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
}
/* Ensure desktop layout is displayed in PDF if responsive classes exist */
.mobile-report {
    display: none !important;
}
.desktop-report {
    display: block !important;
}
</style>
`;

/**
 * Generates a PDF file from report HTML and returns the temp file path
 * and email display name.
 *
 * @param {{ report: object, html: string, images?: Array<{ path: string, cid: string }> }} options
 * @returns {Promise<{ filePath: string, displayName: string }>}
 */
async function createReportPdf({ report, html, images = [] }) {
    if (!html || typeof html !== "string") {
        throw new Error("createReportPdf: html must be a non-empty string.");
    }

    const displayName = getPdfDisplayName(report);
    const baseName    = path.basename(displayName, ".pdf");
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const fileName    = `${baseName}-${randomSuffix}.pdf`;
    const filePath    = path.join(os.tmpdir(), fileName);

    // Prepare HTML:
    // 1. Remove email introductory text so report starts at top of page 1
    // 2. Inline CID images as base64 data URIs
    // 3. Append print styling
    const cleanHtml = stripIntroSection(html);
    const preparedHtml = inlineCidImages(cleanHtml, images) + PDF_PRINT_STYLES;

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage"
        ]
    });

    try {
        const page = await browser.newPage();

        // High resolution viewport for crisp desktop layout rendering
        await page.setViewport({
            width: 1280,
            height: 900,
            deviceScaleFactor: 2
        });

        await page.setContent(preparedHtml, {
            waitUntil: "networkidle0"
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            scale: 0.68, 
            margin: {
                top: "8mm",
                right: "8mm",
                bottom: "8mm",
                left: "8mm"
            }
        });

        await fs.promises.writeFile(filePath, pdfBuffer);

        console.log(`[pdf-generator] Written PDF report: ${filePath} (${pdfBuffer.length} bytes)`);

        return { filePath, displayName };
    } finally {
        await browser.close();
    }
}

module.exports = createReportPdf;
