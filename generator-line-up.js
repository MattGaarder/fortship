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

function generateLineUpHtml(report, weather, port, { isPreview = false } = {}) {

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(port.title)} — Line Up</title>
    <style>
/* =====================================================
   BASE
===================================================== */

body {
    margin: 0;
    padding: 0;
    background: #ffffffff;
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


/* =====================================================
   HEADER
===================================================== */

.report-header {
    padding: 10px 0px 10px 10px;
}

.report-header h1 {
    margin: 0;
    font-size: 12px;
    line-height: 1.2;
}

.intro-section p {
    margin: 0 0 4px 0;
    padding: 0;
    font-size: 12px;
    line-height: 1.2;
    
}

.intro-section {
    padding: 0px;
    margin-top: 50px;
}


/* =====================================================
   DESKTOP LINE-UP
===================================================== */

.desktop-report {
    display: block !important;
}

.shipping-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

/* EXACTLY the same cell spacing as the original */
.shipping-table th,
.shipping-table td {
    padding: 6px 0px 6px 10px;
    overflow-wrap: break-word;
    word-break: normal;
    vertical-align: middle;
    box-sizing: border-box;
    text-align: left;
}

/* Desktop body cells */
.shipping-table td {
    font-size: 10px;
    line-height: 1;
}

/* Column headings */
.shipping-table .column-heading th {
    font-size: 10px;
    line-height: 1;
    background-color: #1D4369;
    color: white;
}


.shipping-table .berth-heading th {
    background-color: #D4DDE5;
    color: #1D4369;
    font-size: 10px;
    line-height: 1;
    font-weight: bold;
    text-align: left;
}

/* Vessel name */

.shipping-table .vessel-name {
    font-weight: bold;
    color: #1D4369;
}

/* Time columns */

.shipping-table .col-time-cell {
    text-align: left;
    padding-left: 8px;
    padding-right: 8px;
}

/* Quantity / operation */

.shipping-table .operation-cell {
    text-align: left;
    padding-left: 8px;
    padding-right: 8px;
}

/* Berth heading */




/* =====================================================
   MOBILE LINE-UP
===================================================== */

.mobile-report {
    display: none !important;
    width: 100%;
}

.berth-section {
    width: 100%;
    margin: 0;
    padding: 0;
    background-color: #D4DDE5;
}

/* EXACTLY the original mobile section title */

.berth-section h3 {
    margin: 0;
    padding: 10px 18px;
    background-color: #D4DDE5;
    color: #1D4369;
    font-size: 14px;
    line-height: 1.3;
    font-weight: bold;
}

.mobile-vessel-card {
    width: 100%;
    margin: 0;
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    box-sizing: border-box;
}

/* Vessel name/header */

.mobile-vessel-name {
    padding: 10px 18px;
    background-color: #1D4369;
    color: #ffffff;
    font-size: 14px;
    line-height: 1.4;
    font-weight: bold;
}

/* Detail rows */

.mobile-detail {
    display: table;
    width: 100%;
    table-layout: fixed;
    border-bottom: 1px solid #e5e7eb;
    background-color: #ffffff;
    box-sizing: border-box;
}

.mobile-detail:last-child {
    border-bottom: none;
}

.mobile-detail-label,
.mobile-detail-value {
    display: table-cell;
    padding: 9px 12px;
    font-size: 13px;
    line-height: 1.4;
    vertical-align: top;
}

.mobile-detail-label {
    width: 55%;
    font-weight: bold;
    color: #1D4369;
    text-align: left;
}

.mobile-detail-value {
    width: 45%;
    text-align: right;
    overflow-wrap: break-word;
}

/* =====================================================
   OVERVIEW
===================================================== */

.weather-section {
    background-color: #ffffffff;
}

/*
   Important:
   the HTML parser inserts <tbody> into the overview table,
   so don't rely on "> tr > td".
*/

.overview-desktop {
    display: table !important;
    width: 100%;
    table-layout: fixed;
}

.overview-desktop td {
    padding: 0px;
    vertical-align: top;
}

.overview-desktop h2 {
    margin: 0;
    padding: 6px 0px 6px 10px;
    color: #fff;
    font-size: 10px;
    line-height: 1.2;
    background-color: #1D4369;
}

.overview-mobile {
    display: none !important;
}

.port-image {
    display: block;
    width: 100%;
    height: auto;
}

.weather-card {
    background-color: #ffffff;
    color: #000000;
    box-sizing: border-box;
}

.weather-card h3 {
    margin: 0;
    padding: 7px 6px;
    background-color: #1D4369;
    color: #ffffff;
    font-size: 10px;
    line-height: 1;
    font-weight: bold;
    text-align: left;
}

.weather-time {
    float: right;
    font-size: 10px;
    font-weight: normal;
    line-height: 1;
}

/* Main temperature / condition area */

.weather-hero,
.weather-main {
    background-color: #ffffff;
    color: #000000;
}

.weather-hero {
    padding: 6px 10px;
    text-align: left;
}

.weather-temperature {
    font-size: 16px;
    line-height: 1.2;
    font-weight: bold;
    color: #1D4369;
}

.weather-icon {
    display: block;
}

.weather-condition {
    margin: 2px 0 0 0;
    color: #000000;
    font-size: 10px;
    line-height: 1.2;
}

/* Weather statistics */

.weather-stats-table {
    width: 100%;
    margin: 0;
    background-color: #ffffff;
    color: #000000;
}

.weather-stats-table td {
    width: 50%;
    padding: 6px 10px;
    border: 0;
    vertical-align: top;
    font-size: 10px;
    line-height: 1.2;
}

/* Alternating weather rows */
.weather-stats-table tr:nth-child(even) td {
    background-color: #EAEDF0;
}

.weather-stat-label {
    display: block;
    color: #1D4369;
    font-size: 10px;
    line-height: 1.2;
    font-weight: bold;
}

.weather-stat-value {
    display: block;
    color: #000000;
    font-size: 10px;
    line-height: 1.2;
    font-weight: normal;
}

/* Sunrise / sunset */

.weather-sun-table {
    width: 100%;
    margin: 0;
    background-color: #ffffff;
}

.weather-sun-table td {
    padding: 6px 10px;
    border: 0;
    background-color: #EAEDF0;
    text-align: left;
}

.weather-sun-label {
    color: #1D4369;
    font-size: 10px;
    line-height: 1.2;
    font-weight: bold;
}

.weather-sun-value {
    display: inline;
    margin-left: 6px;
    color: #000000;
    font-size: 10px;
    line-height: 1.2;
    font-weight: normal;
}


/* =====================================================
   MOBILE RESPONSIVENESS
===================================================== */

@media only screen and (max-width: 600px) {

    body {
        padding: 0 !important;
    }

    .email-container {
        width: 100% !important;
        max-width: 100% !important;
    }


    /* Switch Line-Up */

    .desktop-report {
        display: none !important;
    }

    .mobile-report {
        display: block !important;
    }


    /* Switch Overview */

    .overview-desktop {
        display: none !important;
    }

    .overview-mobile {
        display: table !important;
        width: 100% !important;
        table-layout: fixed !important;
    }

    .report-header {
        padding: 0px 10px 10px 10px;
        border-bottom: 1px solid #d1d5db;
    }

    .report-header h1 {
        margin: 0;
        font-size: 12px;
        line-height: 1.2;
    }


    /* Mobile report */

    .berth-section {
        padding: 0 !important;
    }

    .berth-section h3 {
        padding: 10px 18px;
    }

    .mobile-vessel-name {
        padding: 10px 18px;
    }

    .mobile-detail-label,
    .mobile-detail-value {
        padding: 9px 12px;
    }


    /* Mobile overview */

    .overview-mobile .port-image {
        width: 100% !important;
        max-width: 100% !important;
    }

    .overview-mobile .weather-card {
        width: 100%;
    }

    .overview-mobile .weather-temperature {
        font-size: 24px;
    }

    .overview-mobile .weather-condition {
        font-size: 12px;
    }

    .overview-mobile .weather-stat-label {
        font-size: 10px;
    }

    .overview-mobile .weather-stat-value {
        font-size: 12px;
    }
}
    </style>

</head>

<body>


    <!-- =====================================================
         INTRO + LOGO — outside .email-container so the logo
         can bleed to the full viewport width (issue 10)
    ====================================================== -->
    <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="background-color:#ffffff;"
    >
        <tr>
            <td style="padding: 16px 0px 10px 0px; vertical-align: top;">

                <table
                    role="presentation"
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                >
                    <tr>
                        <td
                            valign="top"
                            style="padding: 0px 0px 0px 10px;
                                vertical-align: top;
                                font-size: 12px;
                                margin: 0;
                                line-height: 1;"
                        >

                            <!-- Logo floats over the right side -->
                            <img
                                src="${isPreview
                                    ? '/assets/Logo-Claro-Fortship.png'
                                    : 'cid:company-logo'}"
                                class="logo-img"
                                alt="Fortship Logo"
                                width="280"
                                style="
                                    display:block;
                                    float:right;
                                    width: 280px;
                                    max-width:none;
                                    height:auto;
                                    margin: 0 0 0px 0px;
                                "
                            >

                            <div class="intro-section">
                                <p>Dear All,</p>

                                <p>
                                    Please find below the latest line-up for the
                                    <strong>${escapeHtml(port.title)}</strong>,
                                    provided for your reference and guidance.
                                </p>

                                <p>
                                    Kindly note that the information contained
                                    in this line-up is subject to change without
                                    prior notice and is based on AGW/WP.
                                </p>
                            </div>

                            <!-- Clear the float -->
                            <div style="clear:both;"></div>

                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

    <!-- =====================================================
         MAIN REPORT TABLE
    ====================================================== -->
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

                    <!-- HEADER (title only — logo is above) -->
                    <tr>
                        <td>
                            <div class="report-header">
                                <h1>${escapeHtml(port.title)} Line Up</h1>
                            </div>

                            <!-- DESKTOP REPORT — shown by default (issue 11 fallback) -->
                            <!-- inline style ensures non-media-query clients always see desktop -->
                            <div class="desktop-report">
                                <table class="shipping-table" width="100%" cellpadding="0" cellspacing="0" border="0">

                                    <colgroup>
                                        <col style="width: 16%;" class="col-vessel">
                                        <col style="width: 9%;" class="col-time">
                                        <col style="width: 9%;" class="col-time">
                                        <col style="width: 9%;" class="col-time">
                                        <col style="width: 9%;" class="col-time">
                                        <col style="width: 15%;" class="col-cargo">
                                        <col style="width: 10%;" class="col-quantity">
                                        <col style="width: 10%;" class="col-operation">
                                        <col style="width: 13%;" class="col-remarks">
                                    </colgroup>

                                    <thead>
                                        <tr class="column-heading">
                                            <th>Vessel Name</th>
                                            <th class="col-time-cell">ETA</th>
                                            <th class="col-time-cell">ETB</th>
                                            <th class="col-time-cell">ETC</th>
                                            <th class="col-time-cell">ETD</th>
                                            <th>Cargo</th>
                                            <th class="operation-cell">Quantity</th>
                                            <th>Operation</th>
                                            <th>Remarks</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                            `;

                            for (const berth of report.berths) {

                                html += `
                                    <tr class="berth-heading">
                                        <th colspan="9">
                                            ${escapeHtml(berth.name)}
                                        </th>
                                    </tr>
                            `;

                                for (const [i, vessel] of berth.vessels.entries()) {
                                    const rowBg = i % 2 === 0 ? "#ffffff" : "#EAEDF0";

                                    html += `
                                        <tr style="background-color: ${rowBg};">
                                            <td class="vessel-name">
                                                ${escapeHtml(vessel.name)}
                                            </td>
                                            <td class="col-time-cell">${escapeHtml(vessel.eta)}</td>
                                            <td class="col-time-cell">${escapeHtml(vessel.etb)}</td>
                                            <td class="col-time-cell">${escapeHtml(vessel.etc)}</td>
                                            <td class="col-time-cell">${escapeHtml(vessel.etd)}</td>
                                            <td>${escapeHtml(vessel.cargo)}</td>
                                            <td>${escapeHtml(vessel.quantity)}</td>
                                            <td>${escapeHtml(vessel.operation)}</td>
                                            <td>${escapeHtml(vessel.remarks)}</td>
                                        </tr>
                                    `;
                                }
                            }

                            html += `
                                    </tbody>
                                </table>
                            </div>

                            <!-- MOBILE REPORT — hidden by default (issue 11 fallback) -->
                            <!-- inline style hides it; @media overrides to display:block on small screens -->
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
        `;

        const details = [
            ["ETA", vessel.eta],
            ["ETB", vessel.etb],
            ["ETC", vessel.etc],
            ["ETD", vessel.etd],
            ["Cargo", vessel.cargo],
            ["Quantity", vessel.quantity],
            ["Operation", vessel.operation],
            ["Remarks", vessel.remarks]
        ];

        details.forEach(([label, value], index) => {
            const rowBg = index % 2 === 0 ? "#ffffff" : "#EAEDF0";

            html += `
                <div class="mobile-detail" style="background-color: ${rowBg};">
                    <span class="mobile-detail-label">${label}</span>
                    <span class="mobile-detail-value">${escapeHtml(value)}</span>
                </div>
            `;
        });

        html += `
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
                    <tr>
                        <td>
                            <!-- OVERVIEW -->
                            <div class="weather-section">

                            
                                <!-- DESKTOP OVERVIEW -->
                                <table
                                class="overview-desktop"
                                role="presentation"
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                                >
                                <tr>
                                    
                                    <!-- PORT -->
                                    <td
                                    width="50%"
                                    valign="top"
                                    >
                                        <h2>Overview</h2>
                                            <img
                                                src="${isPreview
                                                    ? `/assets/ports/${port.image}`
                                                    : 'cid:port-image'}"
                                                class="port-image"
                                                alt="${escapeHtml(port.title)}"
                                                width="100%"
                                            >
                                        </td>

                                        <!-- DAY -->
                                        <td
                                            width="25%"
                                            valign="top"
                                        >
                                            <div class="weather-card">
                                                <h3>Day</h3>
                                                <div class="weather-hero">
                                                    <table
                                                        role="presentation"
                                                        cellpadding="0"
                                                        cellspacing="0"
                                                        border="0"
                                                    >
                                                        <tr>

                                                            <td valign="middle">
                                                                <div class="weather-temperature">
                                                                    ${escapeHtml(weather.current.temperature)}°C
                                                                </div>
                                                            </td>

                                                            <td valign="middle">
                                                                <img
                                                                    src="${isPreview
                                                                        ? `/assets/weather/${weather.current.icon}.png`
                                                                        : 'cid:weather-day-icon'}"
                                                                    class="weather-icon"
                                                                    alt="${escapeHtml(weather.current.condition)}"
                                                                    width="64"
                                                                    height="64"
                                                                >
                                                            </td>

                                                        </tr>
                                                    </table>

                                                    <div class="weather-condition">
                                                        ${escapeHtml(weather.current.condition)}
                                                    </div>

                                                </div>
                                                <table
                                                    class="weather-stats-table"
                                                    align="center"
                                                    role="presentation"
                                                    width="90%"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    border="0"
                                                   
                                                >
                                                    <tr>
                                                        <td >
                                                            <span class="weather-stat-label">Humidity</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.humidity)}%
                                                            </span>
                                                        </td>

                                                        <td >
                                                            <span class="weather-stat-label">Wind</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.windDirection)}
                                                                ${escapeHtml(weather.current.windSpeed)} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Rain</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.rainChance)}%
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Visibility</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.visibility)} km
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Feels like</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.feelsLike)}°C
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Wind gusts</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.windGust ?? "—")} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 50%; padding: 1px 0px 13px 12px; border: 0; vertical-align: top;">
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.pressure)} hPa
                                                            </span>
                                                        </td>

                                                        <td style="width: 50%; padding: 1px 0px 13px 12px; border: 0; vertical-align: top;">
                                                            <span class="weather-stat-label">Cloud cover</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.clouds)}%
                                                            </span>
                                                        </td>

                                                    </tr>
                                                </table>
                                                <!-- Sunrise (Day card only) — HTML table for Outlook centering (issue 2) -->
                                                <table
                                                    class="weather-sun-table"
                                                    align="center"
                                                    role="presentation"
                                                    width="90%"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    border="0"
                                                    style="width:90%; margin:6px auto 12px; background-color:#2d5882;"
                                                >
                                                    <tr>
                                                        <td align="center" style="width:100%; text-align:center; padding:8px 4px;">
                                                            <span class="weather-sun-label">Sunrise</span>
                                                            <span class="weather-sun-value">${escapeHtml(weather.sunrise)}</span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                        <td
                                            width="25%"
                                            valign="top"

                                        >
                                            <div class="weather-card night-card">
                                                <h3>
                                                    Night
                                                    <span class="weather-time">21:00</span>
                                                </h3>
                                                <div class="weather-hero">

                                                    <table
                                                        role="presentation"
                                                        cellpadding="0"
                                                        cellspacing="0"
                                                        border="0"
                                                    >
                                                        <tr>

                                                            <td valign="middle">
                                                                <div class="weather-temperature">
                                                                    ${escapeHtml(weather.night.temperature)}°C
                                                                </div>
                                                            </td>

                                                            <td valign="middle">
                                                                <img
                                                                    src="${isPreview
                                                                        ? `/assets/weather/${weather.night.icon}.png`
                                                                        : 'cid:weather-night-icon'}"
                                                                    class="weather-icon"
                                                                    alt="${escapeHtml(weather.night.condition)}"
                                                                    width="64"
                                                                    height="64"
                                                                >
                                                            </td>

                                                        </tr>
                                                    </table>

                                                    <div class="weather-condition">
                                                        ${escapeHtml(weather.night.condition)}
                                                    </div>

                                                </div>

                                                <table
                                                    class="weather-stats-table"
                                                    align="center"
                                                    role="presentation"
                                                    width="90%"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    border="0"
                                                   
                                                >
                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Humidity</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.humidity)}%
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Wind</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.windDirection)}
                                                                ${escapeHtml(weather.night.windSpeed)} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Rain</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.rainChance)}%
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Visibility</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.visibility)} km
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Feels like</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.feelsLike)}°C
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Wind gusts</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.windGust ?? "—")} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 50%; padding: 1px 0px 13px 12px; border: 0; vertical-align: top;">
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.pressure)} hPa
                                                            </span>
                                                        </td>

                                                        <td style="width: 50%; padding: 1px 0px 13px 12px; border: 0; vertical-align: top;">
                                                            <span class="weather-stat-label">Cloud cover</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.clouds)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <!-- Sunset (Night card only) — HTML table for Outlook centering (issue 2) -->
                                                <table
                                                    class="weather-sun-table"
                                                    align="center"
                                                    role="presentation"
                                                    width="90%"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    border="0"
                                                    style="width:90%; margin:6px auto 12px; background-color:#2d5882;"
                                                >
                                                    <tr>
                                                        <td align="center" style="width:100%; text-align:center; padding:8px 4px;">
                                                            <span class="weather-sun-label">Sunset</span>
                                                            <span class="weather-sun-value">${escapeHtml(weather.sunset)}</span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>

                                    </tr>
                                </table>


                                <!-- MOBILE OVERVIEW -->
                                <table
                                    class="overview-mobile"
                                    role="presentation"
                                    width="100%"
                                    cellpadding="0"
                                    cellspacing="0"
                                    border="0"
                                    style="width: 100%; table-layout: fixed;"
                                >

                                    <!-- PORT IMAGE -->
                                    <tr>
                                        <td
                                            colspan="2"
                                            valign="top"

                                        >
                                            <img
                                                src="${isPreview
                                                    ? `/assets/ports/${port.image}`
                                                    : 'cid:port-image'}"
                                                class="port-image"
                                                alt="${escapeHtml(port.title)}"
                                                width="100%"
                                            >
                                        </td>
                                    </tr>

                                    <!-- WEATHER CARDS -->
                                    <tr class="mobile-weather-row">

                                        <!-- DAY -->
                                        <td
                                            width="50%"
                                            valign="top"

                                        >
                                            <div class="weather-card">

                                                <h3>Day</h3>

                                                <div class="weather-main">

                                                    <table
                                                        role="presentation"
                                                        width="100%"
                                                        cellpadding="0"
                                                        cellspacing="0"
                                                        border="0"
                                                    >
                                                        <tr>
                                                            <td
                                                                width="60%"
                                                                valign="middle"
                                                                align="left"
                                                            >
                                                                <div class="weather-temperature">
                                                                    ${escapeHtml(weather.current.temperature)}°C
                                                                </div>
                                                            </td>

                                                            <td
                                                                width="40%"
                                                                valign="middle"
                                                                align="right"
                                                            >
                                                                <img
                                                                    src="${isPreview
                                                                        ? `/assets/weather/${weather.current.icon}.png`
                                                                        : 'cid:weather-day-icon'}"
                                                                    class="weather-icon"
                                                                    alt="${escapeHtml(weather.current.condition)}"
                                                                    width="50"
                                                                    height="50"
                                                                >
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <td colspan="2" align="left">
                                                                <div class="weather-condition">
                                                                    ${escapeHtml(weather.current.condition)}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                </div>

                                                <table
                                                    class="weather-stats-table"
                                                    align="center"
                                                    role="presentation"
                                                    width="90%"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    border="0"
                                                    
                                                >
                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Humidity</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.humidity)}%
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Wind</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.windDirection)}
                                                                ${escapeHtml(weather.current.windSpeed)} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Rain</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.rainChance)}%
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Visibility</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.visibility)} km
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Feels like</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.feelsLike)}°C
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Wind gusts</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.windGust ?? "—")} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.pressure)} hPa
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Cloud cover</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.clouds)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </table>

                                                <!-- Mobile Day card: Sunrise only (issue 8) -->
                                                <table
                                                    class="weather-sun-table"
                                                    align="center"
                                                    role="presentation"
                                                    width="90%"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    border="0"
                                                   
                                                >
                                                    <tr>
                                                        <td align="center" >
                                                            <span class="weather-sun-label">Sunrise</span>
                                                            <span class="weather-sun-value">${escapeHtml(weather.sunrise)}</span>
                                                        </td>
                                                    </tr>
                                                </table>

                                            </div>
                                        </td>

                                        <!-- NIGHT -->
                                        <td
                                            width="50%"
                                            valign="top"

                                        >
                                            <div class="weather-card night-card">

                                                <h3>Night <span class="weather-time">21:00</span></h3>

                                                <div class="weather-main">

                                                    <table
                                                        role="presentation"
                                                        width="100%"
                                                        cellpadding="0"
                                                        cellspacing="0"
                                                        border="0"
                                                    >
                                                        <tr>
                                                            <td
                                                                width="60%"
                                                                valign="middle"
                                                                align="left"
                                                            >
                                                                <div class="weather-temperature">
                                                                    ${escapeHtml(weather.night.temperature)}°C
                                                                </div>
                                                            </td>

                                                            <td
                                                                width="40%"
                                                                valign="middle"
                                                                align="right"
                                                            >
                                                                <img
                                                                    src="${isPreview
                                                                        ? `/assets/weather/${weather.night.icon}.png`
                                                                        : 'cid:weather-night-icon'}"
                                                                    class="weather-icon"
                                                                    alt="${escapeHtml(weather.night.condition)}"
                                                                    width="50"
                                                                    height="50"
                                                                >
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <td colspan="2" align="left">
                                                                <div class="weather-condition">
                                                                    ${escapeHtml(weather.night.condition)}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                </div>
                                                <table
                                                    class="weather-stats-table"
                                                    align="center"
                                                    role="presentation"
                                                    width="90%"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    border="0"
                                                    
                                                >
                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Humidity</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.humidity)}%
                                                            </span>
                                                        </td>

                                                        <td >
                                                            <span class="weather-stat-label">Wind</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.windDirection)}
                                                                ${escapeHtml(weather.night.windSpeed)} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Rain</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.rainChance)}%
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Visibility</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.visibility)} km
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Feels like</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.feelsLike)}°C
                                                            </span>
                                                        </td>

                                                        <td >
                                                            <span class="weather-stat-label">Wind gusts</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.windGust ?? "—")} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.pressure)} hPa
                                                            </span>
                                                        </td>

                                                        <td >
                                                            <span class="weather-stat-label">Cloud cover</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.clouds)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </table>

                                                <!-- Mobile Night card: Sunset only (issue 8) -->
                                                <table
                                                    class="weather-sun-table"
                                                    align="center"
                                                    role="presentation"
                                                    width="90%"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    border="0"
                                                    
                                                >
                                                    <tr>
                                                        <td align="center" >
                                                            <span class="weather-sun-label">Sunset</span>
                                                            <span class="weather-sun-value">${escapeHtml(weather.sunset)}</span>
                                                        </td>
                                                    </tr>
                                                </table>

                                            </div>
                                        </td>

                                    </tr>
                                </table>

                            </div>
                        </td>
                    </tr>
                </table>
                
</body>
</html>
`;
    const weatherDayIconPath = path.join(
        __dirname,
        "assets",
        "weather",
        `${weather.current.icon}.png`
    );

    const weatherNightIconPath = path.join(
        __dirname,
        "assets",
        "weather",
        `${weather.night.icon}.png`
    );
    return {
        html,
        images: isPreview ? [] : [
            {
                path: path.join(__dirname, "assets", "Logo-Claro-Fortship.png"),
                cid: "company-logo"
            },
            {
                path: weatherDayIconPath,
                cid: "weather-day-icon"
            },
            {
                path: weatherNightIconPath,
                cid: "weather-night-icon"
            },
            {
                path: path.join(__dirname, "assets", "ports", port.image),
                cid: "port-image"
            }
        ]
    };
}

module.exports = generateLineUpHtml;
