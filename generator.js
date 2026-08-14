const path = require("path");

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function generateHtml(report, { isPreview = false } = {}) {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>Port of Pecém — Line Up</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #D4DDE5;
            font-family: Arial, Helvetica, sans-serif;
        }

        table {
            border-collapse: collapse;
        }

        img {
            max-width: 100%;
            height: auto;
        }
        .email-container {
            width: 100%;
            max-width: 1000px;
            margin: 0 auto;
            background: #ffffff;
        }
        .report-header {
            padding: 24px;
            border-bottom: 1px solid #d1d5db;
        }
        .report-header h1 {
            margin: 0;
            font-size: 26px;
            line-height: 1.2;
        }
        .report-header p {
            margin: 6px 0 0;
            font-size: 14px;
            line-height: 1.4;
        }
        .berth-section {

            padding-top: 12px;
            padding-bottom: 12px;
            background-color: #D4DDE5;
            text-align: center;
        }
        .berth-section h3 {
            font-size: 13px;
            line-height: 1;
            margin: 0 0 12px 0;
        }
        .shipping-table {
            width: 100%;
            border-collapse: collapse;
        }
        .shipping-table th,
        .shipping-table td {
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
            vertical-align: top;
        }
        .shipping-table th {
            font-size: 12px;
            line-height: 1.2;
            background-color: #1D4369;
            color: #ffffff;
        }
        .shipping-table td {
            font-size: 14px;
            line-height: 1.4;
        }


        /* --------------------------------
        MOBILE VERSION
        -------------------------------- */

        .mobile-report {
            display: none;
        }

        .mobile-vessel-card {
            margin-bottom: 16px;
            border: 1px solid #d1d5db;
            background: #ffffff;
        }

        .mobile-vessel-name {
            padding: 10px;
            font-size: 14px;
            line-height: 1.4;
            font-weight: bold;
            background-color: #1D4369;
            color: #ffffff;
        }

        .mobile-detail {
            padding: 10px;
            border-bottom: 1px solid #d1d5db;
            background-color: #ffffff;
        }

        .mobile-detail:last-child {
            border-bottom: none;
        }

        .mobile-detail-label {
            display: block;
            margin-bottom: 3px;
            font-size: 11px;
            line-height: 1.2;
            font-weight: bold;
            color: #1D4369;
            text-transform: uppercase;
        }

        .mobile-detail-value {
            display: block;
            font-size: 14px;
            line-height: 1.4;
            color: #111827;
        }

        /* --------------------------------
           RESPONSIVE RULES
        -------------------------------- */

        @media screen and (max-width: 600px) {
            body {
                padding: 0 !important;
            }

            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }

            .desktop-report {
                display: none !important;
            }

            .mobile-report {
                display: block !important;
            }

            .report-header {
                padding: 20px 16px !important;
            }

            .report-header h1 {
                font-size: 24px !important;
            }

            .berth-section {
                padding: 12px !important;
            }

            .berth-section h3 {
                font-size: 13px !important;
                margin: 0 0 12px 0 !important;
            }
        }
    </style>
</head>

<body>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">
                <table
                    role="presentation"
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    class="email-container"
                >
                    <tr>
                        <td>
                            <div class="report-header">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="left" valign="middle">
                                            <h1>Port of Pecém — Line Up</h1>
                                            <p>Vessel Schedule &amp; Port Operations</p>
                                        </td>
                                        <td align="right" valign="middle">
                                            <img src="${isPreview ? '/assets/bf-fortship-1_1.png' : 'cid:company-logo'}" alt="Fortship Logo" style="max-height: 60px;">
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <!-- DESKTOP REPORT -->
                            <div class="desktop-report">
`;
        for (const berth of report.berths) {
        html += `
            <div class="berth-section">
                <h3>${escapeHtml(berth.name)}</h3>
                <table class="shipping-table" width="100%">
                    <thead>
                        <tr>
                            <th>Vessels Names</th>
                            <th>ETA</th>
                            <th>ETB</th>
                            <th>ETC</th>
                            <th>ETD</th>
                            <th>Cargo</th>
                            <th>Quantity</th>
                            <th>Operation</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        for (const [i, vessel] of berth.vessels.entries()) {
            const rowBg = i % 2 === 0 ? "#ffffff" : "#EAEDF0";
            html += `
                <tr style="background-color: ${rowBg};">
                    <td style="background-color: #1D4369; color: #ffffff;">${escapeHtml(vessel.name)}</td>
                    <td>${escapeHtml(vessel.eta)}</td>
                    <td>${escapeHtml(vessel.etb)}</td>
                    <td>${escapeHtml(vessel.etc)}</td>
                    <td>${escapeHtml(vessel.etd)}</td>
                    <td>${escapeHtml(vessel.cargo)}</td>
                    <td>${escapeHtml(vessel.quantity)}</td>
                    <td>${escapeHtml(vessel.operation)}</td>
                    <td>${escapeHtml(vessel.remarks)}</td>
                </tr>
            `;
        }

        html += `
                    </tbody>
                </table>

            </div>
        `;
    }
    html += `
                            </div>
                            <!-- MOBILE REPORT -->
                            <div class="mobile-report">
`;
    for (const berth of report.berths) {
        html += `
            <div class="berth-section">
                <h3>${escapeHtml(berth.name)}</h3>
        `;
        for (const vessel of berth.vessels) {
            html += `
                <div class="mobile-vessel-card">
                    <div class="mobile-vessel-name">
                        ${escapeHtml(vessel.name)}
                    </div>
                    <div class="mobile-detail">
                        <span class="mobile-detail-label">ETA</span>
                        <span class="mobile-detail-value">${escapeHtml(vessel.eta)}</span>
                    </div>
                    <div class="mobile-detail">
                        <span class="mobile-detail-label">ETB</span>
                        <span class="mobile-detail-value">${escapeHtml(vessel.etb)}</span>
                    </div>
                    <div class="mobile-detail">
                        <span class="mobile-detail-label">ETC</span>
                        <span class="mobile-detail-value">${escapeHtml(vessel.etc)}</span>
                    </div>
                    <div class="mobile-detail">
                        <span class="mobile-detail-label">ETD</span>
                        <span class="mobile-detail-value">${escapeHtml(vessel.etd)}</span>
                    </div>
                    <div class="mobile-detail">
                        <span class="mobile-detail-label">Cargo</span>
                        <span class="mobile-detail-value">${escapeHtml(vessel.cargo)}</span>
                    </div>
                    <div class="mobile-detail">
                        <span class="mobile-detail-label">Quantity</span>
                        <span class="mobile-detail-value">${escapeHtml(vessel.quantity)}</span>
                    </div>
                    <div class="mobile-detail">
                        <span class="mobile-detail-label">Operation</span>
                        <span class="mobile-detail-value">${escapeHtml(vessel.operation)}</span>
                    </div>
                    <div class="mobile-detail">
                        <span class="mobile-detail-label">Remarks</span>
                        <span class="mobile-detail-value">${escapeHtml(vessel.remarks)}</span>
                    </div>
                </div>
            `;
        }
        html += `
            </div>
        `;
    }
    html += `
                            </div>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
`;

    return {
        html,
        images: isPreview ? [] : [
            {
                path: path.join(__dirname, "assets", "bf-fortship-1_1.png"),
                cid: "company-logo"
            }
        ]
    };
}

module.exports = generateHtml;
