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

function generateHtml(report, weather, { isPreview = false } = {}) {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>Port of Pecém — Line Up</title>
    <style>
        /* --------------------------------
        OVERVIEW
        -------------------------------- */

        .weather-section {
            padding: 0;
            background-color: #D4DDE5;
            border-top: 1px solid #d1d5db;
        }

        .weather-section h2 {
            margin: 0;
            padding: 12px 16px;
            background-color: #D4DDE5;
            color: #1D4369;
            font-size: 13px;
            line-height: 1;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            text-align: center;
        }

        /* Desktop overview */

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
            padding: 14px;
            border: 1px solid #d1d5db;
            background-color: #ffffff;
        }

        .weather-card h3 {
            margin: 0 0 12px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #d1d5db;
            color: #1D4369;
            font-size: 14px;
            line-height: 1.2;
            font-weight: bold;
        }

        .weather-icon {
            display: block;
            width: 50px;
            height: 50px;
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
                padding: 10px !important;
            }

            .weather-card h3 {
                font-size: 13px !important;
                margin-bottom: 8px !important;
                padding-bottom: 6px !important;
            }

            .weather-icon {
                width: 40px !important;
                height: 40px !important;
                margin-bottom: 8px !important;
            }

            .weather-temperature {
                font-size: 20px !important;
            }

            .weather-value {
                font-size: 12px !important;
            }

            .weather-label {
                font-size: 11px !important;
            }

            .mobile-weather-row td {
                display: table-cell !important;
                width: 50% !important;
                vertical-align: top !important;
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
                style="padding: 0 8px 12px 16px;"
            >
                <img
                    src="${isPreview ? '/assets/ports/pecem.png' : 'cid:port-image'}"
                    class="port-image"
                    alt="Port of Pecém"
                    width="100%"
                >
            </td>

            <!-- DAY -->
            <td
                width="25%"
                valign="top"
                style="padding: 0 8px 12px 8px;"
            >
                <div class="weather-card">

                    <h3>Day</h3>

                    <img
                        src="${isPreview
                            ? `/assets/weather/${weather.current.icon}.png`
                            : 'cid:weather-day-icon'}"
                        class="weather-icon"
                        alt="${escapeHtml(weather.current.condition)}"
                        width="50"
                        height="50"
                    >

                    <div class="weather-temperature">
                        ${escapeHtml(weather.current.temperature)}°C
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Feels like:</span>
                        ${escapeHtml(weather.current.feelsLike)}°C
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Wind:</span>
                        ${escapeHtml(weather.current.windSpeed)} km/h
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Rain:</span>
                        ${escapeHtml(weather.current.rainChance)}%
                    </div>

                </div>
            </td>

            <!-- NIGHT -->
            <td
                width="25%"
                valign="top"
                style="padding: 0 16px 12px 8px;"
            >
                <div class="weather-card">

                    <h3>Night — 21:00</h3>

                    <img
                        src="${isPreview
                            ? `/assets/weather/${weather.night.icon}.png`
                            : 'cid:weather-night-icon'}"
                        class="weather-icon"
                        alt="${escapeHtml(weather.night.condition)}"
                        width="50"
                        height="50"
                    >

                    <div class="weather-temperature">
                        ${escapeHtml(weather.night.temperature)}°C
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Feels like:</span>
                        ${escapeHtml(weather.night.feelsLike)}°C
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Wind:</span>
                        ${escapeHtml(weather.night.windSpeed)} km/h
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Rain:</span>
                        ${escapeHtml(weather.night.rainChance)}%
                    </div>

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
                style="padding: 0 12px 12px 12px;"
            >
                <img
                    src="${isPreview ? '/assets/ports/pecem.png' : 'cid:port-image'}"
                    class="port-image"
                    alt="Port of Pecém"
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
                style="padding: 0 6px 12px 12px;"
            >
                <div class="weather-card">

                    <h3>Day</h3>

                    <img
                        src="${isPreview
                            ? `/assets/weather/${weather.current.icon}.png`
                            : 'cid:weather-day-icon'}"
                        class="weather-icon"
                        alt="${escapeHtml(weather.current.condition)}"
                        width="40"
                        height="40"
                    >

                    <div class="weather-temperature">
                        ${escapeHtml(weather.current.temperature)}°C
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Feels:</span>
                        ${escapeHtml(weather.current.feelsLike)}°C
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Wind:</span>
                        ${escapeHtml(weather.current.windSpeed)} km/h
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Rain:</span>
                        ${escapeHtml(weather.current.rainChance)}%
                    </div>

                </div>
            </td>

            <!-- NIGHT -->
            <td
                width="50%"
                valign="top"
                style="padding: 0 12px 12px 6px;"
            >
                <div class="weather-card">

                    <h3>Night — 21:00</h3>

                    <img
                        src="${isPreview
                            ? `/assets/weather/${weather.night.icon}.png`
                            : 'cid:weather-night-icon'}"
                        class="weather-icon"
                        alt="${escapeHtml(weather.night.condition)}"
                        width="40"
                        height="40"
                    >

                    <div class="weather-temperature">
                        ${escapeHtml(weather.night.temperature)}°C
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Feels:</span>
                        ${escapeHtml(weather.night.feelsLike)}°C
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Wind:</span>
                        ${escapeHtml(weather.night.windSpeed)} km/h
                    </div>

                    <div class="weather-value">
                        <span class="weather-label">Rain:</span>
                        ${escapeHtml(weather.night.rainChance)}%
                    </div>

                </div>
            </td>

        </tr>
    </table>

</div>
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
                path: path.join(__dirname, "assets", "ports", "pecem.png"),
                cid: "port-image"
            }
        ]
    };
}

module.exports = generateHtml;
