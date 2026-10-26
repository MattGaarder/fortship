const {
    escapeHtml,
    rowBackground,
    titleCase,
    renderDocument,
    themeImages,
    mobileDetailRow
} = require("./email-theme");

const SECTION_KEYS = {
    "BUNKERS UPON:": "bunkers",
    "DRAFTS UPON:": "drafts",
    "TUGS USED UPON:": "tugs"
};

const SECTION_TITLES = {
    bunkers: "Bunkers Upon",
    drafts: "Drafts Upon",
    tugs: "Tugs Used Upon"
};

const VESSEL_INFORMATION = new Set([
    "VESSEL",
    "VOYAGE",
    "PORT",
    "QUANTITY (UNITS)",
    "CARGO TO LOADING",
    "BERTHING"
]);

const TIMELINE_LABELS = new Set([
    "FREE PRATIQUE GRANTED",
    "END OF SEA PASSAGE",
    "ARRIVED AT THE ROADS (DRIFTING)",
    "NOTICE OF READINESS TENDERED",
    "ANCHOR DOWN",
    "ANCHOR AWEIGHT",
    "POB FOR BERTHING",
    "FIRST LINE ASHORE",
    "ALL FAST",
    "GANGWAY PLACED ASHORE",
    "CLEARED BY PORT AUTHORITIES",
    "COMMENCED LOADING",
    "COMPLETED LOADING",
    "LASHING/SECURING VESSEL COMPLETED BY CREW FOR SAILING",
    "POB FOR SAILING",
    "CAST-OFF",
    "POB OFF.",
    "NEXT PORT ETA"
]);

function isBlankRow(row) {
    return !row.label && !row.valueB && !row.valueC;
}

/**
 * Splits the raw sheet rows (label / valueB / valueC) into the logical
 * blocks of the Berth & Sail report.
 */
function groupRows(rows) {
    const groups = {
        vessel: [],
        timeline: [],
        bunkers: { headers: null, rows: [] },
        drafts: { headers: null, rows: [] },
        tugs: { headers: null, rows: [] }
    };

    let currentSection = null;

    for (const row of rows) {
        if (isBlankRow(row)) {
            continue;
        }

        const label = String(row.label ?? "").trim();
        const upperLabel = label.toUpperCase();

        if (SECTION_KEYS[upperLabel]) {
            currentSection = SECTION_KEYS[upperLabel];
            groups[currentSection].headers = {
                valueB: titleCase(row.valueB) || "Berthing",
                valueC: titleCase(row.valueC) || "Sailing"
            };
            continue;
        }

        if (currentSection) {
            groups[currentSection].rows.push(row);
            continue;
        }

        if (VESSEL_INFORMATION.has(upperLabel)) {
            groups.vessel.push(row);
            continue;
        }

        if (TIMELINE_LABELS.has(upperLabel)) {
            groups.timeline.push(row);
        }
    }

    return groups;
}

function findVesselValue(vesselRows, label) {
    const match = vesselRows.find(
        (row) => String(row.label).trim().toUpperCase() === label
    );
    return match ? String(match.valueB ?? "").trim() : "";
}

// ---------- Desktop ----------

function sectionBar(title) {
    return `
        <tr class="berth-heading">
            <th colspan="3">${escapeHtml(title)}</th>
        </tr>`;
}

function columnHeading(a, b, c) {
    return `
        <tr class="column-heading">
            <th>${escapeHtml(a)}</th>
            <th>${escapeHtml(b)}</th>
            <th>${escapeHtml(c)}</th>
        </tr>`;
}

const SPACER = `
        <tr class="spacer-row"><td colspan="3">&nbsp;</td></tr>`;

function renderDesktop(groups) {
    let body = "";

    if (groups.vessel.length) {
        body += sectionBar("Vessel Details");
        for (const [i, row] of groups.vessel.entries()) {
            body += `
        <tr style="background-color: ${rowBackground(i)};">
            <td class="row-label">${escapeHtml(row.label)}</td>
            <td colspan="2">${escapeHtml(row.valueB)}</td>
        </tr>`;
        }
        body += SPACER;
    }

    if (groups.timeline.length) {
        body += sectionBar("Timeline");
        body += columnHeading("Event", "Date", "Time");
        for (const [i, row] of groups.timeline.entries()) {
            body += `
        <tr style="background-color: ${rowBackground(i)};">
            <td class="row-label">${escapeHtml(row.label)}</td>
            <td>${escapeHtml(row.valueB)}</td>
            <td>${escapeHtml(row.valueC)}</td>
        </tr>`;
        }
        body += SPACER;
    }

    for (const key of ["bunkers", "drafts", "tugs"]) {
        const { headers, rows } = groups[key];
        if (!headers || !rows.length) {
            continue;
        }

        body += sectionBar(SECTION_TITLES[key]);
        body += columnHeading("Item", headers.valueB, headers.valueC);
        for (const [i, row] of rows.entries()) {
            body += `
        <tr style="background-color: ${rowBackground(i)};">
            <td class="row-label">${escapeHtml(row.label)}</td>
            <td>${escapeHtml(row.valueB)}</td>
            <td>${escapeHtml(row.valueC)}</td>
        </tr>`;
        }
        body += SPACER;
    }

    return `
    <table class="report-table" width="100%" cellpadding="0" cellspacing="0" border="0">
        <colgroup>
            <col style="width: 40%;">
            <col style="width: 30%;">
            <col style="width: 30%;">
        </colgroup>
        <tbody>${body}
        </tbody>
    </table>`;
}

// ---------- Mobile ----------

function mobileCard(title, innerHtml) {
    return `
    <div class="berth-section">
        <h3>${escapeHtml(title)}</h3>
        <div class="mobile-vessel-card">${innerHtml}
        </div>
    </div>`;
}

/** "Berthing: x<br>Sailing: y" when both exist, otherwise the single value. */
function combinedValue(row, headers) {
    const b = escapeHtml(row.valueB);
    const c = escapeHtml(row.valueC);

    if (row.valueB && row.valueC) {
        return `${escapeHtml(headers.valueB)}: ${b}<br>${escapeHtml(headers.valueC)}: ${c}`;
    }
    if (row.valueC) {
        return `${escapeHtml(headers.valueC)}: ${c}`;
    }
    return b;
}

function renderMobile(groups) {
    let html = "";

    if (groups.vessel.length) {
        html += mobileCard(
            "Vessel Details",
            groups.vessel
                .map((row, i) => mobileDetailRow(row.label, escapeHtml(row.valueB), i))
                .join("")
        );
    }

    if (groups.timeline.length) {
        html += mobileCard(
            "Timeline",
            groups.timeline
                .map((row, i) =>
                    mobileDetailRow(
                        row.label,
                        escapeHtml(row.valueB) +
                            (row.valueC ? `<br>${escapeHtml(row.valueC)}` : ""),
                        i
                    )
                )
                .join("")
        );
    }

    for (const key of ["bunkers", "drafts", "tugs"]) {
        const { headers, rows } = groups[key];
        if (!headers || !rows.length) {
            continue;
        }

        html += mobileCard(
            SECTION_TITLES[key],
            rows
                .map((row, i) => mobileDetailRow(row.label, combinedValue(row, headers), i))
                .join("")
        );
    }

    return html;
}

// ---------- Public API ----------

function generateBerthSailHtml(report, { isPreview = false } = {}) {
    const groups = groupRows(report.rows || []);

    const vessel = findVesselValue(groups.vessel, "VESSEL");
    const port = findVesselValue(groups.vessel, "PORT");

    const subject = vessel
        ? `<strong>Berthing Report</strong> for <strong>${escapeHtml(vessel)}</strong>${port ? ` at <strong>${escapeHtml(port)}</strong>` : ""}`
        : "<strong>Berthing Report</strong>";

    const introHtml = `
                                <p>Dear All,</p>
                                <p>Please find below the latest ${subject}, provided for your reference and guidance.</p>`;

    const html = renderDocument({
        title: "Berthing Report",
        introHtml,
        desktopHtml: renderDesktop(groups),
        mobileHtml: renderMobile(groups),
        isPreview
    });

    return {
        html,
        images: themeImages(isPreview)
    };
}

module.exports = generateBerthSailHtml;