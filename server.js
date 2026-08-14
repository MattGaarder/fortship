require("dotenv").config();

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const cors = require("cors");

const parseShippingReport = require("./parser");
const generateHtml = require("./generator");
const { getGoogleAuthUrl, getGoogleTokens } = require("./gmail-auth");
const {
    getMicrosoftLoginUrl,
    getMicrosoftTokenFromCode
} = require("./auth");
const { createReportDraft, selectedProvider, sendReportDraft } = require("./mailer");

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const testWorkbookPath = path.join(__dirname, "LINEUP.xlsx");

for (const variable of ["SESSION_SECRET", "API_KEY", "REPORT_RECIPIENTS"]) {
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

function isShippingReport(report) {
    return !!report && Array.isArray(report.berths) && report.berths.every(
        (berth) => typeof berth?.name === "string" && Array.isArray(berth.vessels)
    );
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
        crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected));
}

function signInRequired(res, provider) {
    return res.status(401).send(
        `<p>Sign in with ${provider} before creating a test draft.</p>`
    );
}

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
        res.redirect(await getMicrosoftLoginUrl(state));
    } catch (error) {
        next(error);
    }
});

app.get("/microsoft/callback", async (req, res) => {
    if (req.query.error) {
        return res.status(400).send("Microsoft authentication was cancelled or denied.");
    }

    if (!req.query.code || !hasValidOAuthState(req, "microsoftOAuthState", req.query.state)) {
        return res.status(400).send("Invalid Microsoft authorization response. Please try again.");
    }

    try {
        const token = await getMicrosoftTokenFromCode(req.query.code);
        req.session.microsoftAuthenticated = true;
        req.session.microsoftAccountHomeId = token.account.homeAccountId;
        res.redirect("/");
    } catch (error) {
        console.error("Microsoft authentication failed:", error);
        res.status(500).send("Microsoft authentication failed. Check the server log.");
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
        // -------------------------------------------------------
        // TEMPORARY RESPONSIVE EMAIL TEST
        // -------------------------------------------------------

//         const html = `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">

//     <style>
//         .mobile-report {
//             display: none;
//         }

//         @media screen and (max-width: 600px) {
//             .desktop-report {
//                 display: none !important;
//             }

//             .mobile-report {
//                 display: block !important;
//             }
//         }
//     </style>
// </head>

// <body>

//     <div class="desktop-report">

//         <table width="100%" border="1">
//             <tr>
//                 <th>Vessel</th>
//                 <th>ETA</th>
//                 <th>ETB</th>
//                 <th>Cargo</th>
//             </tr>

//             <tr>
//                 <td>Scot Bremen</td>
//                 <td>April 23 18:00</td>
//                 <td>#REF!</td>
//                 <td>Coal Tar + BTX</td>
//             </tr>
//         </table>

//     </div>

//     <div class="mobile-report">

//         <h2>Scot Bremen</h2>

//         <p>ETA: April 23 18:00</p>
//         <p>ETB: #REF!</p>
//         <p>Cargo: Coal Tar + BTX</p>

//     </div>

// </body>
// </html>`;
        const report = parseShippingReport(testWorkbookPath);
        const { html, images } = generateHtml(report);

        console.log("WORKING HTML LENGTH:", html.length);
        console.log("HAS MOBILE:", html.includes('class="mobile-report"'));
        console.log("HAS MEDIA QUERY:", html.includes('@media screen and (max-width: 600px)'));

        fs.writeFileSync("debug-browser.html", html);

        // -------------------------------------------------------
        // CREATE THE DRAFT
        // -------------------------------------------------------

        const draft = await createReportDraft({
            provider,
            subject: "Daily Shipping Report - RESPONSIVE TEST",
            html,
            images: images,
            microsoftAccountHomeId: req.session.microsoftAccountHomeId
        });

        // -------------------------------------------------------
        // SEND THE DRAFT
        // -------------------------------------------------------

        await sendReportDraft({
            provider,
            draftId: draft.id,
            microsoftAccountHomeId: req.session.microsoftAccountHomeId
        });

        res.send(
            `<p>${draft.provider} responsive test email sent: ${draft.id}</p>
             <p><a href="/">Back</a></p>`
        );

    } catch (error) {
        console.error("Test draft failed:", error);

        const mailboxError =
            error.message.includes("more than one account is cached") ||
            error.message.includes("configured Microsoft account");

        res.status(mailboxError ? 422 : 500).send(
            mailboxError
                ? error.message
                : "Failed to create/send test email. Check the server log."
        );
    }
});

// ----- Excel / Office Script endpoint -----

app.options("/generate-report-json", officeScriptCors);

app.post(
    "/generate-report-json",
    officeScriptCors,
    authenticateExcelRequest,
    async (req, res) => {
        if (!isShippingReport(req.body)) {
            return res.status(400).json({
                success: false,
                message: "Invalid shipping report."
            });
        }

        try {
            const { html, images } = generateHtml(req.body);

            const debugPath = path.join(__dirname, "debug-office.html");

            fs.writeFileSync(debugPath, html, "utf8");

            console.log("DEBUG Office Script HTML written to:", debugPath);
            console.log("DEBUG HTML length:", html.length);
            console.log("DEBUG @media:", html.includes("@media"));

            const draft = await createReportDraft({
                subject: process.env.DAILY_REPORT_SUBJECT || "Daily Shipping Report",
                html,
                images
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

app.get("/preview", (req, res) => {
    try {
        // Clear cache so changes to generator.js are instantly reflected
        delete require.cache[require.resolve('./generator')];
        const freshGenerateHtml = require('./generator');
        
        const report = parseShippingReport(testWorkbookPath);
        const { html } = freshGenerateHtml(report, { isPreview: true });
        
        // Inject a meta refresh tag to automatically reload the page every 2 seconds for live preview
        const finalHtml = html.replace('</head>', '    <meta http-equiv="refresh" content="2">\n</head>');
        res.send(finalHtml);
    } catch (error) {
        res.status(500).send("Error generating preview: " + error.message);
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
