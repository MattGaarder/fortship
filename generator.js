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

function generateHtml(report, weather, port, { isPreview = false } = {}) {

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(port.title)} — Line Up</title>
    <style>
        /* --------------------------------
        OVERVIEW
        -------------------------------- */

        .intro-section {
            padding: 20px 24px;
            border-bottom: 1px solid #d1d5db;
            background-color: #ffffff;
        }

        .intro-section p {
            margin: 0 0 10px 0;
            font-size: 14px;
            line-height: 1;
            color: #111827;
        }

        .intro-section p:last-child {
            margin-bottom: 0;
        }

        .weather-section {

            background-color: #D4DDE5;
        }

        .weather-section h2 {
            margin: 0;
            padding: 10px 12px;
            background-color: #1D4369;
            color: #ffffff;
            border: 1px solid #1D4369;
            font-size: 12px;
            line-height: 1.2;
            font-weight: bold;
            text-align: left;
        }

        /* Desktop overview */

        .weather-time {
            float: right;
            color: #6b7280;
            font-size: 11px;
            font-weight: normal;
        }

        .overview-desktop {
            width: 100%;
            background-color: #D4DDE5;
        }

        /* Mobile overview is hidden by default */

        .overview-mobile {
            display: none;
        }

        /* Port image */

        .port-image {
            display: block;
            width: 100%;
            max-width: 100%;
            height: auto;
        }

        /* Weather cards */

        .weather-card {
            border: 1px solid #d1d5db;
            background-color: #ffffff;
            overflow: hidden;
        }

        .weather-card h3 {
            margin: 0;
            padding: 10px 12px;
            background-color: #EAEDF0;
            border-bottom: 1px solid #d1d5db;
            color: #1D4369;
            font-size: 12px;
            line-height: 1.2;
            font-weight: bold;
            text-align: left;
        }

        .weather-icon {
            display: block;
            width: 100px;
            height: 100px;
            margin: 0 auto 10px auto;
        }

        .weather-temperature {
            margin-bottom: 8px;
            color: #1D4369;
            font-size: 22px;
            line-height: 1.1;
            font-weight: bold;
        }

        .weather-value {
            margin-bottom: 4px;
            color: #111827;
            font-size: 14px;
            line-height: 1.4;
        }

        .weather-label {
            color: #6b7280;
            font-size: 12px;
        }

        .weather-main {
            padding: 10px;
        }

        .weather-temperature {
            margin: 0;
            color: #1D4369;
            font-size: 26px;
            line-height: 1.1;
            font-weight: bold;
        }

        .weather-icon {
            display: block;
            width: 50px;
            height: 50px;
            margin: 0;
        }

        .weather-condition {
            margin-top: 6px;
            color: #6b7280;
            font-size: 12px;
            line-height: 1.2;
            text-transform: capitalize;
        }

        .weather-stats-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1px solid #d1d5db;
        }

        .weather-stats-table td {
            width: 50%;
            padding: 8px 6px;
            border-bottom: 1px solid #d1d5db;
            vertical-align: top;
        }

        .weather-stats-table td:first-child {
            border-right: 1px solid #d1d5db;
        }

        .weather-stat-label {
            display: block;
            color: #6b7280;
            font-size: 10px;
            line-height: 1.2;

        }

        .weather-stat-value {
            display: block;
            margin-top: 2px;
            color: #111827;
            font-size: 12px;
            line-height: 1.3;
            font-weight: bold;
        }


        .weather-sun {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding-top: 10px;
            padding-bottom: 10px;
        }

        .weather-sun > div {
            flex: 1;
            text-align: center;
        }

        .weather-sun strong {
            display: block;
            margin-top: 3px;
            color: #1D4369;
            font-size: 12px;
        }



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
        .report-header p {
            margin: 6px 0 0;
            font-size: 14px;
            line-height: 1.4;
        }
        .berth-section {

            padding-top: 12px;
            padding-bottom: 12px;
            background-color: #D4DDE5;

        }
        .berth-section h3 {
            font-size: 13px;
            line-height: 1;
            margin: 0 0 12px 0;
        }
        .shipping-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .shipping-table .col-vessel {
            width: 15%;
        }

        .shipping-table .col-time {
            width: 10%;
        }

        .shipping-table .col-cargo {
            width: 15%;
        }

        .shipping-table .col-quantity {
            width: 9%;
        }

        .shipping-table .col-operation {
            width: 9%;
        }

        .shipping-table .col-remarks {
            width: 12%;
        }

        .shipping-table th,
        .shipping-table td {
            padding: 10px 8px;
            overflow-wrap: break-word;
            word-break: normal;
            vertical-align: middle;
        }

        
        .shipping-table .column-heading th {
            padding: 10px 8px;
            background-color: #1D4369;
            color: #ffffff;
            font-size: 12px;
            line-height: 1.2;
            font-weight: bold;
            text-align: left;
        }
            
        .shipping-table .berth-heading th {
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

        .shipping-table td {
            padding: 10px 8px;
            font-size: 13px;
            line-height: 1.4;
        }


        /* --------------------------------
        MOBILE VERSION
        -------------------------------- */

        .mobile-report {
            display: none;
        }

        .mobile-report {
            width: 100%;
        }

        .mobile-vessel-card {
            width: 100%;
            margin: 0px;
            border: 1px solid #d1d5db;
            background-color: #ffffff;
            box-sizing: border-box;
        }

        .mobile-vessel-name {
            padding: 10px 18px;
            font-size: 14px;
            line-height: 1.4;
            font-weight: bold;
            background-color: #1D4369;
            color: #ffffff;
        }

        .mobile-detail {
            padding: 10px 18px;
            border-bottom: 1px solid #d1d5db;
            background-color: #ffffff;
        }

        .mobile-detail:last-child {
            border-bottom: none;
        }

        .mobile-detail-label {
            display: block;
            margin-bottom: 2px;
            font-size: 9px;
            line-height: 1;
            font-weight: none;
            color: #1D4369;

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

            .intro-section {
                padding: 16px !important;
            }

            .intro-section p {
                font-size: 13px !important;
            }

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
                padding: 0px !important;
            }

            .berth-section h3 {
                margin: 0;
                padding: 10px 18px;
                background-color: #D4DDE5;
                color: #1D4369;
                border: 1px solid #d1d5db;
                border-bottom: none;
                font-size: 13px;
                line-height: 1.2;
                font-weight: bold;
                text-align: left;
            }


            /* -------------------------------
            MOBILE OVERVIEW
            ------------------------------- */

            .overview-desktop {
                display: none !important;
            }

            .overview-mobile {
                display: table !important;
                width: 100% !important;
            }

            .weather-card {
                width: 100% !important;
                border: 1px solid #d1d5db !important;
                background-color: #ffffff !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
            }

            .weather-card h3 {
                margin: 0 !important;
                padding: 10px 12px !important;
                background-color: #EAEDF0 !important;
                border-bottom: 1px solid #d1d5db !important;
                color: #1D4369 !important;
                font-size: 12px !important;
                line-height: 1.2 !important;
                font-weight: bold !important;
                text-align: left !important;
            }

            .weather-main {
                padding: 12px !important;
                text-align: center !important;
            }

            .weather-icon {
                display: block !important;
                width: 50px !important;
                height: 50px !important;
                margin: 0 auto 8px auto !important;
            }

            .weather-temperature {
                margin-bottom: 6px !important;
                color: #1D4369 !important;
                font-size: 20px !important;
                line-height: 1 !important;
                font-weight: bold !important;
            }

            .weather-condition {
                margin-top: 4px !important;
                color: #6b7280 !important;
                font-size: 11px !important;
                line-height: 1.2 !important;
                text-transform: capitalize !important;
            }

            .weather-stats-table {
                width: 100% !important;
                border-collapse: collapse !important;
                border-top: 1px solid #d1d5db !important;
            }

            .weather-stats-table td {
                width: 50% !important;
                padding: 7px 6px !important;
                border-bottom: 1px solid #d1d5db !important;
                vertical-align: top !important;
            }

            .weather-stat-label {
                display: block !important;
                color: #6b7280 !important;
                font-size: 9px !important;
                line-height: 1.2 !important;
            }

            .weather-stat-value {
                display: block !important;
                margin-top: 2px !important;
                color: #111827 !important;
                font-size: 11px !important;
                line-height: 1.3 !important;
                font-weight: bold !important;
            }

            .weather-sun {
                display: table !important;
                width: 100% !important;
                padding: 7px 6px !important;
            }

            .weather-sun > div {
                display: table-cell !important;
                width: 50% !important;
                text-align: center !important;
                padding: 7px 6px !important;
            }

            .weather-sun strong {
                display: block !important;
                margin-top: 3px !important;
                color: #1D4369 !important;
                font-size: 11px !important;
            }

            .weather-stats-table td {
                width: 50%;
                padding: 7px 6px;
                border-bottom: 1px solid #d1d5db;
                vertical-align: top;
            }

            .mobile-weather-row > td {
                display: table-cell !important;
                width: 50% !important;
                padding: 0 !important;
                vertical-align: top !important;
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

                    <!-- INTRODUCTION -->
                    <tr>
                        <td>
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
                        </td>
                    </tr>

                    <!-- HEADER + REPORT -->
                    <tr>
                        <td>

                            <div class="report-header">
                                <table
                                    width="100%"
                                    border="0"
                                    cellpadding="0"
                                    cellspacing="0"
                                >
                                    <tr>
                                        <td align="left" valign="middle">
                                            <h1>
                                                ${escapeHtml(port.title)} Line Up
                                            </h1>
                                        </td>

                                        <td align="right" valign="middle">
                                            <img
                                                src="${isPreview
                                                    ? '/assets/bf-fortship-1_1.png'
                                                    : 'cid:company-logo'}"
                                                alt="Fortship Logo"
                                                style="max-height: 60px;"
                                            >
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- DESKTOP REPORT -->
                            <div class="desktop-report">
                        `;
                                for (const berth of report.berths) {
                                html += `
                                    <table class="shipping-table" width="100%" cellpadding="0" cellspacing="0" border="0">

                                    <colgroup>
                                        <col class="col-vessel">
                                        <col class="col-time">
                                        <col class="col-time">
                                        <col class="col-time">
                                        <col class="col-time">
                                        <col class="col-cargo">
                                        <col class="col-quantity">
                                        <col class="col-operation">
                                        <col class="col-remarks">
                                    </colgroup>

                                    <thead>
                                        <tr class="berth-heading">
                                            <th colspan="9">
                                                ${escapeHtml(berth.name)}
                                            </th>
                                        </tr>

                                        <tr class="column-heading">
                                            <th>Vessel Name</th>
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
                                        <td class="vessel-name">
                                            ${escapeHtml(vessel.name)}
                                        </td>
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
                    <tr>
                        <td>
                            <!-- OVERVIEW -->
                            <div class="weather-section">

                                <h2>Overview</h2>

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
                                                    role="presentation"
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
                                                <div class="weather-sun">
                                                    <div>
                                                        <span class="weather-stat-label">Sunrise</span>
                                                        <strong>${escapeHtml(weather.sunrise)}</strong>
                                                    </div>
                                                    <div>
                                                        <span class="weather-stat-label">Sunset</span>
                                                        <strong>${escapeHtml(weather.sunset)}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td
                                            width="25%"
                                            valign="top"

                                        >
                                            <div class="weather-card">
                                                <h3>
                                                    Night
                                                    <span class="weather-time">21:00</span>
                                                </h3>
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
                                                    role="presentation"
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
                                                        <td>
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.pressure)} hPa
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <span class="weather-stat-label">Cloud cover</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.clouds)}%
                                                            </span>
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
                                                    role="presentation"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    border="0"
                                                >
                                                    <tr>
                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Humidity</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.humidity)}%
                                                            </span>
                                                        </td>

                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Wind</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.windDirection)}
                                                                ${escapeHtml(weather.current.windSpeed)} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Rain</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.rainChance)}%
                                                            </span>
                                                        </td>

                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Visibility</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.visibility)} km
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Feels like</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.feelsLike)}°C
                                                            </span>
                                                        </td>

                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Wind gusts</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.windGust ?? "—")} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.pressure)} hPa
                                                            </span>
                                                        </td>

                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Cloud cover</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.clouds)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </table>

                                                <div class="weather-sun">

                                                    <div>
                                                        <span class="weather-stat-label">Sunrise</span>
                                                        <strong>${escapeHtml(weather.sunrise)}</strong>
                                                    </div>

                                                    <div>
                                                        <span class="weather-stat-label">Sunset</span>
                                                        <strong>${escapeHtml(weather.sunset)}</strong>
                                                    </div>

                                                </div>

                                            </div>
                                        </td>

                                        <!-- NIGHT -->
                                        <td
                                            width="50%"
                                            valign="top"

                                        >
                                            <div class="weather-card">

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
                                                                    ${escapeHtml(weather.current.condition)}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                </div>
                                                <table
                                                    class="weather-stats-table"
                                                    role="presentation"
                                                    cellpadding="0"
                                                    cellspacing="0"
                                                    border="0"
                                                >
                                                    <tr>
                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Humidity</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.humidity)}%
                                                            </span>
                                                        </td>

                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Wind</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.windDirection)}
                                                                ${escapeHtml(weather.night.windSpeed)} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Rain</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.rainChance)}%
                                                            </span>
                                                        </td>

                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Visibility</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.visibility)} km
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Feels like</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.feelsLike)}°C
                                                            </span>
                                                        </td>

                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Wind gusts</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.windGust ?? "—")} km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.pressure)} hPa
                                                            </span>
                                                        </td>

                                                        <td style="width: 50%; padding: 7px 6px; border-bottom: 1px solid #d1d5db; vertical-align: top;">
                                                            <span class="weather-stat-label">Cloud cover</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.clouds)}%
                                                            </span>
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
                path: path.join(__dirname, "assets", "bf-fortship-1_1.png"),
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

module.exports = generateHtml;
