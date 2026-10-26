const {
    escapeHtml,
    rowBackground,
    renderDocument,
    themeImages,
    mobileDetailRow
} = require("./email-theme");

const UNIT_TITLES = {
    mtons: "Mtons",
    units: "Units"
};

const isBalance = (text) => /balance/i.test(String(text));

/**
 * Pivots labels such as "Total Manifested (mtons)" / "Total Manifested (units)"
 * into { bases: ["Total Manifested", ...], units: ["mtons","units"],
 * values: { "Total Manifested": { mtons, units } } }.
 */
function pivotByUnit(rows) {
    const bases = [];
    const units = [];
    const values = {};

    for (const row of rows) {
        const match = String(row.label ?? "")
            .trim()
            .match(/^(.*?)\s*\((mtons|units)\)\s*$/i);

        if (!match) {
            continue;
        }

        const base = match[1];
        const unit = match[2].toLowerCase();

        if (!bases.includes(base)) bases.push(base);
        if (!units.includes(unit)) units.push(unit);

        values[base] = values[base] || {};
        values[base][unit] = row.value;
    }

    // Keep Mtons before Units whatever order the sheet produced.
    units.sort((a, b) => (a === "mtons" ? -1 : b === "mtons" ? 1 : 0));

    return { bases, units, values };
}

const barRow = (title, colspan) => `
        <tr class="berth-heading">
            <th colspan="${colspan}">${escapeHtml(title)}</th>
        </tr>`;

const spacerRow = (colspan) => `
        <tr class="spacer-row"><td colspan="${colspan}">&nbsp;</td></tr>`;

// ---------- Desktop ----------

/** Cargo Summary: metric rows x (Mtons | Units) columns. */
function renderSummaryDesktop(summary) {
    const { bases, units, values } = pivotByUnit(summary);

    if (!bases.length) {
        return "";
    }

    const cols = units.length + 1;
    const first = Math.round(100 / (units.length + 1.5));
    const rest = (100 - first) / units.length;

    let body = barRow("Cargo Summary", cols);

    body += `
        <tr class="column-heading">
            <th>Description</th>
            ${units.map((u) => `<th>${UNIT_TITLES[u]}</th>`).join("")}
        </tr>`;

    for (const [i, base] of bases.entries()) {
        body += `
        <tr style="background-color: ${rowBackground(i)};">
            <td class="row-label">${escapeHtml(base)}</td>
            ${units
                .map(
                    (u) =>
                        `<td class="${isBalance(base) ? "balance-cell" : ""}">${escapeHtml(values[base][u] ?? "")}</td>`
                )
                .join("")}
        </tr>`;
    }

    return `
    <table class="report-table" width="100%" cellpadding="0" cellspacing="0" border="0">
        <colgroup>
            <col style="width: ${first}%;">
            ${units.map(() => `<col style="width: ${rest}%;">`).join("")}
        </colgroup>
        <tbody>${body}
        </tbody>
    </table>`;
}

/** Discharge Summary: (Mtons | Units) rows x Manifested/Discharged/Balance + ETC/S. */
function renderDischargeSummaryDesktop(dischargeSummary, etcs) {
    const { bases, units, values } = pivotByUnit(dischargeSummary);

    if (!bases.length) {
        return "";
    }

    const cols = bases.length + 2;

    let body = barRow("Discharge Summary", cols);

    body += `
        <tr class="column-heading">
            <th>Unit</th>
            ${bases.map((b) => `<th>${escapeHtml(b)}</th>`).join("")}
            <th class="etc-heading">ETC/S</th>
        </tr>`;

    for (const [i, unit] of units.entries()) {
        body += `
        <tr style="background-color: ${rowBackground(i)};">
            <td class="row-label">${UNIT_TITLES[unit]}</td>
            ${bases
                .map(
                    (b) =>
                        `<td class="${isBalance(b) ? "balance-cell" : ""}">${escapeHtml(values[b][unit] ?? "")}</td>`
                )
                .join("")}
            ${
                i === 0
                    ? `<td class="etc-cell" rowspan="${units.length}">${escapeHtml(etcs || "—")}</td>`
                    : ""
            }
        </tr>`;
    }

    const unitCol = 14;
    const etcCol = 22;
    const dataCol = (100 - unitCol - etcCol) / bases.length;

    return `
    <table class="report-table" width="100%" cellpadding="0" cellspacing="0" border="0">
        <colgroup>
            <col style="width: ${unitCol}%;">
            ${bases.map(() => `<col style="width: ${dataCol}%;">`).join("")}
            <col style="width: ${etcCol}%;">
        </colgroup>
        <tbody>${body}
        </tbody>
    </table>`;
}

/** Date / Shift / Units / Mtons log. */
function renderLogDesktop(discharges) {
    if (!discharges.length) {
        return "";
    }

    let body = barRow("Discharge Log", 4);

    body += `
        <tr class="column-heading">
            <th>Date</th>
            <th>Shift</th>
            <th>Units</th>
            <th>Mtons</th>
        </tr>`;

    for (const [i, row] of discharges.entries()) {
        body += `
        <tr style="background-color: ${rowBackground(i)};">
            <td class="row-label">${escapeHtml(row.date)}</td>
            <td>${escapeHtml(row.shift)}</td>
            <td>${escapeHtml(row.units)}</td>
            <td>${escapeHtml(row.mtons)}</td>
        </tr>`;
    }

    return `
    <table class="report-table" width="100%" cellpadding="0" cellspacing="0" border="0">
        <colgroup>
            <col style="width: 34%;">
            <col style="width: 26%;">
            <col style="width: 20%;">
            <col style="width: 20%;">
        </colgroup>
        <tbody>${body}
        </tbody>
    </table>`;
}

// ---------- Mobile ----------

function mobileSection(title, innerHtml) {
    return `
    <div class="berth-section">
        <h3>${escapeHtml(title)}</h3>
        <div class="mobile-vessel-card">${innerHtml}
        </div>
    </div>`;
}

function renderMobile({ summary, dischargeSummary, discharges, etcs }) {
    let html = "";

    if (summary.length) {
        html += mobileSection(
            "Cargo Summary",
            summary
                .map((row, i) =>
                    mobileDetailRow(row.label, escapeHtml(row.value), i, {
                        background: isBalance(row.label) ? "#FBCBC6" : undefined,
                        valueClass: ""
                    })
                )
                .join("")
        );
    }

    const pivot = pivotByUnit(dischargeSummary);

    if (pivot.bases.length) {
        let inner = "";

        for (const unit of pivot.units) {
            inner += `
            <div class="mobile-vessel-name">${UNIT_TITLES[unit]}</div>`;

            inner += pivot.bases
                .map((base, i) =>
                    mobileDetailRow(base, escapeHtml(pivot.values[base][unit] ?? ""), i, {
                        background: isBalance(base) ? "#FBCBC6" : undefined
                    })
                )
                .join("");
        }

        inner += `
            <div class="mobile-vessel-name">ETC/S</div>`;
        inner += mobileDetailRow("Estimated completion", escapeHtml(etcs || "—"), 0, {
            valueClass: "is-etc"
        });

        html += mobileSection("Discharge Summary", inner);
    }

    if (discharges.length) {
        const rows = discharges
            .map(
                (row, i) => `
                <tr style="background-color: ${rowBackground(i)};">
                    <td style="font-weight: bold; color: #1D4369;">${escapeHtml(row.date)}</td>
                    <td>${escapeHtml(row.shift)}</td>
                    <td>${escapeHtml(row.units)}</td>
                    <td>${escapeHtml(row.mtons)}</td>
                </tr>`
            )
            .join("");

        html += mobileSection(
            "Discharge Log",
            `
            <table class="mobile-log-table" width="100%" cellpadding="0" cellspacing="0" border="0">
                <colgroup>
                    <col style="width: 34%;">
                    <col style="width: 26%;">
                    <col style="width: 20%;">
                    <col style="width: 20%;">
                </colgroup>
                <thead>
                    <tr><th>Date</th><th>Shift</th><th>Units</th><th>Mtons</th></tr>
                </thead>
                <tbody>${rows}
                </tbody>
            </table>`
        );
    }

    return html;
}

// ---------- Public API ----------

function generateDailyReportHtml(report, { isPreview = false } = {}) {
    const summary = report.summary || [];
    const dischargeSummary = report.dischargeSummary || [];
    const discharges = report.discharges || [];
    const etcs = report.etcs || "";

    const vessel = String(report.vesselName ?? "").trim();

    const subject = vessel
        ? `<strong>Daily Report</strong> for <strong>${escapeHtml(vessel)}</strong>`
        : "<strong>Daily Report</strong>";

    const introHtml = `
                                <p>Dear All,</p>
                                <p>Please find below the latest ${subject}, provided for your reference and guidance.</p>`;

    const desktopHtml = [
        renderSummaryDesktop(summary),
        renderDischargeSummaryDesktop(dischargeSummary, etcs),
        renderLogDesktop(discharges)
    ]
        .filter(Boolean)
        .join(`
    <div style="height: 10px; line-height: 10px; font-size: 0;">&nbsp;</div>
    `);

    const html = renderDocument({
        title: vessel ? `${vessel} — Daily Report` : "Daily Report",
        introHtml,
        desktopHtml,
        mobileHtml: renderMobile({ summary, dischargeSummary, discharges, etcs }),
        isPreview
    });

    return {
        html,
        images: themeImages(isPreview)
    };
}

module.exports = generateDailyReportHtml;