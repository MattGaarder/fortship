// LINEUP INTERFACES

interface Vessel {
    name: string;
    eta: string;
    etb: string;
    etc: string;
    etd: string;
    cargo: string;
    quantity: string;
    operation: string;
    remarks: string;
}

interface Berth {
    name: string;
    vessels: Vessel[];
}

interface LineUp {
    reportType: "line-up";
    sheetName: string;
    recipient: string;
    berths: Berth[];
    stackedData: string[][];
}

// BERTH&SAIL INTERFACES

interface BerthSailRow {
    label: string;
    valueB: string;
    valueC: string;
}

interface BerthSailReport {
    reportType: "berth-sail";
    sheetName: string;
    recipient: string;
    rows: BerthSailRow[];
}

// DAILY REPORT INTERFACES

// interface DailyReportHoldSummary {
//     label: string;
//     values: string[];
// }

interface DailyReportMetric {
    label: string;
    value: string;
}

interface DailyReportDischarge {
    date: string;
    shift: string;
    units: string;
    mtons: string;
}

interface DailyReport {
    reportType: "daily-report";
    sheetName: string;
    recipient: string;
    vesselName: string;
    summary: DailyReportMetric[];
    dischargeSummary: DailyReportMetric[];
    discharges: DailyReportDischarge[];
    etcs: string;
}

async function main(workbook: ExcelScript.Workbook): Promise<void> {
    const sheet = workbook.getActiveWorksheet();
    const sheetName = sheet.getName();
    console.log(`Active worksheet: ${sheetName}`);
    switch (sheetName) {
        case "Berth&Sail":
            await processBerthSail(sheet);
            break;

        case "Daily Report":
            await processDailyReport(sheet);
            break;

        case "Mucuripe":
        case "Pecem":
        case "VDC":
        case "Tank Pier":
        case "PE":
            await processLineUp(workbook, sheet);
            break;

        default:
            throw new Error(
                `Unsupported report worksheet: "${sheetName}"`
            );
    }
}




async function processBerthSail(
    sheet: ExcelScript.Worksheet
): Promise<void> {
    const sheetName = sheet.getName();
    const recipient = String(sheet.getRange("B2").getText()).trim();
    const range = sheet.getUsedRange();

    if (!range) {
        console.log("No used range found.");
        return;
    }

    const displayRows = range.getTexts();
    const reportRows: BerthSailRow[] = [];

    for (let i = 0; i < displayRows.length; i++) {
        const row = displayRows[i];
        if (i === 1) {
            continue;
        }
        reportRows.push({
            label: String(row[0] ?? "").trim(),
            valueB: String(row[1] ?? "").trim(),
            valueC: String(row[2] ?? "").trim()
        });
    }
    const report: BerthSailReport = {
        reportType: "berth-sail",
        sheetName,
        recipient,
        rows: reportRows
    };
    console.log("BERTH SAIL REPORT:");
    console.log(JSON.stringify(report, null, 2));
    await sendReport(report);
}

async function getStackedSheetData(
    workbook: ExcelScript.Workbook,
    sheetName: string
): Promise<string[][]> {

    const stackedSheetName = `${sheetName} - Stacked`;

    const stackedSheet =
        workbook.getWorksheet(stackedSheetName);

    if (!stackedSheet) {
        throw new Error(
            `Stacked worksheet "${stackedSheetName}" was not found.`
        );
    }

    const range = stackedSheet.getUsedRange();

    if (!range) {
        throw new Error(
            `Stacked worksheet "${stackedSheetName}" is empty.`
        );
    }

    console.log(
        `Reading stacked worksheet: ${stackedSheetName}`
    );

    return range.getTexts();
}

async function processLineUp(
    workbook: ExcelScript.Workbook,
    sheet: ExcelScript.Worksheet
): Promise<void>{
    const recipient = String(sheet.getRange("B2").getText()).trim();

    const range = sheet.getUsedRange();

    if (!range) {
        console.log("No used range found.");
        return;
    }

    const rows = range.getValues();
    const displayRows = range.getTexts();

    // CONFIG — Each berth/pier/etc. occupies 9 columns:
    // Vessels Names
    // ETA
    // ETB
    // ETC
    // ETD
    // Cargo
    // Quantity
    // Load/Disch
    // Remarks

    const COLUMNS_PER_BERTH = 9;

    // Row containing the berth/pier/etc. name.
    // Excel row 3 = index 2.
    const BERTH_ROW = 2;
    // Row containing the column headings.
    // Excel row 4 = index 3.
    const HEADER_ROW = 3;

    const berths: Berth[] = [];

    for (
        let startColumn = 0;
        startColumn < rows[BERTH_ROW].length;
        startColumn += COLUMNS_PER_BERTH
    ) {
        const berthName = String(
            displayRows[BERTH_ROW]?.[startColumn] ?? ""
        ).trim();
        if (!berthName) {
            continue;
        }
        console.log(`Found berth/pier: ${berthName}`);

        const berth: Berth = {
            name: berthName,
            vessels: []
        };
        const headerName = String(
            displayRows[HEADER_ROW]?.[startColumn] ?? ""
        ).trim();
        if (
            headerName.toLowerCase() !== "vessels names"
        ) {
            console.log(
                `Skipping block "${berthName}" because no "Vessels Names" header was found.`
            );
            continue;
        }
        for (
            let rowIndex = HEADER_ROW + 1;
            rowIndex < rows.length;
            rowIndex++
        ) {
            const row = rows[rowIndex];
            const displayRow = displayRows[rowIndex];

            const vesselName = String(
                displayRow?.[startColumn] ?? ""
            ).trim();
            if (!vesselName) {
                continue;
            }
            // CREATE VESSEL
            berth.vessels.push({
                // A
                name: vesselName,
                // B
                eta: String(
                    displayRow?.[startColumn + 1] ?? ""
                ),
                // C
                etb: String(
                    displayRow?.[startColumn + 2] ?? ""
                ),
                // D
                etc: String(
                    displayRow?.[startColumn + 3] ?? ""
                ),
                // E
                etd: String(
                    displayRow?.[startColumn + 4] ?? ""
                ),
                // F
                cargo: String(
                    displayRow?.[startColumn + 5] ?? ""
                ),
                // G
                quantity: String(
                    displayRow?.[startColumn + 6] ?? ""
                ).trim(),
                // H
                operation: String(
                    displayRow?.[startColumn + 7] ?? ""
                ),
                // I
                remarks: String(
                    displayRow?.[startColumn + 8] ?? ""
                )
            });
        }
        // ADD BERTH
        berths.push(berth);
    }

    // CREATE REPORT
    const sheetName = sheet.getName();

    const stackedData = await getStackedSheetData(
        workbook,
        sheetName
    );

    const report: LineUp = {
        reportType: "line-up",
        sheetName,
        recipient,
        berths,
        stackedData
    };

    // DEBUGGING
    console.log(`Sheet: ${sheetName}`);
    console.log(`Berths found: ${berths.length}`);
    console.log(
        `Stacked rows: ${stackedData.length}`
    );

    for (const berth of berths) {
        console.log(
            `${berth.name}: ${berth.vessels.length} vessels`
        );
    }

    await sendReport(report);
}

// DAILY REPORT SENDER

async function processDailyReport(
    sheet: ExcelScript.Worksheet
): Promise<void> {

    const sheetName = sheet.getName();
    const range = sheet.getUsedRange();

    if (!range) {
        console.log("No used range found.");
        return;
    }

    const displayRows = range.getTexts();

    /*
     * -------------------------------------------------------
     * BASIC INFORMATION
     * -------------------------------------------------------
     */

    const vesselName = String(
        displayRows[0]?.[1] ?? ""
    ).trim();

    /*
     * IMPORTANT:
     * Replace this with wherever the recipient actually lives
     * in your Daily Report workbook.
     */
    const recipient = String(
        sheet.getRange("B2").getText()
    ).trim();


    /*
     * -------------------------------------------------------
     * HOLDS
     * -------------------------------------------------------
     *
     * Find the row containing "Hold`s".
     *
     * Example:
     *
     * A       B       C       D       E
     * Hold`s  Hold #1 Hold #2 Hold #3 Hold #4
     */

    const holds: string[] = [];

    let holdsHeaderRow = -1;

    for (let rowIndex = 0; rowIndex < displayRows.length; rowIndex++) {
        const row = displayRows[rowIndex];

        if (
            String(row[0] ?? "")
                .trim()
                .toLowerCase()
            === "hold`s"
        ) {
            holdsHeaderRow = rowIndex;
            break;
        }
    }

    if (holdsHeaderRow !== -1) {

        const row = displayRows[holdsHeaderRow];

        for (let columnIndex = 1; columnIndex < row.length; columnIndex++) {

            const value = String(
                row[columnIndex] ?? ""
            ).trim();

            if (!value) {
                continue;
            }

            holds.push(value);
        }
    }


    /*
     * -------------------------------------------------------
     * SUMMARY
     * -------------------------------------------------------
     */

    const summary: DailyReportMetric[] = [];

    const summaryLabels = new Set([
        "Total Manifested (mtons)",
        "Total Manifested (units)",
        "Discharged Daily (mtons)",
        "Balance to go (mtons)",
        "Discharged Daily (units)",
        "Balance to go (units)"
    ]);

    for (const row of displayRows) {

        const label = String(
            row[0] ?? ""
        ).trim();

        if (!summaryLabels.has(label)) {
            continue;
        }

        summary.push({
            label,
            value: String(
                row[1] ?? ""
            ).trim()
        });
    }


    /*
     * -------------------------------------------------------
     * DISCHARGE SUMMARY
     * -------------------------------------------------------
     */

    const dischargeSummary: DailyReportMetric[] = [];

    const dischargeSummaryLabels = new Set([
        "Manifested (mtons)",
        "Total Discharged (mtons)",
        "Balance to go (mtons)",
        "Manifested (units)",
        "Total Discharged (units)",
        "Balance to go (units)"
    ]);

    for (let rowIndex = 0; rowIndex < displayRows.length; rowIndex++) {

        const row = displayRows[rowIndex];

        const firstCell = String(
            row[0] ?? ""
        ).trim();

        if (!dischargeSummaryLabels.has(firstCell)) {
            continue;
        }

        /*
         * The first row of each summary section contains
         * three column headings.
         *
         * The following row contains the values.
         *
         * Therefore handle the row AFTER the heading.
         */

        if (
            firstCell === "Manifested (mtons)" &&
            rowIndex + 1 < displayRows.length
        ) {
            const values = displayRows[rowIndex + 1];

            dischargeSummary.push(
                {
                    label: "Manifested (mtons)",
                    value: String(values[0] ?? "").trim()
                },
                {
                    label: "Total Discharged (mtons)",
                    value: String(values[1] ?? "").trim()
                },
                {
                    label: "Balance to go (mtons)",
                    value: String(values[2] ?? "").trim()
                }
            );
        }

        if (
            firstCell === "Manifested (units)" &&
            rowIndex + 1 < displayRows.length
        ) {
            const values = displayRows[rowIndex + 1];

            dischargeSummary.push(
                {
                    label: "Manifested (units)",
                    value: String(values[0] ?? "").trim()
                },
                {
                    label: "Total Discharged (units)",
                    value: String(values[1] ?? "").trim()
                },
                {
                    label: "Balance to go (units)",
                    value: String(values[2] ?? "").trim()
                }
            );
        }
    }


    /*
     * -------------------------------------------------------
     * SHIFT / DISCHARGE TABLE
     * -------------------------------------------------------
     */

    const discharges: DailyReportDischarge[] = [];

    let dischargeHeaderRow = -1;

    for (let rowIndex = 0; rowIndex < displayRows.length; rowIndex++) {

        const row = displayRows[rowIndex];

        if (
            String(row[0] ?? "").trim() === "Date" &&
            String(row[1] ?? "").trim() === "Shift"
        ) {
            dischargeHeaderRow = rowIndex;
            break;
        }
    }

    if (dischargeHeaderRow !== -1) {

        for (
            let rowIndex = dischargeHeaderRow + 1;
            rowIndex < displayRows.length;
            rowIndex++
        ) {

            const row = displayRows[rowIndex];

            const date = String(
                row[0] ?? ""
            ).trim();

            const shift = String(
                row[1] ?? ""
            ).trim();

            const units = String(
                row[2] ?? ""
            ).trim();

            const mtons = String(
                row[3] ?? ""
            ).trim();

            /*
             * Stop when there isn't a date.
             */
            if (!date) {
                continue;
            }

            /*
             * ETC/S is in column F.
             * It appears on the first discharge row.
             * We deal with it separately below.
             */

            discharges.push({
                date,
                shift,
                units,
                mtons
            });
        }
    }


    /*
     * -------------------------------------------------------
     * ETC/S
     * -------------------------------------------------------
     */

    let etcs = "";

    for (let rowIndex = 0; rowIndex < displayRows.length; rowIndex++) {

        const row = displayRows[rowIndex];

        for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {

            if (
                String(row[columnIndex] ?? "")
                    .trim()
                    .toUpperCase() === "ETC/S"
            ) {

                /*
                 * ETC/S value is immediately below/right depending
                 * on the workbook structure.
                 *
                 * In your example it is in column F on the
                 * Date header row, with its value on the first
                 * data row.
                 */

                etcs = String(
                    displayRows[rowIndex + 1]?.[columnIndex] ?? ""
                ).trim();

                break;
            }
        }

        if (etcs) {
            break;
        }
    }


    /*
     * -------------------------------------------------------
     * CREATE REPORT
     * -------------------------------------------------------
     */

    const report: DailyReport = {
        reportType: "daily-report",
        sheetName,
        recipient,
        vesselName,
        holds,
        summary,
        dischargeSummary,
        discharges,
        etcs
    };

    console.log("DAILY REPORT:");
    console.log(JSON.stringify(report, null, 2));

    await sendReport(report);
}

async function sendReport(report: LineUp | BerthSailReport | DailyReport): Promise<void> {
    console.log("About to send report...");
    const response = await fetch(
        "https://hull-wilder-consuming.ngrok-free.dev/generate-report-json",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": "lorena-prototype-7f84e91b2c"
            },
            body: JSON.stringify(report)
        }
    );

    console.log(`HTTP status: ${response.status}`);
    console.log(`Response OK: ${response.ok}`);

    const responseText = await response.text();

    console.log("Raw response:", responseText);
}