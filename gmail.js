const {
    getGmailClient
} = require("./gmail-auth");


function createMimeMessage({
    to,
    subject,
    html
}) {
    const mimeMessage = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        'Content-Type: text/html; charset="UTF-8"',
        "",
        html
    ].join("\r\n");

    return Buffer
        .from(mimeMessage, "utf8")
        .toString("base64url");
}


async function createGmailDraft({
    tokens,
    to,
    subject,
    html
}) {
    const gmail = getGmailClient(tokens);
    const raw = createMimeMessage({
        to,
        subject,
        html
    });
    const response =
        await gmail.users.drafts.create({
            userId: "me",
            requestBody: {
                message: {
                    raw
                }
            }
        });
    return response.data;
}

async function sendGmailDraft({
    tokens,
    draftId
}) {
    const gmail = getGmailClient(tokens);
    const response =
        await gmail.users.drafts.send({
            userId: "me",

            requestBody: {
                id: draftId
            }
        });
    return response.data;
}

module.exports = {
    createGmailDraft,
    sendGmailDraft
};