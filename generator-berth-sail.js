const path = require("path");

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const SECTION_HEADINGS = new Set([
    "BUNKERS UPON:",
    "DRAFTS UPON:",
    "TUGS USED UPON:"
]);

const VESSEL_INFORMATION = new Set([
    "VESSEL",
    "VOYAGE",
    "PORT",
    "QUANTITY (UNITS)",
    "CARGO TO LOADING",
    "BERTHING"
]);

function isSectionHeading(label) {
    return SECTION_HEADINGS.has(
        String(label).trim().toUpperCase()
    );
}

function isVesselInformation(label) {
    return VESSEL_INFORMATION.has(
        String(label).trim().toUpperCase()
    );
}


function isBlankRow(row) {
    return (
        !row.label &&
        !row.valueB &&
        !row.valueC
    );
}


function isTimelineRow(row) {
    const label = String(row.label).trim().toUpperCase();

    return (
        label &&
        !isSectionHeading(label) &&
        !isVesselInformation(label) &&
        (
            label === "FREE PRATIQUE GRANTED" ||
            label === "END OF SEA PASSAGE" ||
            label === "ARRIVED AT THE ROADS (DRIFTING)" ||
            label === "NOTICE OF READINESS TENDERED" ||
            label === "ANCHOR DOWN" ||
            label === "ANCHOR AWEIGHT" ||
            label === "POB FOR BERTHING" ||
            label === "FIRST LINE ASHORE" ||
            label === "ALL FAST" ||
            label === "GANGWAY PLACED ASHORE" ||
            label === "CLEARED BY PORT AUTHORITIES" ||
            label === "COMMENCED LOADING" ||
            label === "COMPLETED LOADING" ||
            label === "LASHING/SECURING VESSEL COMPLETED BY CREW FOR SAILING" ||
            label === "POB FOR SAILING" ||
            label === "CAST-OFF" ||
            label === "POB OFF." ||
            label === "NEXT PORT ETA"
        )
    );
}

function generateBerthSailHtml(
    report,
    { isPreview = false } = {}
) {

    const rows = report.rows || [];

    const vesselRows = [];
    const timelineRows = [];
    const bunkersRows = [];
    const draftsRows = [];
    const tugsRows = [];
    let bunkersHeaders = null;
    let draftsHeaders = null;
    let tugsHeaders = null;
    let currentSection = null;
    for (const row of rows) {



        const label = String(row.label ?? "").trim();
        const upperLabel = label.toUpperCase();

        if (isBlankRow(row)) {
            continue;
        }
        if (upperLabel === "BUNKERS UPON:") {
            currentSection = "bunkers";

            bunkersHeaders = {
                label: label.replace(/:$/, ""),
                valueB: row.valueB,
                valueC: row.valueC
            };

            continue;
        }

        if (upperLabel === "DRAFTS UPON:") {
            currentSection = "drafts";

            draftsHeaders = {
                label: label.replace(/:$/, ""),
                valueB: row.valueB,
                valueC: row.valueC
            };

            continue;
        }

        if (upperLabel === "TUGS USED UPON:") {
            currentSection = "tugs";

            tugsHeaders = {
                label: label.replace(/:$/, ""),
                valueB: row.valueB,
                valueC: row.valueC
            };

            continue;
        }

        if (currentSection === "bunkers") {
            bunkersRows.push(row);
            continue;
        }
        if (currentSection === "drafts") {
            draftsRows.push(row);
            continue;
        }
        if (currentSection === "tugs") {
            tugsRows.push(row);
            continue;
        }

        if (isVesselInformation(label)) {
            vesselRows.push(row);
            continue;
        }
        if (isTimelineRow(row)) {
            timelineRows.push(row);
            continue;
        }
        timelineRows.push(row);
    }

    function renderMobileValueRows(sectionRows) {
        let output = "";
        for (const row of sectionRows) {
            if (!row.valueB && !row.valueC) {
                output += `
                    <div class="mobile-detail">
                        <span class="mobile-label">
                            ${escapeHtml(row.label)}
                        </span>
                    </div>
                `;

                continue;
            }

            output += `
                <div class="mobile-detail">
                    <span class="mobile-label">
                        ${escapeHtml(row.label)}
                    </span>

                    <span class="mobile-value">
                        ${escapeHtml(row.valueB)}
                    </span>
                </div>
            `;

            if (row.valueC) {
                output += `
                    <div class="mobile-detail mobile-secondary">
                        <span class="mobile-label">
                        </span>

                        <span class="mobile-value">
                            ${escapeHtml(row.valueC)}
                        </span>
                    </div>
                `;
            }
        }

        return output;
    }

    function renderTwoColumnSection(
        headers,
        sectionRows
    ) {
        if (!headers) {
            return "";
        }

        let html = `
            <table
                class="berth-table"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
            >
                <thead>
                    <tr class="column-heading">
                        <th>
                            ${escapeHtml(headers.label)}
                        </th>
                        <th>
                            ${escapeHtml(headers.valueB)}
                        </th>
                        <th>
                            ${escapeHtml(headers.valueC)}
                        </th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (const [i, row] of sectionRows.entries()) {
            const background =
                i % 2 === 0
                    ? "#ffffff"
                    : "#EAEDF0";
            html += `
                <tr style="background-color: ${background};">
                    <td class="berth-label">
                        ${escapeHtml(row.label)}
                    </td>
                    <td>
                        ${escapeHtml(row.valueB)}
                    </td>
                    <td>
                        ${escapeHtml(row.valueC)}
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
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>
<meta
    name="x-apple-disable-message-reformatting"
>
<title>
 Berthing Report
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



.report-header {
    padding: 24px;
    border-bottom: 1px solid #d1d5db;
}

.report-header h1 {
    margin: 0;
    font-size: 26px;
    line-height: 1.2;
}


.desktop-report {
    display: block;
}

.berth-section {
    background-color: #D4DDE5;
}

.berth-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.berth-table th,
.berth-table td,
.timeline-table th,
.timeline-table td {
    padding: 10px 8px;
    overflow-wrap: break-word;
    word-break: normal;
    vertical-align: middle;
    box-sizing: border-box;
}
.berth-table .berth-label,
.timeline-table .timeline-label {
    padding-left: 30px;
    font-weight: bold;
}

.berth-table .column-heading th {
    background-color: #1D4369;
    color: #ffffff;
    font-size: 12px;
    line-height: 0.5;
    font-weight: bold;
    text-align: left;
}

.berth-table .section-heading th {
    background-color: #D4DDE5;
    color: #1D4369;
    border: 1px solid #d1d5db;
    border-bottom: none;
    font-size: 13px;
    line-height: 1.2;
    font-weight: bold;
    text-align: left;
    padding: 10px 8px;
}

.berth-table td {
    font-size: 13px;
    line-height: 1.4;
}

.berth-table .berth-label {
    width: 42%;
    font-weight: bold;
}

.timeline-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}




/* -------------------------------------------------------
   MOBILE
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
    width: 42%;
    font-weight: bold;
    color: #1D4369;
}

.mobile-value {
    width: 58%;
    overflow-wrap: break-word;
}

.mobile-secondary .mobile-label {
    color: transparent;
}

.mobile-timeline-label {
    width: 52%;
}


/* -------------------------------------------------------
   OVERVIEW
------------------------------------------------------- */

.overview-desktop {
    width: 100%;
    background-color: #D4DDE5;
}

.overview-mobile {
    display: none;
}


/* -------------------------------------------------------
   RESPONSIVE
------------------------------------------------------- */

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

    .berth-section {
        padding: 0 !important;
    }

    .overview-desktop {
        display: none !important;
    }

    .overview-mobile {
        display: table !important;
        width: 100% !important;
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

<tr>

<td>


<!-- =====================================================
     HEADER
===================================================== -->

<div class="report-header">
<table
    width="100%"
    border="0"
    cellpadding="0"
    cellspacing="0"
>
<tr>
<td align="left" valign="middle">
<h1> Berthing Report
</h1>
</td>
<td align="right" valign="middle">
<img
    src="${
        isPreview
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


<!-- =====================================================
     DESKTOP REPORT
===================================================== -->

<div class="desktop-report">
<div class="berth-section">
<table
    class="berth-table"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>
<thead>
<tr class="column-heading">
<th></th><th></th><th></th>
</tr>
</thead>
<tbody>
`;
    /*
     * Vessel information
     */
    for (const [i, row] of vesselRows.entries()) {
        const background =
            i % 2 === 0
                ? "#ffffff"
                : "#EAEDF0";
        html += `
<tr style="background-color: ${background};">
    <td class="berth-label">
        ${escapeHtml(row.label)}
    </td>
    <td colspan="2">
        ${escapeHtml(row.valueB)}
    </td>
</tr>
`;
    }

    html += `

</tbody>

</table>

</div>


<!-- TIMELINE -->

<div class="berth-section">
<table
    class="timeline-table"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
>
<tbody>
`;
    for (const [i, row] of timelineRows.entries()) {
        const background =
            i % 2 === 0 ? "#ffffff" : "#EAEDF0";
        html += `
<tr style="background-color: ${background};">
    <td class="timeline-label">
        ${escapeHtml(row.label)}
    </td>
    <td class="timeline-date">
        ${escapeHtml(row.valueB)}
    </td>
    <td class="timeline-time">
        ${escapeHtml(row.valueC)}
    </td>
</tr>
`;
    }
    html += `
</tbody>

</table>

</div>


<!-- BUNKERS -->
<div class="berth-section">
${renderTwoColumnSection(
    bunkersHeaders,
    bunkersRows
)}
</div>


<!-- DRAFTS -->
<div class="berth-section">
${renderTwoColumnSection(
    draftsHeaders,
    draftsRows
)}
</div>


<!-- TUGS -->
<div class="berth-section">
${renderTwoColumnSection(
    tugsHeaders,
    tugsRows
)}
</div>


</div>


<!-- =====================================================
     MOBILE REPORT
===================================================== -->

<div class="mobile-report">


<!-- VESSEL INFORMATION -->

<div class="mobile-section">

<div class="mobile-section-title">
    Vessel Information
</div>

<div class="mobile-card">

<div class="mobile-card-header">
    Vessel Details
</div>

`;

    html += renderMobileValueRows(vesselRows);

    html += `

</div>

</div>


<!-- TIMELINE -->

<div class="mobile-section">

<div class="mobile-section-title">
    Berthing &amp; Sailing Timeline
</div>

<div class="mobile-card">

<div class="mobile-card-header">
    Events
</div>

`;

    for (const row of timelineRows) {

        html += `

<div class="mobile-detail">

<span class="mobile-label mobile-timeline-label">
    ${escapeHtml(row.label)}
</span>

<span class="mobile-value">

    ${escapeHtml(row.valueB)}

    ${
        row.valueC
            ? `<br>${escapeHtml(row.valueC)}`
            : ""
    }

</span>

</div>

`;
    }

    html += `

</div>

</div>


<!-- BUNKERS -->

<div class="mobile-section">

<div class="mobile-section-title">
    Bunkers Upon
</div>

<div class="mobile-card">

`;

    for (const row of bunkersRows) {

        html += `

<div class="mobile-detail">

<span class="mobile-label">
    ${escapeHtml(row.label)}
</span>

<span class="mobile-value">

    ${escapeHtml(row.valueB)}

    ${
        row.valueC
            ? `<br><strong>Sailing:</strong> ${escapeHtml(row.valueC)}`
            : ""
    }

</span>

</div>

`;
    }

    html += `

</div>

</div>


<!-- DRAFTS -->

<div class="mobile-section">

<div class="mobile-section-title">
    Drafts Upon
</div>

<div class="mobile-card">

`;

    for (const row of draftsRows) {

        html += `

<div class="mobile-detail">

<span class="mobile-label">
    ${escapeHtml(row.label)}
</span>

<span class="mobile-value">

    ${escapeHtml(row.valueB)}

    ${
        row.valueC
            ? `<br><strong>Sailing:</strong> ${escapeHtml(row.valueC)}`
            : ""
    }

</span>

</div>

`;
    }

    html += `

</div>

</div>


<!-- TUGS -->

<div class="mobile-section">

<div class="mobile-section-title">
    Tugs Used Upon
</div>

<div class="mobile-card">

`;

    for (const row of tugsRows) {

        html += `

<div class="mobile-detail">

<span class="mobile-label">
    ${escapeHtml(row.label)}
</span>

<span class="mobile-value">

    ${escapeHtml(row.valueB)}

    ${
        row.valueC
            ? `<br><strong>Sailing:</strong> ${escapeHtml(row.valueC)}`
            : ""
    }
</span>
</div>
`;
    }

    html += `
</div>
</div>
</div>
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


module.exports = generateBerthSailHtml;