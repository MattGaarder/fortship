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

interface ShippingReport {
    sheetName: string;
    recipient: string;
    berths: Berth[];
}

async function main(workbook: ExcelScript.Workbook): Promise<void> {

    const sheet = workbook.getActiveWorksheet();
    const sheetName = sheet.getName();


    console.log(`Active worksheet: ${sheetName}`);


    const recipient = String(
        sheet.getRange("B2").getText()
    ).trim();



    const range = sheet.getUsedRange();

    if (!range) {
        console.log("No used range found.");
        return;
    }

    const rows = range.getValues();
    const displayRows = range.getTexts();

    // CONFIGURATION


    // Each berth/pier/etc. occupies 9 columns:
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
    const NAME_COLUMN = 0;

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

    const report: ShippingReport = {
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

    // SEND TO NODE

    try {

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
        console.log("Fetch returned.");
        console.log(
            `HTTP status: ${response.status}`
        );
        console.log(
            `Response OK: ${response.ok}`
        );
        const responseText = await response.text();
        console.log(
            "Raw response:",
            responseText
        );
    } catch (error) {
        console.log("FETCH ERROR:");
        console.log(String(error));
        throw error;
    }
}