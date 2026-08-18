const { getStoredGoogleTokens } = require("./gmail-auth");
const { createGmailDraft, sendGmailDraft } = require("./gmail");
const { getMicrosoftAccessToken } = require("./auth");
const {
    createMicrosoftDraft,
    sendMicrosoftDraft
} = require("./graph");

function selectedProvider() {
    const provider = (process.env.EMAIL_PROVIDER || "microsoft").toLowerCase();

    if (!["gmail", "microsoft"].includes(provider)) {
        throw new Error("EMAIL_PROVIDER must be either gmail or microsoft.");
    }

    return provider;
}

function reportRecipients() {
    const recipients = (process.env.REPORT_RECIPIENTS || "")
        .split(/[;,]/)
        .map((address) => address.trim())
        .filter(Boolean);

    if (recipients.length === 0) {
        throw new Error("REPORT_RECIPIENTS must contain at least one email address.");
    }
    return recipients;
}

async function createReportDraft({
    recipient,
    html,
    images,
    subject,
    provider = selectedProvider(),
    microsoftAccountHomeId
}) {
    const to = reportRecipients(recipient);

    if (provider === "gmail") {
        const draft = await createGmailDraft({
            tokens: getStoredGoogleTokens(),
            to: to.join(", "),
            subject,
            html,
            images
        });

        return { provider, id: draft.id };
    }

    const accessToken = await getMicrosoftAccessToken({
        accountHomeId: microsoftAccountHomeId
    });
    const draft = await createMicrosoftDraft({ to, subject, html, accessToken, images });

    return { provider, id: draft.id };
}

async function sendReportDraft({
    provider = selectedProvider(),
    draftId,
    microsoftAccountHomeId
}) {
    if (provider === "gmail") {
        await sendGmailDraft({
            tokens: getStoredGoogleTokens(),
            draftId
        });
        return;
    }

    if (process.env.MICROSOFT_ALLOW_SEND !== "true") {
        throw new Error("Set MICROSOFT_ALLOW_SEND=true and sign in again before sending with Microsoft Graph.");
    }

    await sendMicrosoftDraft(draftId, await getMicrosoftAccessToken({
        accountHomeId: microsoftAccountHomeId
    }));
}

module.exports = {
    createReportDraft,
    sendReportDraft,
    selectedProvider
};
