const fs = require("fs");
const path = require("path");

const TOKEN_PATH = path.join(
    __dirname,
    "google-token.json"
);

const { google } = require("googleapis");

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.compose"
];

const redirectUri = process.env.GOOGLE_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
);


// Generate Google's login URL
function getGoogleAuthUrl(state) {
    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
        prompt: "consent",
        state
    });
}


// Exchange Google's authorization code for tokens
async function getGoogleTokens(code) {
    const { tokens } = await oauth2Client.getToken(code);

    fs.writeFileSync(
        TOKEN_PATH,
        JSON.stringify(tokens, null, 2)
    );

    return tokens;
}

function getStoredGoogleTokens() {

    if (!fs.existsSync(TOKEN_PATH)) {
        throw new Error(
            "Google has not been authenticated yet."
        );
    }

    return JSON.parse(
        fs.readFileSync(TOKEN_PATH, "utf8")
    );
}

// Create an authenticated Gmail client from tokens
function getGmailClient(tokens) {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );

    client.setCredentials(tokens);

    return google.gmail({
        version: "v1",
        auth: client
    });
}


module.exports = {
    getGoogleAuthUrl,
    getGoogleTokens,
    getGmailClient,
    getStoredGoogleTokens
};
