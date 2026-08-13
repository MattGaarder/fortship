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
    berths: Berth[];
}

interface ReportResponse {
    success: boolean;
    provider?: string;
    draftId?: string;
    message?: string;
}

// This is the public HTTPS address of the Node service, not an Excel file path.
// ngrok is suitable for development; use the deployed service URL in production.
const REPORT_ENDPOINT = "https://hull-wilder-consuming.ngrok-free.dev/generate-report-json";

// Office Scripts have no secure secret store. Treat this as a development-only
// shared key and rotate it before sharing the workbook with additional editors.
const REPORT_API_KEY = "lorena-prototype-7f84e91b2c";

async function main(workbook: ExcelScript.Workbook): Promise<void> {
    const sheet = workbook.getWorksheets()[0];
    const range = sheet.getUsedRange();
    const rows = range.getValues();
    const displayRows = range.getTexts();
    const berths: Berth[] = [];

    let currentBerth: Berth | null = null;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const displayRow = displayRows[i];

        const firstCell = row[0];
        const secondCell = row[1];

        // Detect berth heading
        if (
            typeof secondCell === "string" &&
            secondCell.toLowerCase().startsWith("berth")
        ) {
            currentBerth = {
                name: String(displayRow[1] ?? ""),
                vessels: []
            };
            berths.push(currentBerth);
            continue;
        }

        // Ignore header row
        if (firstCell === "Vessels Names") {
            continue;
        }

        // Ignore anything before a berth
        if (!currentBerth || !firstCell) {
            continue;
        }

        currentBerth.vessels.push({
            // Text values
            name: String(displayRow[0] ?? ""),

            // Use Excel's displayed formatting for dates
            eta: String(displayRow[1] ?? ""),
            etb: String(displayRow[2] ?? ""),
            etc: String(displayRow[3] ?? ""),
            etd: String(displayRow[4] ?? ""),
            cargo: String(displayRow[5] ?? ""),

            // Keep quantity from the underlying value
            quantity: row[6] ?? "",

            operation: String(displayRow[7] ?? ""),

            remarks: String(displayRow[8] ?? "")
        });
    }

    const report: ShippingReport = {
        berths
    };


    try {
        console.log("About to send report...");
        console.log(
            `Berths: ${report.berths.length}`
        );

        const response = await fetch(REPORT_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": REPORT_API_KEY
            },
            body: JSON.stringify(report)
        });

        const result: ReportResponse = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || `Report endpoint returned HTTP ${response.status}.`);
        }

        console.log(`${result.provider} draft created: ${result.draftId}`);

    } catch (error) {
        console.log("FETCH ERROR:");
        console.log(String(error));
        throw error;
    }
}
