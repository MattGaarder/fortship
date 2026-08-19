interface Vessel {
    name: string;
    eta: string;
    etb: string;
    etc: string;
    etd: string;
    cargo: string;
    quantity: string | number;
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
}

interface BertSailRow {
    label: string;
    valueB: string;
    valueC: string;
}

interface BertSailReport {
    reportType: "bert-sail";
    sheetName: string;
    recipient: string;
    rows: BertSailRow[];
}

async function main(workbook: ExcelScript.Workbook): Promise<void> {
    const sheet = workbook.getActiveWorksheet();
    const sheetName = sheet.getName();
    console.log(`Active worksheet: ${sheetName}`);
    if (sheetName === "Bert&Sail") {
        await processBertSail(sheet);
        return;
    }
    await processLineUp(sheet);
}




async function processBertSail(
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
    const reportRows: BertSailRow[] = [];

    for (let i = 0; i < displayRows.length; i++) {
        const row = displayRows[i];
        reportRows.push({
            label: String(row[0] ?? "").trim(),
            valueB: String(row[1] ?? "").trim(),
            valueC: String(row[2] ?? "").trim()
        });
    }
    const report: BertSailReport = {
        reportType: "bert-sail",
        sheetName,
        recipient,
        rows: reportRows
    };
    await sendReport(report);
}

async function processLineUp(
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
                // Keep underlying Excel value
                quantity: row?.[startColumn + 6] ?? "",
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

    const report: LineUp = {
        reportType: "line-up",
        sheetName,
        recipient,
        berths
    };

    // DEBUGGING
    console.log(`Sheet: ${sheetName}`);
    console.log(`Berths found: ${berths.length}`);

    for (const berth of berths) {
        console.log(
            `${berth.name}: ${berth.vessels.length} vessels`
        );
    }

    await sendReport(report);
}

async function sendReport(report: LineUp | BertSailReport): Promise<void> {
    console.log("About to send report...");
    const response = await fetch(
        "https://hull-wilder-consuming.ngrok-free.dev/generate-report-json",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": "lorena-prototype"
            },
            body: JSON.stringify(report)
        }
    );

    console.log(`HTTP status: ${response.status}`);
    console.log(`Response OK: ${response.ok}`);

    const responseText = await response.text();

    console.log("Raw response:", responseText);
}