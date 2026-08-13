const fs = require("fs");
const path = require("path");
const msal = require("@azure/msal-node");

const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
const authorityTenant = process.env.MICROSOFT_AUTHORITY_TENANT ||
    process.env.MICROSOFT_TENANT_ID ||
    "organizations";
const tokenCachePath = process.env.MICROSOFT_TOKEN_CACHE_PATH || path.join(
    __dirname,
    "microsoft-token-cache.json"
);

if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    throw new Error("MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET are required.");
}

if (!redirectUri) {
    throw new Error("MICROSOFT_REDIRECT_URI is required.");
}

const scopes = [
    "openid",
    "profile",
    "offline_access",
    "Mail.ReadWrite",
    ...(process.env.MICROSOFT_ALLOW_SEND === "true" ? ["Mail.Send"] : [])
];

// MSAL's default cache is memory-only. Persisting it lets the unattended Excel
// endpoint acquire a fresh access token after the first interactive sign-in.
// For production, put this cache in an encrypted secret store or database.
const cachePlugin = {
    beforeCacheAccess: async (cacheContext) => {
        if (fs.existsSync(tokenCachePath)) {
            cacheContext.tokenCache.deserialize(
                await fs.promises.readFile(tokenCachePath, "utf8")
            );
        }
    },
    afterCacheAccess: async (cacheContext) => {
        if (cacheContext.cacheHasChanged) {
            await fs.promises.writeFile(
                tokenCachePath,
                cacheContext.tokenCache.serialize(),
                { mode: 0o600 }
            );
        }
    }
};

const cca = new msal.ConfidentialClientApplication({
    auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        // "common" accepts both work/school and personal Microsoft accounts.
        // A specific tenant is appropriate only when the sending mailbox is
        // definitely an Exchange Online mailbox in that tenant.
        authority: `https://login.microsoftonline.com/${authorityTenant}/`,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET
    },
    cache: { cachePlugin }
});

async function getMicrosoftLoginUrl(state) {
    return cca.getAuthCodeUrl({
        scopes,
        redirectUri,
        prompt: "select_account",
        state
    });
}

async function getMicrosoftTokenFromCode(code) {
    return cca.acquireTokenByCode({
        code,
        scopes,
        redirectUri
    });
}

async function getMicrosoftAccessToken({ accountHomeId, username } = {}) {
    const accounts = await cca.getTokenCache().getAllAccounts();
    const requestedUsername = (username || process.env.MICROSOFT_SENDING_ACCOUNT || "")
        .trim()
        .toLowerCase();
    const account = accountHomeId
        ? accounts.find((candidate) => candidate.homeAccountId === accountHomeId)
        : requestedUsername
            ? accounts.find(
                (candidate) => candidate.username.toLowerCase() === requestedUsername
            )
            : accounts.length === 1
                ? accounts[0]
                : undefined;

    if (!account) {
        throw new Error(
            requestedUsername
                ? `The configured Microsoft account (${requestedUsername}) has not been authenticated.`
                : "Microsoft has not been authenticated, or more than one account is cached. Set MICROSOFT_SENDING_ACCOUNT."
        );
    }

    const token = await cca.acquireTokenSilent({ account, scopes });
    return token.accessToken;
}

module.exports = {
    getMicrosoftLoginUrl,
    getMicrosoftTokenFromCode,
    getMicrosoftAccessToken
};
