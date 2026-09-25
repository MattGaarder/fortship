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
        body {
            margin: 0;
            padding: 0;
            background: #ffffffff;
            font-family: Arial, Helvetica, sans-serif;
        }

        .email-header-cell {
            padding: 16px 0px 10px 0px;

        }

        .logo-intro-cell {
            padding: 0 0 0 10px;

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

        .desktop-report {
            display: block !important;
        }

        .shipping-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .shipping-table th,
        .shipping-table td {
            padding: 6px 0px 6px 10px;
            overflow-wrap: break-word;
            word-break: normal;
            vertical-align: middle;
            box-sizing: border-box;
            text-align: left;
        }

        .shipping-table td {
            font-size: 10px;
            line-height: 1;
        }

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

        .shipping-table .vessel-name {
            font-weight: bold;
            color: #1D4369;
        }

        .shipping-table .col-time-cell {
            text-align: left;
            padding-left: 8px;
            padding-right: 8px;
        }

        .shipping-table .operation-cell {
            text-align: left;
            padding-left: 8px;
            padding-right: 8px;
        }

        .mobile-report {
            display: none !important;
            width: 100%;
        }

        .berth-section {
            width: 100%;
            background-color: #D4DDE5;
        }

        .berth-section h3,
        .mobile-vessel-name {
            padding: 10px 18px;
            font-size: 13px;
            line-height: 1.3;
            font-weight: bold;
            margin: 0;
        }

        .berth-section h3 {
            background-color: #D4DDE5;
            color: #1D4369;
        }

        .mobile-vessel-name {
            background-color: #1D4369;
            color: #ffffff;
        }

        .mobile-vessel-card {
            width: 100%;
            margin: 0;
            background-color: #ffffff;
            box-sizing: border-box;
        }

        .mobile-detail {
            display: table;
            width: 100%;
            table-layout: fixed;
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
            font-size: 10px;
            font-weight: bold;
            width: 50%;
            color: #1D4369;
            text-align: left;
            opacity: 0.45;
        }

        .mobile-detail-value {
            width: 50%;
            text-align: right;
            overflow-wrap: break-word;
        }

        .weather-section {
            background-color: #ffffffff;
        }

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
            padding: 7px 10px;
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

        .weather-hero,
        .weather-main {
            padding: 8px 10px 7px 10px;
            justify-content: center;
            align-items: center;
            display: flex;
        }

        .weather-temperature {
            font-size: 28px;
            line-height: 1;
            font-weight: bold;
            color: #4478AC;
            white-space: nowrap;
        }

        .weather-icon {
            width: 58px;
            height: 58px;
            display: block;
        }

        .weather-condition {
            margin: 3px 0 0 0;
            padding: 0;
            color: #1D4369;
            font-size: 10px;
            line-height: 1.2;
            font-weight: bold;
        }

        .weather-stats-table {
            width: 100%;
            margin: 0;
            background-color: #ffffff;
            color: #000000;
            border-collapse: collapse;
        }

        .weather-stats-table td {
            padding: 5px 8px;
            border: 0;
            vertical-align: middle;
            font-size: 10px;
            line-height: 1.2;
            box-sizing: border-box;
        }

        .weather-stat-label,
        .weather-stat-value {
            display: inline;
            font-size: 10px;
            line-height: 1.2;
        }

        .weather-stat-label {
            color: #1D4369;
            font-weight: bold;
            opacity: 0.5;
        }

        .weather-stat-value {
            color: #000000;
            font-weight: normal;
            float: right;
        }

        

        .logo-img {
            width: 280px !important;
            max-width: 280px !important;
            height: auto !important;
            display: block !important;
            float: right;
        }

        @media only screen and (max-width: 600px) {
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
            }

            .report-header h1 {
                margin: 0;
                font-size: 12px;
                line-height: 1.2;
            }

            .logo-img {
                width: 200px !important;
                display:block; 
                float:right;
            }

            .berth-section h3,
            .mobile-vessel-name,
            .mobile-detail-label,
            .mobile-detail-value {
                padding: 6px 10px !important;
            }

            .intro-section p {
                margin: 0 0 14px;
                font-size: 13px;
            }

        }
    </style>
</head>

<body>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
        <tr>
            <td class="email-header-cell">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td class="logo-intro-cell">
                            <img src="${isPreview ? '/assets/Logo-Claro-Fortship.png' : 'cid:company-logo'}" class="logo-img" alt="Fortship Logo" width="280" style="display: block; float: right;">
                            <div class="intro-section">
                                <p>Dear All,</p>
                                <p>Please find below the latest <strong>${escapeHtml(port.title)} Line Up</strong>, provided for your reference and guidance.</p>
                                <p>Kindly note that the information contained in this line-up is subject to change without prior notice and is based on AGW/WP.</p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-container">
                    <tr>
                        <td>
                            <div class="desktop-report">
                                <table class="shipping-table" cellpadding="0" cellspacing="0" border="0">
                                    <colgroup>
                                        <col style="width: 15%;" class="col-vessel">
                                        <col style="width: 10%;" class="col-time">
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
                                <div class="weather-section">                           
                                    <table class="overview-desktop" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            <td width="50%">
                                                <h2>Overview</h2>
                                                <img src="${isPreview ? `/assets/ports/${port.image}` : 'cid:port-image'}" class="port-image" alt="${escapeHtml(port.title)}" width="100%">
                                            </td>

                                            <td width="25%">
                                                <div class="weather-card">
                                                    <h3>Day</h3>
                                                    <div class="weather-hero">
                                                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                                            <tr>
                                                                <td>
                                                                    <div class="weather-temperature">
                                                                        ${escapeHtml(weather.current.temperature)}°C
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <img src="${isPreview ? `/assets/weather/${weather.current.icon}.png` : 'cid:weather-day-icon'}" class="weather-icon" alt="${escapeHtml(weather.current.condition)}" width="64" height="64">
                                                                </td>
                                                            </tr>
                                                        </table>
                                                        <div class="weather-condition">
                                                            ${escapeHtml(weather.current.condition)}
                                                        </div>
                                                    </div>
                                                    <table class="weather-stats-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="background-color: #EAEDF0;">
                                                                <span class="weather-stat-label">Humidity</span>
                                                                <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.humidity)}%
                                                            </span>
                                                        </td>
                                                        <td style="background-color: #EAEDF0;">
                                                            <span class="weather-stat-label">Wind</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.windDirection)}
                                                                ${escapeHtml(weather.current.windSpeed)}km/h
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
                                                            <span class="weather-stat-label">Wind gusts</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.windGust ?? "—")}km/h
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="background-color: #EAEDF0;">
                                                            <span class="weather-stat-label">Feels like</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.feelsLike)}°C
                                                            </span>
                                                        </td>
                                                        <td style="background-color: #EAEDF0;">
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.pressure)}hPa
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Visibility</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.visibility)}km
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
                                                <table class="weather-stats-table" role="presentation" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td style="background-color: #EAEDF0;">
                                                            <span class="weather-stat-label">Sunrise</span>
                                                            <span class="weather-stat-value">${escapeHtml(weather.sunrise)}</span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>

                                        <td width="25%">
                                            <div class="weather-card night-card">
                                                <h3>Night <span class="weather-time">21:00</span></h3>

                                                <div class="weather-hero">
                                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td>
                                                                <div class="weather-temperature">
                                                                    ${escapeHtml(weather.night.temperature)}°C
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <img src="${isPreview ? `/assets/weather/${weather.night.icon}.png` : 'cid:weather-night-icon'}" class="weather-icon" alt="${escapeHtml(weather.night.condition)}" width="64" height="64">
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <div class="weather-condition">
                                                        ${escapeHtml(weather.night.condition)}
                                                    </div>
                                                </div>

                                                <table class="weather-stats-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td style="background-color: #EAEDF0;">
                                                            <span class="weather-stat-label">Humidity</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.humidity)}%
                                                            </span>
                                                        </td>

                                                        <td style="background-color: #EAEDF0;">
                                                            <span class="weather-stat-label">Wind</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.windDirection)}
                                                                ${escapeHtml(weather.night.windSpeed)}km/h
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
                                                            <span class="weather-stat-label">Wind gusts</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.windGust ?? "—")}km/h
                                                            </span>
                                                        </td>

                                                    </tr>

                                                    <tr>
                                                        <td style="background-color: #EAEDF0;">
                                                            <span class="weather-stat-label">Feels like</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.feelsLike)}°C
                                                            </span>
                                                        </td>
                                                        <td style="background-color: #EAEDF0;">
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.pressure)}hPa
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Visibility</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.visibility)}km
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
                                                <table class="weather-stats-table"  role="presentation" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td style="background-color: #EAEDF0;">
                                                            <span class="weather-stat-label">Sunset</span>
                                                            <span class="weather-stat-value">${escapeHtml(weather.sunset)}</span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>

                                    </tr>
                                </table>
                                <table class="overview-mobile" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td colspan="2">
                                            <img src="${isPreview ? `/assets/ports/${port.image}` : 'cid:port-image'}" class="port-image" alt="${escapeHtml(port.title)}">
                                        </td>
                                    </tr>
                                    <tr class="mobile-weather-row">
                                        <td width="50%">
                                            <div class="weather-card">
                                                <h3>Day</h3>
                                                <div class="weather-main">
                                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td width="60%">
                                                                <div class="weather-temperature">
                                                                    ${escapeHtml(weather.current.temperature)}°C
                                                                </div>
                                                            </td>
                                                            <td width="40%">
                                                                <img src="${isPreview ? `/assets/weather/${weather.current.icon}.png` : 'cid:weather-day-icon'}" class="weather-icon" alt="${escapeHtml(weather.current.condition)}" width="50" height="50">
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <td colspan="2">
                                                                <div class="weather-condition">
                                                                    ${escapeHtml(weather.current.condition)}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </div>
                                                <table class="weather-stats-table" width="100%" role="presentation" cellpadding="0" cellspacing="0" border="0">
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
                                                                ${escapeHtml(weather.current.windSpeed)}km/h
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
                                                                ${escapeHtml(weather.current.visibility)}km
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
                                                                ${escapeHtml(weather.current.windGust ?? "—")}km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.current.pressure)}hPa
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
                                                <table class="weather-stats-table" role="presentation" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td style="background-color: #EAEDF0;">
                                                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                                <tr>
                                                                    <td style="color: #1D4369; font-size: 10px; font-weight: bold; opacity: 0.5;">
                                                                        Sunrise
                                                                    </td>
                                                                    <td style="color: #000000; font-size: 10px; font-weight: normal;">
                                                                        ${escapeHtml(weather.sunrise)}
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="weather-card night-card">
                                                <h3>Night <span class="weather-time">21:00</span></h3>
                                                <div class="weather-main">
                                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td width="50%">
                                                                <div class="weather-temperature">
                                                                    ${escapeHtml(weather.night.temperature)}°C
                                                                </div>
                                                            </td>
                                                            <td width="50%">
                                                                <img src="${isPreview ? `/assets/weather/${weather.night.icon}.png` : 'cid:weather-night-icon'}" class="weather-icon" alt="${escapeHtml(weather.night.condition)}" width="50" height="50">
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <td colspan="2">
                                                                <div class="weather-condition">
                                                                    ${escapeHtml(weather.night.condition)}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                </div>
                                                <table class="weather-stats-table" width="100%" role="presentation" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td style="width: 40%;">
                                                            <span class="weather-stat-label">Humidity</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.humidity)}%
                                                            </span>
                                                        </td>

                                                        <td style="width: 60%;">
                                                            <span class="weather-stat-label">Wind</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.windDirection)}
                                                                ${escapeHtml(weather.night.windSpeed)}km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 40%;">
                                                            <span class="weather-stat-label">Rain</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.rainChance)}%
                                                            </span>
                                                        </td>

                                                        <td style="width: 60%;">
                                                            <span class="weather-stat-label">Visibility</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.visibility)}km
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 40%;">
                                                            <span class="weather-stat-label">Feels like</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.feelsLike)}°C
                                                            </span>
                                                        </td>

                                                        <td style="width: 60%;">
                                                            <span class="weather-stat-label">Wind gusts</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.windGust ?? "—")}km/h
                                                            </span>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="width: 40%;">
                                                            <span class="weather-stat-label">Pressure</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.pressure)}hPa
                                                            </span>
                                                        </td>

                                                        <td style="width: 60%;">
                                                            <span class="weather-stat-label">Cloud cover</span>
                                                            <span class="weather-stat-value">
                                                                ${escapeHtml(weather.night.clouds)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <table class="weather-stats-table" role="presentation" cellpadding="0" cellspacing="0" border="0">
                                                    <tr>
                                                        <td>
                                                            <span class="weather-stat-label">Sunset</span>
                                                            <span class="weather-stat-value">${escapeHtml(weather.sunset)}</span>
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
