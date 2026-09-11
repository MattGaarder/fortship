require("dotenv").config();

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const cors = require("cors");

const { getPortConfig, generateSubject } = require("./config");
const parseShippingReport = require("./parser");
const generateLineUpHtml = require("./generator-line-up");
const generateBerthSailHtml = require("./generator-berth-sail");
const generateDailyReportHtml = require("./generator-daily-report");
const { getGoogleAuthUrl, getGoogleTokens } = require("./gmail-auth");
const {
    getMicrosoftLoginUrl,
    getMicrosoftTokenFromCode,
    getMicrosoftAccessToken
} = require("./auth");
const { createReportDraft, selectedProvider, sendReportDraft } = require("./mailer");
const getWeather = require("./weather");
const createStackedWorkbook = require("./workbook-generator");
const createReportPdf = require("./pdf-generator");
const {
    createMicrosoftDraft,
    sendMicrosoftDraft,
    downloadOneDriveFileById
} = require("./graph");

const LINEUP_WORKBOOK_ID =
    "FB6DC47598B18BF3!s9adf370729184224bc561ba0e065b4f2";

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const testWorkbookPath = path.join(__dirname, "LINEUP.xlsx");
const berthSailPreviewPath = path.join(__dirname, "berth-sail-preview.json");
const dailyReportPreviewPath = path.join(__dirname, "daily-report-preview.json");



for (const variable of ["SESSION_SECRET", "API_KEY"]) {
    if (!process.env[variable]) {
        throw new Error(`${variable} is required.`);
    }
}

if (isProduction) {
    // Required when the app sits behind ngrok, a load balancer, or a reverse proxy.
    app.set("trust proxy", 1);
}

app.use(express.json({ limit: "1mb" }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction
    }
}));

// Office Scripts' runtime does not have a stable Origin, so Microsoft requires
// an external API called with fetch to allow '*'. Scope that exception to the
// machine-to-machine endpoint instead of enabling CORS for the whole app.
const officeScriptCors = cors({
    origin: "*",
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-API-Key"],
    optionsSuccessStatus: 200
});

function authenticateExcelRequest(req, res, next) {
    const received = req.get("X-API-Key");
    const expected = process.env.API_KEY;
    const valid = typeof received === "string" &&
        received.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
    if (!valid) {
        return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    next();
}

function isEmailAddressArray(value) {
    return Array.isArray(value) &&
        value.every(
            (address) => typeof address === "string"
        );
}

function isLineUpReport(report) {
    return !!report &&
        report.reportType === "line-up" &&
        typeof report.sheetName === "string" &&
        isEmailAddressArray(report.to) &&
        isEmailAddressArray(report.cc) &&
        isEmailAddressArray(report.bcc) &&
        Array.isArray(report.berths) &&
        report.berths.every(
            (berth) =>
                typeof berth?.name === "string" &&
                Array.isArray(berth.vessels) &&
                berth.vessels.every(
                    (vessel) =>
                        typeof vessel?.name === "string" &&
                        typeof vessel?.eta === "string" &&
                        typeof vessel?.etb === "string" &&
                        typeof vessel?.etc === "string" &&
                        typeof vessel?.etd === "string" &&
                        typeof vessel?.cargo === "string" &&
                        typeof vessel?.quantity === "string" &&
                        typeof vessel?.operation === "string" &&
                        typeof vessel?.remarks === "string"
                )
        ) &&
        Array.isArray(report.stackedData) &&
        report.stackedData.every(
            (row) =>
                Array.isArray(row) &&
                row.every(
                    (cell) => typeof cell === "string"
                )
        );
}

function isBerthSailReport(report) {
    return !!report &&
        report.reportType === "berth-sail" &&
        typeof report.sheetName === "string" &&
        isEmailAddressArray(report.to) &&
        isEmailAddressArray(report.cc) &&
        isEmailAddressArray(report.bcc) &&
        Array.isArray(report.rows) &&
        report.rows.every(
            (row) =>
                typeof row?.label === "string" &&
                typeof row?.valueB === "string" &&
                typeof row?.valueC === "string"
        );
}

function isDailyReport(report) {
    return !!report &&
        report.reportType === "daily-report" &&
        typeof report.sheetName === "string" &&
        isEmailAddressArray(report.to) &&
        isEmailAddressArray(report.cc) &&
        isEmailAddressArray(report.bcc) &&
        typeof report.vesselName === "string" &&
        Array.isArray(report.holds) &&
        Array.isArray(report.summary) &&
        Array.isArray(report.dischargeSummary) &&
        Array.isArray(report.discharges) &&
        typeof report.etcs === "string";
}

function createOAuthState(req, key) {
    const state = crypto.randomBytes(32).toString("base64url");
    req.session[key] = state;
    return state;
}

function hasValidOAuthState(req, key, state) {
    const expected = req.session[key];

    delete req.session[key];

    return typeof state === "string" &&
        typeof expected === "string" &&
        state.length === expected.length &&
        crypto.timingSafeEqual(
            Buffer.from(state),
            Buffer.from(expected)
        );
}

function signInRequired(res, provider) {
    return res.status(401).send(
        `<p>Sign in with ${provider} before creating a test draft.</p>`
    );
}

// ----- Excel / Office Script endpoint -----

app.options("/generate-report-json", officeScriptCors);

app.post(
    "/generate-report-json",
    officeScriptCors,
    authenticateExcelRequest,
    async (req, res) => {
        const report = req.body;
        console.log("Received report:");
        if (
            !isLineUpReport(report) &&
            !isBerthSailReport(report) &&
            !isDailyReport(report)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid shipping report."
            });
        }
        let stackedXlsxPath = null;
        let pdfPath = null;

        try {
            const generators = {
                "line-up": generateLineUpHtml,
                "berth-sail": generateBerthSailHtml,
                "daily-report": generateDailyReportHtml
            };

            const generator = generators[report.reportType];

            let port = null;
            let weather = null;

            console.log("REPORT TYPE:", report.reportType);
            console.log("SHEET NAME:", report.sheetName);
            console.log("TO:", report.to);
            console.log("CC:", report.cc);
            console.log("BCC:", report.bcc);

            if (report.reportType === "line-up") {
                port = getPortConfig(report.sheetName);
                weather = await getWeather(port.coordinates);
            }

            const { html, images } =
                report.reportType === "line-up"
                    ? await generator(report, weather, port)
                    : await generator(report);

            // 1. Generate PDF attachment from the rendered HTML
            let fileAttachments = [];

            const pdfAttachment = await createReportPdf({
                report,
                html,
                images
            });

            pdfPath = pdfAttachment.filePath;

            fileAttachments.push({
                path: pdfAttachment.filePath,
                name: pdfAttachment.displayName,
                contentType: "application/pdf"
            });

            console.log(`[server] PDF report ready: ${pdfAttachment.displayName}`);

            // 2. Line-Up only: generate standalone xlsx attachment from the calculated stackedData received from Office

            if (
                report.reportType === "line-up" &&
                Array.isArray(report.stackedData) &&
                report.stackedData.length > 0
            ) {
                const { filePath, displayName } = await createStackedWorkbook({
                    sheetName: report.sheetName,
                    data: report.stackedData
                });

                stackedXlsxPath = filePath;

                fileAttachments.push({
                    path: filePath,
                    name: displayName,
                    contentType:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                });

                console.log(`[server] Stacked xlsx ready: ${displayName}`);
            }

            const draft = await createReportDraft({
                to: report.to,
                cc: report.cc,
                bcc: report.bcc,
                subject: generateSubject(report),
                html,
                images,
                fileAttachments
            });

            await sendReportDraft({
                draftId: draft.id
            });

            console.log(`${draft.provider} draft created: ${draft.id}`);

            res.status(201).json({
                success: true,
                provider: draft.provider,
                draftId: draft.id
            });
        } catch (error) {
            console.error("Report generation failed:", error);
            res.status(500).json({
                success: false,
                message: "Failed to create report draft."
            });
        } finally {
            // Always delete temporary files, whether the request
            // succeeded or failed, so files never accumulate on disk.
            if (stackedXlsxPath) {
                fs.promises.unlink(stackedXlsxPath).catch((err) => {
                    // Non-fatal: log but do not rethrow.
                    console.warn(`[server] Could not delete temp xlsx ${stackedXlsxPath}:`, err.message);
                });
            }
            if (pdfPath) {
                fs.promises.unlink(pdfPath).catch((err) => {
                    // Non-fatal: log but do not rethrow.
                    console.warn(`[server] Could not delete temp pdf ${pdfPath}:`, err.message);
                });
            }
        }
    }
);

app.get("/", (req, res) => {
    const provider = selectedProvider();
    const googleStatus = req.session.googleAuthenticated ? "connected" : "not connected";
    const microsoftStatus = req.session.microsoftAuthenticated ? "connected" : "not connected";

    res.type("html").send(`
        <!doctype html>
        <html lang="en">
            <head><meta charset="utf-8"><title>Shipping Report Generator</title></head>
            <body>
                <h1>Shipping Report Generator</h1>
                <p>Automated drafts use: <strong>${provider}</strong>.</p>
                <p>Google: ${googleStatus} — <a href="/google/login">connect Google</a></p>
                <p>Microsoft: ${microsoftStatus} — <a href="/microsoft/login">connect Microsoft</a></p>
                <form action="/test/gmail/draft" method="post"><button>Test Gmail draft</button></form>
                <form action="/test/microsoft/draft" method="post"><button>Test Microsoft draft</button></form>
                <p><a href="/preview" target="_blank">View Live Preview</a></p>
            </body>
        </html>
    `);
});

app.get("/test-weather", async (req, res) => {
    try {
        const weather = await getWeather();

        res.json({
            success: true,
            weather
        });
    } catch (error) {
        console.error("Weather test failed:", error);

        res.status(500).json({
            success: false,
            error: error.message,
            cause: error.cause?.message,
            code: error.code
        });
    }
});

app.get("/preview", async (req, res) => {
    try {
        // Clear cache so changes to generator.js are instantly reflected
        delete require.cache[require.resolve("./generator-line-up")];
        delete require.cache[require.resolve("./generator-berth-sail")];
        const freshGenerateHtml = require("./generator-line-up");

        const report = parseShippingReport(testWorkbookPath);
        const port = getPortConfig(report.sheetName, true);
        const weather = await getWeather(port.coordinates);

        const { html } = freshGenerateHtml(
            report,
            weather,
            port,
            { isPreview: true }
        );

        res.send(html);
    } catch (error) {
        console.error("Preview generation failed:", error);
        res.status(500).send(
            "Error generating preview: " + error.message
        );
    }
});

app.use((error, _req, res, _next) => {
    console.error("Unhandled server error:", error);
    res.status(500).send("Server error. Check the server log.");
});

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}.`);
});

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Stop the existing Node server, then run npm start again.`);
        return;
    }

    console.error("Unable to start server:", error);
});


// ----- Google OAuth -----

app.get("/google/login", (req, res) => {
    const state = createOAuthState(req, "googleOAuthState");
    res.redirect(getGoogleAuthUrl(state));
});

app.get("/google/callback", async (req, res) => {
    if (req.query.error) {
        return res.status(400).send("Google authentication was cancelled or denied.");
    }

    if (!req.query.code || !hasValidOAuthState(req, "googleOAuthState", req.query.state)) {
        return res.status(400).send("Invalid Google authorization response. Please try again.");
    }

    try {
        await getGoogleTokens(req.query.code);
        req.session.googleAuthenticated = true;
        res.redirect("/");
    } catch (error) {
        console.error("Google authentication failed:", error);
        res.status(500).send("Google authentication failed. Check the server log.");
    }
});

// ----- Microsoft OAuth / Microsoft Graph -----

app.get("/microsoft/login", async (req, res, next) => {
    try {
        const state = createOAuthState(req, "microsoftOAuthState");

        console.log("Microsoft OAuth state created:", state);

        res.redirect(await getMicrosoftLoginUrl(state));
    } catch (error) {
        next(error);
    }
});

app.get("/microsoft/callback", async (req, res) => {

    console.log("MICROSOFT CALLBACK");
    console.log("Query state:", req.query.state);
    console.log(
        "Session state:",
        req.session.microsoftOAuthState
    );

    if (req.query.error) {
        console.error("Microsoft OAuth error:", req.query);
        return res.status(400).send(
            "Microsoft authentication was cancelled or denied."
        );
    }

    if (!req.query.code) {
        console.error("No authorization code received.");
        return res.status(400).send(
            "Invalid Microsoft authorization response: no code."
        );
    }

    if (!hasValidOAuthState(
        req,
        "microsoftOAuthState",
        req.query.state
    )) {
        console.error("OAuth state validation failed.");
        return res.status(400).send(
            "Invalid Microsoft authorization response: state mismatch."
        );
    }

    try {
        const token = await getMicrosoftTokenFromCode(
            req.query.code
        );

        req.session.microsoftAuthenticated = true;
        req.session.microsoftAccountHomeId =
            token.account.homeAccountId;

        res.redirect("/");

    } catch (error) {
        console.error(
            "Microsoft authentication failed:",
            error
        );

        res.status(500).send(
            "Microsoft authentication failed. Check the server log."
        );
    }
});

// ----- Browser-only smoke tests -----

app.post("/test/:provider/draft", async (req, res) => {
    const provider = req.params.provider.toLowerCase();

    if (!["gmail", "microsoft"].includes(provider)) {
        return res.status(404).send("Unknown email provider.");
    }

    if (!req.session[`${provider}Authenticated`]) {
        return signInRequired(
            res,
            provider === "gmail" ? "Google" : "Microsoft"
        );
    }

    try {
        // --------------------------------------------
        // PRETEND THIS IS THE REAL OFFICE SCRIPT REPORT
        // --------------------------------------------

        const parsedReport = parseShippingReport(testWorkbookPath);

        const report = {
            ...parsedReport,
            reportType: "line-up",
            sheetName: "Mucuripe",
            recipient: "matteus.gaarder@outlook.com"
        };

        console.log("TEST REPORT:");
        console.log(JSON.stringify(report, null, 2));

        // --------------------------------------------
        // NOW USE THE SAME PROCESSING AS REAL REPORT
        // --------------------------------------------

        const port = getPortConfig(report.sheetName);
        const weather = await getWeather(port.coordinates);

        const { html, images } = await generateLineUpHtml(
            report,
            weather,
            port
        );

        console.log("WORKING HTML LENGTH:", html.length);
        console.log(
            "HAS MOBILE:",
            html.includes('class="mobile-report"')
        );
        console.log(
            "HAS MEDIA QUERY:",
            html.includes('@media screen and (max-width: 600px)')
        );

        fs.writeFileSync("debug-browser.html", html);

        // --------------------------------------------
        // CREATE DRAFT
        // --------------------------------------------

        const draft = await createReportDraft({
            provider,
            recipient: report.recipient,
            subject: "Daily Shipping Report - RESPONSIVE TEST",
            html,
            images,
            microsoftAccountHomeId:
                req.session.microsoftAccountHomeId
        });

        console.log("DRAFT CREATED:", draft);

        // --------------------------------------------
        // SEND
        // --------------------------------------------

        await sendReportDraft({
            provider,
            draftId: draft.id,
            microsoftAccountHomeId:
                req.session.microsoftAccountHomeId
        });

        console.log("DRAFT SENT:", draft.id);

        res.send(`
            <p>${draft.provider} responsive test email sent.</p>
            <p>Draft ID: ${draft.id}</p>
            <p><a href="/">Back</a></p>
        `);

    } catch (error) {
        console.error("Test draft failed:", error);

        const mailboxError =
            error.message.includes("more than one account is cached") ||
            error.message.includes("configured Microsoft account");

        res.status(mailboxError ? 422 : 500).send(
            mailboxError
                ? error.message
                : `Test failed: ${error.message}`
        );
    }
});

app.get("/preview/berth-sail", async (req, res) => {
    try {
        delete require.cache[
            require.resolve("./generator-berth-sail")
        ];
        const generateBerthSailHtml =
            require("./generator-berth-sail");
        const report = JSON.parse(
            fs.readFileSync(
                berthSailPreviewPath,
                "utf8"
            )
        );
        const { html } = generateBerthSailHtml(
            report,
            { isPreview: true }
        );
        res.send(html);
    } catch (error) {
        console.error(
            "Berth&Sail preview generation failed:",
            error
        );
        res.status(500).send(
            "Error generating Berth&Sail preview: " +
            error.message
        );
    }
});

app.get("/preview/daily-report", async (req, res) => {
    try {
        delete require.cache[
            require.resolve("./generator-daily-report")
        ];

        const generateDailyReportHtml =
            require("./generator-daily-report");

        const report = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "debug-received-report.json"),
                "utf8"
            )
        );

        const { html } = generateDailyReportHtml(
            report,
            { isPreview: true }
        );

        res.send(html);

    } catch (error) {
        console.error(
            "Daily Report preview generation failed:",
            error
        );

        res.status(500).send(
            "Error generating Daily Report preview: " +
            error.message
        );
    }
});

app.get("/test-onedrive", async (req, res) => {
    if (!req.session.microsoftAuthenticated) {
        return signInRequired(res, "Microsoft");
    }

    try {
        const accessToken = await getMicrosoftAccessToken({
            accountHomeId: req.session.microsoftAccountHomeId
        });

        const files = await testOneDriveFile(accessToken);

        res.json({
            success: true,
            files
        });

    } catch (error) {
        console.error("OneDrive test failed:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get("/test-onedrive-attachment", async (req, res) => {
    if (!req.session.microsoftAuthenticated) {
        return signInRequired(res, "Microsoft");
    }

    try {
        const accessToken = await getMicrosoftAccessToken({
            accountHomeId:
                req.session.microsoftAccountHomeId
        });

        const workbook =
            await downloadOneDriveFileById(
                accessToken,
                LINEUP_WORKBOOK_ID
            );

        console.log(
            "Downloaded workbook:",
            workbook.length,
            "bytes"
        );

        const draft = await createMicrosoftDraft({
            to: ["matteus.gaarder@outlook.com"],
            subject: "OneDrive attachment test",
            html: `
                <p>This is a test email.</p>
                <p>The mothership lineup workbook should be attached.</p>
            `,
            accessToken,
            attachments: [
                {
                    name: "mothership-lineup.xlsx",
                    contentType:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    contentBytes: workbook
                }
            ]
        });

        console.log(
            "Attachment test draft created:",
            draft.id
        );

        await sendMicrosoftDraft(
            draft.id,
            accessToken
        );

        res.send(`
            <p>Attachment test email sent successfully.</p>
            <p>Draft ID: ${draft.id}</p>
            <p>Downloaded: ${workbook.length} bytes</p>
            <p><a href="/">Back</a></p>
        `);

    } catch (error) {
        console.error(
            "OneDrive attachment test failed:",
            error
        );

        res.status(500).send(
            `Attachment test failed: ${error.message}`
        );
    }
});