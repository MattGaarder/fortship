const path = require("path");

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderSummaryTable(rows) {
    let html = `
        <table
            class="daily-table summary-table"
            width="50%"
            cellpadding="0"
            cellspacing="0"
            border="0"
        >
            <colgroup>
                <col width="25%">
                <col width="25%">
                <col width="25%">
                <col width="25%">
            </colgroup>

            <thead>
                <tr class="column-heading">
                    <th colspan="1">Hold's</th>
                    <th colspan="1">Hold's</th>
                    <th></th>
                    <th></th>
                </tr>
            </thead>

            <tbody>
    `;

    for (const [i, row] of rows.entries()) {
        const background =
            i % 2 === 0
                ? "#ffffff"
                : "#EAEDF0";

        html += `
            <tr style="background-color: ${background};">
                <td colspan="1" class="daily-label">
                    ${escapeHtml(row.label)}
                </td>

                <td colspan="1" class="daily-value">
                    ${escapeHtml(row.value)}
                </td>
            </tr>
        `;
    }

    html += `
            </tbody>
        </table>
    `;

    return html;
}


function renderDischargeSummaryTable(rows) {
    const mtonsRows = rows.filter(row =>
        row.label.includes("(mtons)")
    );

    const unitsRows = rows.filter(row =>
        row.label.includes("(units)")
    );

    function renderGroup(group) {
        if (!group.length) {
            return "";
        }

        let html = `
            <table
                class="daily-table discharge-summary-table"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
            >
                <colgroup>
                    <col width="25%">
                    <col width="25%">
                    <col width="50%">
                </colgroup>

                <thead>
                    <tr class="column-heading">
        `;

        for (const row of group) {
            html += `
                <th>
                    ${escapeHtml(row.label)}
                </th>
            `;
        }

        html += `
                    </tr>
                </thead>

                <tbody>
                    <tr style="background-color: #ffffff;">
        `;

        for (const [i, row] of group.entries()) {
            html += `
                <td class="${i === 2 ? "balance-cell" : ""}">
                    ${escapeHtml(row.value)}
                </td>
            `;
        }

        html += `
                    </tr>
                </tbody>
            </table>
        `;

        return html;
    }

    return `
        ${renderGroup(mtonsRows)}
        ${renderGroup(unitsRows)}
    `;
}


function renderDischargeTable(rows) {
    let html = `
        <table
            class="daily-table discharge-table"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
        >
            <colgroup>
                <col width="25%">
                <col width="25%">
                <col width="25%">
                <col width="25%">
            </colgroup>

            <thead>
                <tr class="column-heading">
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Units</th>
                    <th>Mtons</th>
                </tr>
            </thead>

            <tbody>
    `;

    for (const [i, row] of rows.entries()) {
        const background =
            i % 2 === 0
                ? "#ffffff"
                : "#EAEDF0";

        html += `
            <tr style="background-color: ${background};">
                <td>
                    ${escapeHtml(row.date)}
                </td>

                <td>
                    ${escapeHtml(row.shift)}
                </td>

                <td>
                    ${escapeHtml(row.units)}
                </td>

                <td>
                    ${escapeHtml(row.mtons)}
                </td>
            </tr>
        `;
    }

    html += `
            </tbody>
        </table>
    `;

    return html;
}

function generateDailyReportHtml(
    report,
    { isPreview = false } = {}
) {
    const summary = report.summary || [];
    const dischargeSummary = report.dischargeSummary || [];
    const discharges = report.discharges || [];

    // Convenience lookup for the summary values
    const summaryValue = (label) =>
        summary.find(item => item.label === label)?.value ?? "";

    const dischargeValue = (label) =>
        dischargeSummary.find(item => item.label === label)?.value ?? "";

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">

<title>
    ${escapeHtml(report.vesselName)} — Daily Report
</title>

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
    max-width: 1300px;
    margin: 0 auto;
    background: #ffffff;
}

.balance-cell {
    background-color: #FBCBC6 !important;
}

/* -------------------------------------------------------
   HEADER
------------------------------------------------------- */

.report-header {
    padding: 24px;
    border-bottom: 1px solid #d1d5db;
}

.report-header h1 {
    margin: 0;
    font-size: 26px;
    line-height: 1.2;
}

/* -------------------------------------------------------
   DESKTOP REPORT
------------------------------------------------------- */

.desktop-report {
    display: block;
}

.daily-section {
    background-color: #D4DDE5;
}

.daily-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

/* All table cells share the same spacing */

.daily-table th,
.daily-table td {
    padding: 10px 8px 10px 30px;
    overflow-wrap: break-word;
    word-break: normal;
    vertical-align: middle;
    box-sizing: border-box;
    text-align: left;
}

/* Blue column headings */

.daily-table .column-heading th {
    background-color: #1D4369;
    color: #ffffff;
    font-size: 12px;
    line-height: 1.2;
    font-weight: bold;
}

/* Normal cells */

.daily-table td {
    font-size: 13px;
    line-height: 1.4;
}

/* Label cells */

.daily-label {
    font-weight: bold;
    color: #1D4369;
}


/* -------------------------------------------------------
   ETC/S
------------------------------------------------------- */

.etc-box {
    width: 100%;
    border-top: 1px solid #d1d5db;
    border-collapse: collapse;
}

.etc-cell {
    width: 25%;
    padding: 0;
    vertical-align: top;
}

.etc-spacer {
    width: 75%;
    padding: 0;
}

.etc-label {
    display: block;
    padding: 10px 0px;
    background-color: #1D4369;
    color: #ffffff;
    font-size: 13px;
    line-height: 1.4;
    font-weight: bold;
    text-align: center;
}

.etc-value {
    display: block;
    padding: 12px 0px;
    background-color: #ffffff;
    color: #C00000;
    font-size: 16px;
    line-height: 1.4;
    font-weight: bold;
    text-align: center;
}
/* -------------------------------------------------------
   MOBILE REPORT
------------------------------------------------------- */

.mobile-report {
    display: none;
    width: 100%;
}

.mobile-section {
    width: 100%;
    margin: 0;
    padding: 0;
    background-color: #D4DDE5;
}

.mobile-section-title {
    padding: 10px 18px;
    background-color: #D4DDE5;
    color: #1D4369;
    font-size: 14px;
    line-height: 1.3;
    font-weight: bold;
}

.mobile-card {
    width: 100%;
    margin: 0;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    box-sizing: border-box;
}

.mobile-card-header {
    padding: 10px 18px;
    background-color: #1D4369;
    color: #ffffff;
    font-size: 14px;
    line-height: 1.4;
    font-weight: bold;
}

.mobile-detail {
    display: table;
    width: 100%;
    table-layout: fixed;
    border-bottom: 1px solid #e5e7eb;
    background-color: #ffffff;
}

.mobile-detail:last-child {
    border-bottom: none;
}

.mobile-label,
.mobile-value {
    display: table-cell;
    padding: 9px 12px;
    font-size: 13px;
    line-height: 1.4;
    vertical-align: top;
}

.mobile-label {
    width: 55%;
    font-weight: bold;
    color: #1D4369;
}

.mobile-value {
    width: 45%;
    overflow-wrap: break-word;
}

/* Balance rows */

.mobile-balance {
    background-color: #FBCBC6;
}

.mobile-balance .mobile-label {
    color: #1D4369;
}

.mobile-balance .mobile-value {
    font-weight: bold;
}

/* -------------------------------------------------------
   MOBILE DISCHARGE SUMMARY
------------------------------------------------------- */

.mobile-discharge-summary {
    width: 100%;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    border-collapse: collapse;
    table-layout: fixed;
}

.mobile-discharge-summary th,
.mobile-discharge-summary td {
    padding: 10px 18px;
    font-size: 13px;
    line-height: 1.4;
    text-align: left;
    vertical-align: middle;
}

.mobile-discharge-summary th {
    background-color: #1D4369;
    color: #ffffff;
    font-size: 12px;
    font-weight: bold;
}

.mobile-discharge-summary td {
    background-color: #ffffff;
}

.mobile-discharge-summary .discharge-type {
    width: 18%;
    font-weight: bold;
    color: #1D4369;
}

.mobile-discharge-summary td.balance-cell {
    background-color: #FBCBC6 !important;
    font-weight: bold;
}

/* -------------------------------------------------------
   MOBILE DISCHARGE LOG
------------------------------------------------------- */

.mobile-discharge-card {
    width: 100%;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    box-sizing: border-box;
}

.mobile-discharge-card div {
    display: table;
    width: 100%;
    table-layout: fixed;
    box-sizing: border-box;
    border-bottom: 1px solid #e5e7eb;
}

.mobile-discharge-card div:last-child {
    border-bottom: none;
}

.mobile-discharge-card div:nth-child(even) {
    background-color: #EAEDF0;
}

.mobile-discharge-label,
.mobile-discharge-card div span:last-child {
    display: table-cell;
    vertical-align: middle;
    padding-top: 9px;
    padding-bottom: 9px;
    font-size: 13px;
    line-height: 1.4;
}

.mobile-discharge-label {
    width: 45%;
    padding-left: 18px;
    padding-right: 9px;
    font-weight: bold;
    color: #1D4369;
}

.mobile-discharge-card div span:last-child {
    width: 55%;
    padding-left: 9px;
    padding-right: 18px;
    overflow-wrap: break-word;
}

/* -------------------------------------------------------
   MOBILE ETC/S
------------------------------------------------------- */

.mobile-etc-card {
    width: 100%;
    margin: 0;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    box-sizing: border-box;
}

.mobile-etc-header {
    padding: 10px 18px;
    background-color: #1D4369;
    color: #ffffff;
    font-size: 14px;
    line-height: 1.4;
    font-weight: bold;
}

.mobile-etc-value {
    padding: 12px 18px;
    background-color: #ffffff;
    color: #C00000;
    font-size: 17px;
    line-height: 1.4;
    font-weight: bold;
}

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

    .mobile-section {
        padding: 0 !important;
    }
}

</style>
</head>

<body>

<table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>
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

<!-- HEADER -->

<tr>
<td>

<div class="report-header">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>
<tr>

<td>
    <h1>Daily Report</h1>
    <p>${escapeHtml(report.vesselName)}</p>
</td>

<td align="right">
    <img
        src="${isPreview
            ? "/assets/bf-fortship-1_1.png"
            : "cid:company-logo"
        }"
        alt="Fortship Logo"
        style="max-height: 60px;"
    >
</td>

</tr>
</table>

</div>

</td>
</tr>


<!-- DESKTOP -->

<tr>
<td>

<div class="desktop-report">

<!-- SUMMARY -->

<div class="section">

<div class="daily-section">

${renderSummaryTable(summary)}

</div>

</div>


<!-- DISCHARGE SUMMARY -->

<div class="daily-section">

${renderDischargeSummaryTable(dischargeSummary)}

</div>


<!-- DISCHARGE LOG -->

<div class="section">

<div class="daily-section">
${renderDischargeTable(discharges)}
<table
    class="etc-box"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>
    <tr>
        <td
            width="25%"
            class="etc-cell"
        >
            <div class="etc-label">
                ETC/S
            </div>

            <div class="etc-value">
                ${escapeHtml(report.etcs || "—")}
            </div>
        </td>

        <td
            width="75%"
            class="etc-spacer"
        >
            &nbsp;
        </td>
    </tr>
</table>
</div>

</div>

</div>


<!-- MOBILE -->

<div class="mobile-report">

<div class="mobile-section">
    <div class="mobile-card">

        <div class="mobile-card-header">
            Cargo Summary
        </div>

        <div class="mobile-detail">
            <span class="mobile-label">
                Total Manifested (mtons)
            </span>
            <span class="mobile-value">
                ${escapeHtml(summaryValue("Total Manifested (mtons)"))}
            </span>
        </div>

        <div class="mobile-detail">
            <span class="mobile-label">
                Total Manifested (units)
            </span>
            <span class="mobile-value">
                ${escapeHtml(summaryValue("Total Manifested (units)"))}
            </span>
        </div>

        <div class="mobile-detail">
            <span class="mobile-label">
                Discharged Daily (mtons)
            </span>
            <span class="mobile-value">
                ${escapeHtml(summaryValue("Discharged Daily (mtons)"))}
            </span>
        </div>

        <div class="mobile-detail mobile-balance">
            <span class="mobile-label">
                Balance to go (mtons)
            </span>
            <span class="mobile-value">
                ${escapeHtml(summaryValue("Balance to go (mtons)"))}
            </span>
        </div>

        <div class="mobile-detail">
            <span class="mobile-label">
                Discharged Daily (units)
            </span>
            <span class="mobile-value">
                ${escapeHtml(summaryValue("Discharged Daily (units)"))}
            </span>
        </div>

        <div class="mobile-detail mobile-balance">
            <span class="mobile-label">
                Balance to go (units)
            </span>
            <span class="mobile-value">
                ${escapeHtml(summaryValue("Balance to go (units)"))}
            </span>
        </div>

    </div>

</div>

<div class="mobile-section">

    <div class="mobile-card">

        <table class="mobile-discharge-summary">

            <thead>
                <tr>
                    <th></th>
                    <th>Manifested</th>
                    <th>Discharged</th>
                    <th>Balance</th>
                </tr>
            </thead>

            <tbody>

                <tr>
                    <td class="discharge-type">
                        Mtons
                    </td>

                    <td>
                        ${escapeHtml(
                            dischargeValue("Manifested (mtons)")
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            dischargeValue("Total Discharged (mtons)")
                        )}
                    </td>

                    <td class="balance-cell">
                        ${escapeHtml(
                            dischargeValue("Balance to go (mtons)")
                        )}
                    </td>
                </tr>

                <tr>
                    <td class="discharge-type">
                        Units
                    </td>

                    <td>
                        ${escapeHtml(
                            dischargeValue("Manifested (units)")
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            dischargeValue("Total Discharged (units)")
                        )}
                    </td>

                    <td class="balance-cell">
                        ${escapeHtml(
                            dischargeValue("Balance to go (units)")
                        )}
                    </td>
                </tr>

            </tbody>

        </table>

    </div>

</div>


<div class="section">
`;

    for (const discharge of discharges) {

        html += `
<div class="mobile-discharge-card">

    <div>
        <span class="mobile-discharge-label">Date</span>
        <span>${escapeHtml(discharge.date)}</span>
    </div>

    <div>
        <span class="mobile-discharge-label">Shift</span>
        <span>${escapeHtml(discharge.shift)}</span>
    </div>

    <div>
        <span class="mobile-discharge-label">Units</span>
        <span>${escapeHtml(discharge.units)}</span>
    </div>

    <div>
        <span class="mobile-discharge-label">Mtons</span>
        <span>${escapeHtml(discharge.mtons)}</span>
    </div>

</div>
`;
    }

    html += `
<div class="mobile-section">

    <div class="mobile-etc-card">

        <div class="mobile-etc-header">
            ETC/S
        </div>

        <div class="mobile-etc-value">
            ${escapeHtml(report.etcs || "—")}
        </div>

    </div>

</div>

</div>

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
        images: isPreview
            ? []
            : [
                {
                    path: path.join(
                        __dirname,
                        "assets",
                        "bf-fortship-1_1.png"
                    ),
                    cid: "company-logo"
                }
            ]
    };
}

module.exports = generateDailyReportHtml;