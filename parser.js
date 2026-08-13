const XLSX = require("xlsx");

function parseShippingReport(filePath) {

    const workbook = XLSX.readFile(filePath, {
        cellDates: true
    });

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        // Match the Office Script path, which reads Excel's displayed text
        // rather than serialised Date objects and unformatted numbers.
        raw: false
    });

    const berths = [];

    let currentBerth = null;
    let headersFound = false;

    for (const row of rows) {

        if (!row || row.length === 0) {
            continue;
        }

        // Berth heading
        if (
            typeof row[1] === "string" &&
            row[1].toLowerCase().startsWith("berth")
        ) {
            currentBerth = {
                name: row[1],
                vessels: []
            };

            berths.push(currentBerth);
            headersFound = false;

            continue;
        }

        // Header row
        if (row[0] === "Vessels Names") {
            continue;
        }

        // Vessel row
        if (!currentBerth || !row[0]) {
            continue;
        }

        currentBerth.vessels.push({
            name: row[0],
            eta: row[1],
            etb: row[2],
            etc: row[3],
            etd: row[4],
            cargo: row[5],
            quantity: row[6],
            operation: row[7],
            remarks: row[8]
        });
    }

    return {
        berths
    };
}

module.exports = parseShippingReport;
