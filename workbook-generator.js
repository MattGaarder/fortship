"use strict";

/**
 * workbook-generator.js
 *
 * Creates a standalone .xlsx workbook based on the pre-formatted
 * "templates/lineup-format.xlsx" template, populated with the calculated
 * values received from the Office Script (report.stackedData).
 *
 * The original template file is never modified.
 * All formatting (fonts, colors, borders, column widths) from the template
 * is preserved using exceljs.
 *
 * Usage:
 *   const createStackedWorkbook = require("./workbook-generator");
 *   const { filePath, displayName } = await createStackedWorkbook({ sheetName, data });
 *   // … use the file …
 *   await fs.promises.unlink(filePath);   // caller must clean up
 */

const ExcelJS = require("exceljs");
const fs      = require("fs");
const os      = require("os");
const path    = require("path");

const TEMPLATE_PATH = path.join(__dirname, "templates", "lineup-format.xlsx");

/**
 * Strips characters that are illegal or awkward in filenames on
 * Windows, macOS, and Linux, then collapses runs of spaces /
 * hyphens into a single hyphen.
 *
 * @param {string} name  Raw name coming from report.sheetName
 * @returns {string}     Safe basename fragment (no extension)
 */
function sanitiseSheetName(name) {
    return String(name ?? "")
        .replace(/[/\\?%*:|"<>]/g, "-")   // illegal filename chars
        .replace(/\s+/g, "-")              // spaces → hyphen
        .replace(/-{2,}/g, "-")            // collapse repeated hyphens
        .replace(/^-+|-+$/g, "")          // strip leading/trailing hyphens
        || "Stacked";                      // fallback if name is empty after sanitising
}

/**
 * Locates the most appropriate worksheet in the template for a given sheet name.
 * Checks for "[SheetName] - Stacked", "[SheetName] Stacked", "[SheetName]",
 * case-insensitive variations, or falls back to the first available worksheet.
 *
 * @param {ExcelJS.Workbook} workbook
 * @param {string} sheetName
 * @returns {ExcelJS.Worksheet}
 */
function findTargetWorksheet(workbook, sheetName) {
    const candidates = [
        `${sheetName} - Stacked`,
        `${sheetName} Stacked`,
        sheetName
    ];

    for (const name of candidates) {
        const ws = workbook.getWorksheet(name);
        if (ws) return ws;
    }

    // Case-insensitive fallback
    const lowerCandidates = candidates.map(c => c.toLowerCase());
    for (const ws of workbook.worksheets) {
        if (lowerCandidates.includes(ws.name.toLowerCase())) {
            return ws;
        }
    }

    // Default fallback to first sheet
    return workbook.worksheets[0];
}

/**
 * Loads the Excel template, populates the target worksheet with the provided
 * 2D string data, retains all template formatting, removes unrelated sheets,
 * and writes a new standalone .xlsx file to the OS temp directory.
 *
 * @param {{ sheetName: string, data: string[][] }} options
 * @returns {Promise<{ filePath: string, displayName: string }>}
 */
async function createStackedWorkbook({ sheetName, data }) {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error("createStackedWorkbook: data must be a non-empty 2-D array.");
    }

    if (!fs.existsSync(TEMPLATE_PATH)) {
        throw new Error(`createStackedWorkbook: template not found at "${TEMPLATE_PATH}".`);
    }

    const safe        = sanitiseSheetName(sheetName);
    const displayName = `${safe}-Stacked.xlsx`;

    // Random suffix prevents collisions when concurrent requests arrive
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const fileName     = `${safe}-Stacked-${randomSuffix}.xlsx`;
    const filePath     = path.join(os.tmpdir(), fileName);

    // 1. Read the permanent template into memory (template file is not modified)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);

    // 2. Identify the target worksheet for this port/lineup
    const targetSheet = findTargetWorksheet(workbook, sheetName);
    if (!targetSheet) {
        throw new Error(`createStackedWorkbook: could not locate a valid worksheet in template for "${sheetName}".`);
    }

    const targetSheetId = targetSheet.id;

    // 3. Remove all other worksheets so the attachment only contains the relevant sheet
    const sheetIdsToRemove = [];
    workbook.eachSheet((ws) => {
        if (ws.id !== targetSheetId) {
            sheetIdsToRemove.push(ws.id);
        }
    });
    for (const id of sheetIdsToRemove) {
        workbook.removeWorksheet(id);
    }

    // 4. Populate the target worksheet with static data values
    const existingRowCount = targetSheet.rowCount;
    // Template row 4 is typically the first data row; use as reference style for added rows
    const referenceStyleRow = targetSheet.getRow(4);

    for (let r = 0; r < data.length; r++) {
        const rowData = data[r];
        const rowNumber = r + 1;
        const row = targetSheet.getRow(rowNumber);

        for (let c = 0; c < rowData.length; c++) {
            const colNumber = c + 1;
            const cell = row.getCell(colNumber);
            const rawValue = rowData[c];

            // Assign static value (this replaces any dynamic formula in the template)
            cell.value = rawValue;

            // If new rows exceed the template sample row count, inherit styling from sample row
            if (rowNumber > existingRowCount && referenceStyleRow) {
                const sampleCell = referenceStyleRow.getCell(colNumber);
                if (sampleCell.font) cell.font = Object.assign({}, sampleCell.font);
                if (sampleCell.alignment) cell.alignment = Object.assign({}, sampleCell.alignment);
                if (sampleCell.border) cell.border = Object.assign({}, sampleCell.border);
                if (sampleCell.fill) cell.fill = Object.assign({}, sampleCell.fill);
                if (sampleCell.numFmt) cell.numFmt = sampleCell.numFmt;
            }
        }
        row.commit();
    }

    // 5. Clear any excess sample rows from the template that were beyond data.length
    if (existingRowCount > data.length) {
        for (let r = data.length + 1; r <= existingRowCount; r++) {
            const row = targetSheet.getRow(r);
            row.values = [];
            row.commit();
        }
    }

    // 6. Write the resulting standalone workbook to the temporary directory
    await workbook.xlsx.writeFile(filePath);

    console.log(`[workbook-generator] Written template-formatted workbook: ${filePath} (${fs.statSync(filePath).size} bytes)`);

    return { filePath, displayName };
}

module.exports = createStackedWorkbook;
