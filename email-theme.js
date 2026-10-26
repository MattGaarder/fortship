"use strict";

/**
 * email-theme.js
 *
 * Shared visual identity for the Berth & Sail and Daily Report emails.
 * It reproduces the look of the Line-Up email (generator-line-up.js):
 *   - white page, Fortship logo floated top-right, "Dear All" intro
 *   - compact 10px tables with navy (#1D4369) column headings,
 *     light-blue (#D4DDE5) section bars and zebra rows (#EAEDF0)
 *   - desktop table layout that switches to stacked cards at <= 600px
 *
 * The markup keeps the `.intro-section`, `.desktop-report` and
 * `.mobile-report` hooks that pdf-generator.js relies on.
 */

const path = require("path");

const LOGO_PATH = path.join(__dirname, "assets", "Logo-Claro-Fortship.png");

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

/** Zebra striping shared by every table / card list. */
function rowBackground(index) {
    return index % 2 === 0 ? "#ffffff" : "#EAEDF0";
}

/** "BERTHING" -> "Berthing" (used for headings taken from the sheet). */
function titleCase(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

const THEME_CSS = `
        body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
        }

        table {
            border-collapse: collapse;
        }

        img {
            max-width: 100%;
            height: auto;
        }

        .email-header-cell {
            padding: 16px 0px 10px 0px;
        }

        .logo-intro-cell {
            padding: 0 0 0 10px;
        }

        .email-container {
            width: 100%;
            max-width: 1300px;
            margin: 0 auto;
            background: #ffffff;
        }

        .intro-section {
            padding: 0px;
            margin-top: 50px;
        }

        .intro-section p {
            margin: 0 0 4px 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.2;
        }

        .logo-img {
            width: 280px !important;
            max-width: 280px !important;
            height: auto !important;
            display: block !important;
            float: right;
        }

        .desktop-report {
            display: block !important;
        }

        .mobile-report {
            display: none !important;
            width: 100%;
        }

        /* ---------- Desktop tables ---------- */

        .report-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .report-table th,
        .report-table td {
            padding: 6px 0px 6px 10px;
            overflow-wrap: break-word;
            word-break: normal;
            vertical-align: middle;
            box-sizing: border-box;
            text-align: left;
        }

        .report-table td {
            font-size: 10px;
            line-height: 1;
        }

        .report-table .column-heading th {
            font-size: 10px;
            line-height: 1;
            background-color: #1D4369;
            color: #ffffff;
        }

        .report-table .berth-heading th {
            background-color: #D4DDE5;
            color: #1D4369;
            font-size: 10px;
            line-height: 1;
            font-weight: bold;
            text-align: left;
        }

        .report-table .row-label {
            font-weight: bold;
            color: #1D4369;
        }

        .report-table .spacer-row td {
            padding: 0;
            height: 10px;
            line-height: 10px;
            font-size: 0;
            background-color: #ffffff;
        }

        .report-table .balance-cell {
            background-color: #FBCBC6 !important;
            font-weight: bold;
        }

        .report-table .etc-cell {
            background-color: #ffffff !important;
            color: #C00000;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            padding-left: 0;
        }

        .report-table .etc-heading {
            text-align: center;
            padding-left: 0;
        }

        /* ---------- Mobile cards ---------- */

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

        .mobile-gap {
            height: 10px;
            line-height: 10px;
            font-size: 0;
            background-color: #ffffff;
        }

        .mobile-detail {
            display: table;
            width: 100%;
            table-layout: fixed;
            background-color: #ffffff;
            box-sizing: border-box;
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

        .mobile-detail-value.is-etc {
            color: #C00000;
            font-weight: bold;
        }

        .mobile-log-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            background-color: #ffffff;
        }

        .mobile-log-table th,
        .mobile-log-table td {
            padding: 6px 8px;
            font-size: 11px;
            line-height: 1.25;
            text-align: left;
            vertical-align: middle;
            overflow-wrap: break-word;
        }

        .mobile-log-table th {
            background-color: #1D4369;
            color: #ffffff;
            font-size: 10px;
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

            .logo-img {
                width: 200px !important;
                display: block;
                float: right;
            }

            .berth-section h3,
            .mobile-vessel-name {
                padding: 5px 9px !important;
                font-size: 12px !important;
                line-height: 1.2 !important;
            }

            .mobile-detail-label,
            .mobile-detail-value {
                padding: 5px 9px !important;
                line-height: 1.3 !important;
            }

            .mobile-detail-label {
                font-size: 9px !important;
            }

            .mobile-detail-value {
                font-size: 12px !important;
            }

            .mobile-log-table th,
            .mobile-log-table td {
                padding: 5px 6px !important;
                font-size: 10px !important;
            }

            .intro-section p {
                margin: 0 0 12px;
                font-size: 12px;
                line-height: 1.15;
            }
        }
`;

/**
 * Wraps desktop + mobile report markup in the shared Fortship email shell.
 *
 * @param {{ title: string, introHtml: string, desktopHtml: string,
 *           mobileHtml: string, isPreview?: boolean }} options
 * @returns {string}
 */
function renderDocument({ title, introHtml, desktopHtml, mobileHtml, isPreview = false }) {
    const logoSrc = isPreview
        ? "/assets/Logo-Claro-Fortship.png"
        : "cid:company-logo";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(title)}</title>
    <style>${THEME_CSS}
    </style>
</head>

<body>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
        <tr>
            <td class="email-header-cell">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td class="logo-intro-cell">
                            <img src="${logoSrc}" class="logo-img" alt="Fortship Logo" width="280" style="display: block; float: right;">
                            <div class="intro-section">
                                ${introHtml}
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
                                ${desktopHtml}
                            </div>
                            <div class="mobile-report">
                                ${mobileHtml}
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
}

/** Inline images every themed email needs (logo referenced via cid). */
function themeImages(isPreview = false) {
    return isPreview
        ? []
        : [{ path: LOGO_PATH, cid: "company-logo" }];
}

/** Mobile detail row (label left, value right) with zebra background. */
function mobileDetailRow(label, valueHtml, index, { background, valueClass = "" } = {}) {
    return `
                <div class="mobile-detail" style="background-color: ${background || rowBackground(index)};">
                    <span class="mobile-detail-label">${escapeHtml(label)}</span>
                    <span class="mobile-detail-value ${valueClass}">${valueHtml}</span>
                </div>`;
}

module.exports = {
    escapeHtml,
    rowBackground,
    titleCase,
    renderDocument,
    themeImages,
    mobileDetailRow
};
